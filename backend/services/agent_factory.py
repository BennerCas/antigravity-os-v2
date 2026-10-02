"""
AgentFactory - Motor Universal de Agentes de Antigravity_OS_v2

Fusiona tres fuentes:
  1. Agents Module (skills_v2.json)  - Personalidad y Rol del agente
  2. Atlas Module  (prompts_db.json) - Master Prompts y conocimiento tecnico
  3. Antigravity SDK                 - Herramientas, multi-agent, policies
"""
import os
import json
import psutil
from typing import List, Callable, Optional, Dict, Any

import os
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "dummy_key_for_ollama")
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

# Remove GEMINI_API_BASE_URL if it was set to free.ai to ensure we hit the real Google API
if "GEMINI_API_BASE_URL" in os.environ:
    del os.environ["GEMINI_API_BASE_URL"]


from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

_BASE = r"C:\antigravityAS\Antigravity_OS_v2\apps\web-app\public"
SKILLS_PATH  = os.path.join(_BASE, "skills_v2.json")
PROMPTS_PATH = os.path.join(_BASE, "prompts_db.json")


def obtener_estado_memoria() -> str:
    """[Tool] Retorna el uso actual de CPU y RAM del sistema operativo local."""
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=0.1)
    return (
        f"CPU: {cpu}% | "
        f"RAM Total: {mem.total/(1024**3):.1f}GB | "
        f"Disponible: {mem.available/(1024**3):.1f}GB | "
        f"Uso: {mem.percent}%"
    )


def leer_documentacion_nodos(nodo_tipo: str) -> str:
    """[Tool] Retorna documentacion sobre un tipo de nodo en FlowBoard."""
    docs: Dict[str, str] = {
        "AI":        "Nodo AI: ejecuta un modelo de inteligencia artificial con un prompt configurable.",
        "CONDITION": "Nodo CONDITION: bifurca el flujo segun una expresion booleana (True/False).",
        "ACTION":    "Nodo ACTION: ejecuta codigo Python o una peticion HTTP.",
        "INPUT":     "Nodo INPUT: punto de entrada del flujo, recibe datos iniciales.",
        "OUTPUT":    "Nodo OUTPUT: punto final del flujo, emite el resultado procesado.",
        "LOOP":      "Nodo LOOP: itera sobre una lista de items aplicando sub-flujo.",
        "TRANSFORM": "Nodo TRANSFORM: aplica una transformacion de datos (map/filter/reduce).",
    }
    key = nodo_tipo.strip().upper()
    return docs.get(key, f"Nodo '{nodo_tipo}' no documentado. Considera crear un nodo custom.")


def listar_agentes_disponibles() -> str:
    """[Tool] Lista los agentes registrados en el modulo Agents (skills_v2.json)."""
    if not os.path.exists(SKILLS_PATH):
        return "No se encontro el catalogo de agentes."
    try:
        with open(SKILLS_PATH, encoding="utf-8") as f:
            skills = json.load(f)
        names = [s.get("name", s.get("id", "?")) for s in skills[:20]]
        return f"Agentes disponibles ({len(skills)} total): " + ", ".join(names)
    except Exception as e:
        return f"Error leyendo catalogo: {e}"


def buscar_en_atlas(query: str) -> str:
    """[Tool] Busca un Master Prompt en el modulo Atlas (prompts_db.json)."""
    if not os.path.exists(PROMPTS_PATH):
        return "No se encontro la base de Atlas."
    try:
        with open(PROMPTS_PATH, encoding="utf-8") as f:
            prompts = json.load(f)
        q = query.lower()
        matches = [
            p for p in prompts
            if q in p.get("title", "").lower() or q in p.get("content", "").lower()
        ]
        if not matches:
            return f"No se encontraron entradas de Atlas para: {query}"
        top = matches[:3]
        return "\n---\n".join(
            f"[{p.get('title','?')}]: {p.get('content','')[:400]}..." for p in top
        )
    except Exception as e:
        return f"Error buscando en Atlas: {e}"



