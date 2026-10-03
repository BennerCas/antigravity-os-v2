import json
import os
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, List, Optional

from backend.model_defaults import DEFAULT_LOCAL_MODEL, normalize_local_model
from backend.services.agent_factory import AgentFactory

RUNS_DIR = Path(__file__).resolve().parent.parent / "registries" / "swarm_runs"
RUNS_DIR.mkdir(parents=True, exist_ok=True)

BroadcastFn = Optional[Callable[[dict], Awaitable[None]]]


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _slug(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return cleaned or uuid.uuid4().hex[:8]


def _extract_artifacts(text: str) -> List[Dict[str, str]]:
    artifacts: List[Dict[str, str]] = []
    for match in re.finditer(r'<artifact\s+name="([^"]+)">([\s\S]*?)(?:</artifact>|$)', text or '', flags=re.I):
        artifacts.append({
            "name": match.group(1).strip(),
            "content": match.group(2).strip(),
        })
    return artifacts


def _infer_contract(node: Dict[str, Any]) -> str:
    data = node.get("data") or {}
    return str(data.get("inputOutputContract") or data.get("contract") or data.get("responseFormat") or "").strip()


def _evaluate_contract(contract: str, response: str) -> Dict[str, str]:
    contract_l = (contract or "").lower()
    response = re.sub(r'<thinking>[\s\S]*?</thinking>', '', response or '', flags=re.I).strip()
    if not contract_l:
        return {"status": "PASS", "reason": "Sin contrato explícito"}
    if "json" in contract_l:
        candidate = response
        fence = re.search(r'```(?:json)?\s*([\s\S]*?)```', response, flags=re.I)
        if fence:
            candidate = fence.group(1).strip()
        try:
            json.loads(candidate)
            return {"status": "PASS", "reason": "JSON válido"}
        except Exception:
            return {"status": "FAIL", "reason": "El contrato pide JSON y la salida no parsea"}
    if "html" in contract_l or "tsx" in contract_l or "jsx" in contract_l:
        if "<" in response and ">" in response:
            return {"status": "PASS", "reason": "Salida con estructura markup/código"}
        return {"status": "FAIL", "reason": "El contrato pide artefacto visual/código y no se detectó markup"}
    if "markdown" in contract_l or "md" in contract_l:
        if any(token in response for token in ["#", "- ", "1."]):
            return {"status": "PASS", "reason": "Salida con estructura markdown"}
        return {"status": "FAIL", "reason": "El contrato pide markdown y la salida parece plana"}
    return {"status": "PASS", "reason": "Contrato no requiere validador especial"}


def _sorted_nodes(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not nodes:
        return []
    node_map = {str(node.get("id")): node for node in nodes if node.get("id") is not None}
    indegree = {node_id: 0 for node_id in node_map}
    graph: Dict[str, List[str]] = {node_id: [] for node_id in node_map}
    for edge in edges or []:
        source = str(edge.get("source"))
        target = str(edge.get("target"))
        if source in graph and target in indegree:
            graph[source].append(target)
            indegree[target] += 1
    queue = [node_map[node_id] for node_id, degree in indegree.items() if degree == 0]
    ordered: List[Dict[str, Any]] = []
    seen = set()
    while queue:
        node = queue.pop(0)
        node_id = str(node.get("id"))
        if node_id in seen:
            continue
        seen.add(node_id)
        ordered.append(node)
        for nxt in graph.get(node_id, []):
            indegree[nxt] -= 1
            if indegree[nxt] <= 0:
                queue.append(node_map[nxt])
    for node in nodes:
        node_id = str(node.get("id"))
        if node_id not in seen:
            ordered.append(node)
    executable = []
    for node in ordered:
        data = node.get("data") or {}
        kind = str(data.get("kind") or node.get("type") or "").lower()
        if kind in {"artifact", "input", "output", "trigger"}:
            continue
        executable.append(node)
    return executable or ordered


class SwarmRuntimeService:
    def list_runs(self) -> List[Dict[str, Any]]:
        runs: List[Dict[str, Any]] = []
        for file in RUNS_DIR.glob('*.json'):
            try:
                runs.append(json.loads(file.read_text(encoding='utf-8')))
            except Exception:
                continue
        runs.sort(key=lambda item: item.get('updated_at') or item.get('created_at') or '', reverse=True)
        return runs

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        file = RUNS_DIR / f'{run_id}.json'
        if not file.exists():
            return None
        try:
            return json.loads(file.read_text(encoding='utf-8'))
        except Exception:
            return None

    def _save_run(self, run: Dict[str, Any]) -> None:
        file = RUNS_DIR / f"{run['id']}.json"
        file.write_text(json.dumps(run, ensure_ascii=False, indent=2) + "\n", encoding='utf-8')

    async def _broadcast(self, payload: dict, broadcast: BroadcastFn) -> None:
        if broadcast is None:
            return
        try:
            await broadcast(payload)
        except Exception:
            pass

    async def execute_swarm(self, objective: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]], model: Optional[str] = None, broadcast: BroadcastFn = None) -> Dict[str, Any]:
        run_id = uuid.uuid4().hex
        runtime_model = normalize_local_model(model or DEFAULT_LOCAL_MODEL)
        ordered_nodes = _sorted_nodes(nodes, edges)
        run = {
            "id": run_id,
            "name": _slug(objective)[:64],
            "objective": objective,
            "model": runtime_model,
            "status": "running",
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
            "node_count": len(ordered_nodes),
            "steps": [],
            "artifacts": [],
            "final_output": "",
        }
        self._save_run(run)
        await self._broadcast({"type": "SWARM_RUN_EVENT", "payload": {"runId": run_id, "status": "running"}}, broadcast)
        await self._broadcast({"type": "ACTIVITY_LOG", "log": {"source": "Swarm Runtime", "message": f"Ejecutando swarm con {len(ordered_nodes)} nodos sobre {runtime_model}.", "status": "PENDING"}}, broadcast)

        context = f"OBJETIVO PRINCIPAL\n{objective.strip()}"
        artifacts: List[Dict[str, str]] = []
        for index, node in enumerate(ordered_nodes, start=1):
            data = node.get("data") or {}
            node_name = str(data.get("label") or data.get("name") or node.get("id") or f"Nodo {index}")
            agent_id = str(data.get("agentId") or data.get("id") or _slug(node_name))
            node_role = str(data.get("role") or data.get("description") or data.get("prompt") or node_name)
            contract = _infer_contract(node)
            node_prompt = (
                f"Objetivo del swarm:\n{objective}\n\n"
                f"Nodo actual: {node_name}\n"
                f"Rol del nodo: {node_role}\n"
                f"Contrato esperado: {contract or 'Sin contrato explícito'}\n\n"
                f"Contexto acumulado hasta ahora:\n{context}\n\n"
                f"Tu tarea: produce la siguiente contribución especializada para el swarm. Si generas un artefacto visible, envuélvelo en <artifact name=\"Nombre\">...</artifact>."
            )
            await self._broadcast({"type": "ACTIVITY_LOG", "log": {"source": node_name, "message": f"Nodo {index}/{len(ordered_nodes)} en ejecución.", "status": "PENDING"}}, broadcast)
            response = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=node_prompt,
                override_instructions=str(data.get("systemPrompt") or data.get("description") or data.get("prompt") or f"Eres {node_name}, un nodo especializado del swarm."),
                model=runtime_model,
                use_tools=True,
            )
            eval_result = _evaluate_contract(contract, response)
            step = {
                "index": index,
                "node_id": node.get("id"),
                "node_name": node_name,
                "agent_id": agent_id,
                "contract": contract,
                "contract_status": eval_result["status"],
                "contract_reason": eval_result["reason"],
                "output": response,
                "updated_at": _now_iso(),
            }
            step_artifacts = _extract_artifacts(response)
            if step_artifacts:
                artifacts.extend(step_artifacts)
                step["artifacts"] = step_artifacts
            run["steps"].append(step)
            context = f"{context}\n\n[Salida de {node_name}]\n{response}"
            run["updated_at"] = _now_iso()
            run["artifacts"] = artifacts
            run["final_output"] = response
            self._save_run(run)
            await self._broadcast({"type": "ACTIVITY_LOG", "log": {"source": node_name, "message": f"Nodo completado ({eval_result['status']}).", "status": "APPROVED" if eval_result['status'] == 'PASS' else 'REJECTED'}}, broadcast)
            await self._broadcast({"type": "SWARM_RUN_EVENT", "payload": {"runId": run_id, "status": "running", "lastStep": step}}, broadcast)

        pass_count = sum(1 for step in run["steps"] if step.get("contract_status") == "PASS")
        run["status"] = "completed" if pass_count == len(run["steps"]) else "completed_with_warnings"
        run["updated_at"] = _now_iso()
        run["score"] = round((pass_count / max(len(run["steps"]), 1)) * 100, 1)
        self._save_run(run)
        await self._broadcast({"type": "ACTIVITY_LOG", "log": {"source": "Swarm Runtime", "message": f"Swarm finalizado con score {run['score']}%.", "status": "APPROVED" if run['status'] == 'completed' else 'INFO'}}, broadcast)
        await self._broadcast({"type": "SWARM_RUN_EVENT", "payload": {"runId": run_id, "status": run['status'], "score": run['score'] }}, broadcast)
        return run


swarm_runtime_service = SwarmRuntimeService()