import asyncio

def actualizar_checklist(tarea_id: str, estado: str) -> str:
    """[Tool] Actualiza dinamicamente el 'Radar de Arquitectura' (Checklist) en el frontend.
    IDs validos: 'triage', 'blueprint', 'deploy', o nuevos IDs que tu crees. estado puede ser 'completed', 'in_progress', 'failed', 'pending'."""
    try:
        from routers.studio import manager
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast({
                "type": "UPDATE_CHECKLIST",
                "payload": {"taskId": tarea_id, "status": estado}
            }))
        return f"Checklist actualizado: {tarea_id} -> {estado}"
    except Exception as e:
        return f"Error al actualizar checklist: {e}"

TOOL_REGISTRY: List[Callable] = [
    actualizar_checklist,

    obtener_estado_memoria,
    leer_documentacion_nodos,
    listar_agentes_disponibles,
    buscar_en_atlas,
]


def _cargar_perfil_agente(agent_id: str) -> str:
    fallback = (
        f"Eres un asistente experto llamado '{agent_id}' dentro de Antigravity_OS_v2. "
        "Responde SIEMPRE en espanol, con claridad y precision tecnica."
    )
    if not os.path.exists(SKILLS_PATH):
        return fallback
    try:
        with open(SKILLS_PATH, encoding="utf-8") as f:
            skills = json.load(f)
        for s in skills:
            if s.get("id") == agent_id or s.get("name") == agent_id:
                return s.get("instructions") or s.get("description") or fallback
    except Exception:
        pass
    return fallback


def _cargar_conocimiento_atlas(atlas_knowledge_id: str) -> str:
    if not os.path.exists(PROMPTS_PATH):
        return ""
    try:
        with open(PROMPTS_PATH, encoding="utf-8") as f:
            prompts = json.load(f)
        for p in prompts:
            if p.get("id") == atlas_knowledge_id or p.get("title") == atlas_knowledge_id:
                return p.get("content", "")
    except Exception:
        pass
    return ""


def ensamblar_instrucciones(
    agent_id: str,
    atlas_knowledge_id: Optional[str] = None,
    override_instructions: Optional[str] = None,
) -> str:
    base = override_instructions or _cargar_perfil_agente(agent_id)
    if atlas_knowledge_id:
        atlas = _cargar_conocimiento_atlas(atlas_knowledge_id)
        if atlas:
            base = f"{base}\n\n## CONOCIMIENTO MAESTRO DE ATLAS\n{atlas}"
    
    # We do NOT append global rules here anymore to prevent overriding Meta-Prompting.
    # The agent system prompts are strict enough.
    return base


class AgentFactory:
    """Fabrica Universal de Agentes de Antigravity_OS_v2."""

    @classmethod
    def build_config(
        cls,
        agent_id: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
    ) -> LocalAgentConfig:
        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions
        )
        all_tools = TOOL_REGISTRY.copy() if use_tools else []
        if extra_tools:
            all_tools.extend(extra_tools)
        return LocalAgentConfig(
            api_key=GEMINI_API_KEY,
            system_instructions=system_instructions,
            tools=all_tools,
            capabilities=CapabilitiesConfig(enable_subagents=False),
            model=model or None,
        )

    @classmethod
    async def chat_one_shot(
        cls,
        agent_id: str,
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
    ) -> str:
        import os
        
        # --- QUANTUM ROUTING: Bypassear a Ollama local si no hay herramientas ---
        use_ollama = os.getenv("ACTIVE_MODEL") == "ollama" or (model and (":" in model or "hermes" in model))
        if not use_tools:
            use_ollama = True 
            
        if use_ollama:
            import httpx
            system_instructions = ensamblar_instrucciones(
                agent_id, atlas_knowledge_id, override_instructions
            )
            ollama_model = model or os.getenv("OLLAMA_MODEL", "hermes3:8b")
            ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
            if not ollama_url.endswith("/v1"):
                ollama_url += "/v1"
                
            payload = {
                "model": ollama_model,
                "messages": [
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "options": {"num_ctx": 8192},
            }
            
            all_tools = []
            if use_tools:
                import inspect
                all_tools = TOOL_REGISTRY.copy()
                if extra_tools:
                    all_tools.extend(extra_tools)
                tools_payload = []
                for t in all_tools:
                    sig = inspect.signature(t)
                    props = {}
                    for name, param in sig.parameters.items():
                        props[name] = {"type": "string"}
                    tools_payload.append({
                        "type": "function",
                        "function": {
                            "name": t.__name__,
                            "description": t.__doc__ or "",
                            "parameters": {
                                "type": "object",
                                "properties": props,
                                "required": list(sig.parameters.keys())
                            }
                        }
                    })
                if tools_payload:
                    payload["tools"] = tools_payload

            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(f"{ollama_url}/chat/completions", json=payload)
                    if resp.status_code == 404 or "model not found" in resp.text.lower():
                        tags_resp = await client.get(f"{ollama_url.replace('/v1', '/api/tags')}")
                        if tags_resp.status_code == 200:
                            models = tags_resp.json().get("models", [])
                            if models:
                                payload["model"] = models[-1]["name"]
                                print(f"[Quantum Routing] Modelo original no encontrado. Usando fallback local: {payload['model']}")
                                resp = await client.post(f"{ollama_url}/chat/completions", json=payload)
                    resp.raise_for_status()
                    
                    data = resp.json()
                    message = data["choices"][0]["message"]
                    
                    # Tool Loop handling (only 1 depth for now)
                    if message.get("tool_calls"):
                        tool_calls = message["tool_calls"]
                        payload["messages"].append(message)
                        for tc in tool_calls:
                            func_name = tc["function"]["name"]
                            args = json.loads(tc["function"]["arguments"])
                            
                            # Execute local tool
                            tool_result = "Tool not found"
                            for t in all_tools:
                                if t.__name__ == func_name:
                                    import inspect
                                    if inspect.iscoroutinefunction(t):
                                        tool_result = await t(**args)
                                    else:
                                        tool_result = t(**args)
                                    break
                            
                            payload["messages"].append({
                                "role": "tool",
                                "name": func_name,
                                "content": str(tool_result)
                            })
                            
                        # Second call after tool execution
                        resp2 = await client.post(f"{ollama_url}/chat/completions", json=payload)
                        resp2.raise_for_status()
                        return resp2.json()["choices"][0]["message"]["content"]
                    else:
                        return message["content"]
            except Exception as e:
                import traceback
                traceback.print_exc()
                return f"[AgentFactory Error] El enjambre cuantico local fallo: Ollama no respondio correctamente. Verifica que este corriendo. Detalle: {e}"

                
        # --- RUTEO POR DEFECTO: Google Antigravity SDK ---
        config = cls.build_config(
            agent_id=agent_id,
            atlas_knowledge_id=atlas_knowledge_id,
            override_instructions=override_instructions,
            extra_tools=extra_tools,
            model=model, use_tools=use_tools,
        )
        try:
            async with Agent(config) as agent:
                response = await agent.chat(user_prompt)
                return await response.text()
        except Exception as e:
            return f"[AgentFactory Error] {type(e).__name__}: {e}"

    @classmethod
    async def swarm_chat(
        cls,
        agent_ids: List[str],
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        accumulated_context = user_prompt
        for agent_id in agent_ids:
            response = await cls.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                atlas_knowledge_id=atlas_knowledge_id,
            )
            results.append({"agent": agent_id, "response": response})
            accumulated_context = f"{accumulated_context}\n\n[Respuesta de {agent_id}]: {response}"
        return results


