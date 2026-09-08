import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import db
from backend.schemas.academy import MissionSession, ValidationFinding
from backend.services.academy.catalog_service import CatalogService
from backend.services.academy.validator_service import ValidatorService


class SandboxService:
    """
    Manages isolated learning sandboxes for student missions.
    Provides fake capability adapters, state resets, reproducible execution traces,
    and secure cloning to the main user workspace with mandatory re-validation.
    """

    FAKE_CAPABILITIES: Dict[str, Dict[str, Any]] = {
        "fake.slack.notify": {
            "name": "Sandbox Slack Notifier",
            "mock_response": {"status": "delivered", "channel": "#learning-sandbox", "timestamp": "2026-09-08T18:00:00Z"},
            "requires_auth": True,
            "credential_scope": "vault://credentials/slack_sandbox"
        },
        "fake.erp.invoice_sync": {
            "name": "Sandbox ERP Sync",
            "mock_response": {"invoice_id": "INV-MOCK-9942", "synced": True, "currency": "USD"},
            "requires_auth": True,
            "credential_scope": "vault://credentials/erp_sandbox"
        },
        "fake.database.query": {
            "name": "Sandbox DB Query",
            "mock_response": {"records": [{"id": 1, "customer": "Acme Corp", "tier": "VIP"}]},
            "requires_auth": False
        }
    }

    @classmethod
    def start_session(cls, user_id: str, mission_id: str) -> MissionSession:
        mission = CatalogService.get_mission(mission_id)
        if not mission:
            raise ValueError(f"Mission '{mission_id}' not found in catalog.")

        session_id = f"sess_{int(datetime.now(timezone.utc).timestamp())}_{mission_id}"
        
        session_dict = {
            "id": session_id,
            "user_id": user_id,
            "mission_id": mission_id,
            "status": "started",
            "current_step": 1,
            "sandbox_flow": mission.starter_flow or {"nodes": [], "edges": []},
            "hints_revealed": [],
            "reflections": [],
            "rubric_results": {},
            "findings": [],
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
        }
        saved = db.mission_session_create(session_dict)
        return MissionSession(**saved)

    @classmethod
    def get_session(cls, session_id: str) -> Optional[MissionSession]:
        data = db.mission_session_get(session_id)
        if not data:
            return None
        return MissionSession(**data)

    @classmethod
    def update_flow(cls, session_id: str, flow: Dict[str, Any]) -> MissionSession:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")
        
        # Run live findings check on every flow update
        findings = ValidatorService.validate_flow(flow, session.get("mission_id"))
        findings_dicts = [f.model_dump() for f in findings]

        updated = db.mission_session_update(
            session_id,
            {"sandbox_flow": flow, "findings": findings_dicts}
        )
        return MissionSession(**updated)

    @classmethod
    def reset_session(cls, session_id: str) -> MissionSession:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        mission = CatalogService.get_mission(session["mission_id"])
        starter = mission.starter_flow if mission else {"nodes": [], "edges": []}

        updated = db.mission_session_update(
            session_id,
            {
                "sandbox_flow": starter,
                "hints_revealed": [],
                "reflections": [],
                "findings": [],
                "status": "started"
            }
        )
        return MissionSession(**updated)

    @classmethod
    def run_simulation(cls, session_id: str, input_payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        flow = session.get("sandbox_flow", {})
        nodes = flow.get("nodes", [])
        edges = flow.get("edges", [])

        # Validate first
        findings = ValidatorService.validate_flow(flow, session.get("mission_id"))
        has_blockers = any(f.severity == "blocking" for f in findings)

        if has_blockers:
            return {
                "status": "error",
                "message": "La simulación no puede ejecutarse debido a errores bloqueantes en el flujo.",
                "findings": [f.model_dump() for f in findings],
                "execution_trace": []
            }

        # Simulate execution path
        trace: List[Dict[str, Any]] = []
        now_str = datetime.now(timezone.utc).isoformat()
        current_data = input_payload or {"message": "Solicitud de prueba del alumno", "amount": "USD 1,250.00"}

        trace.append({
            "step": 0,
            "event": "run_started",
            "timestamp": now_str,
            "payload": current_data
        })

        for i, node in enumerate(nodes):
            nid = node.get("id")
            ndata = node.get("data", {})
            title = ndata.get("title", nid)
            role = ndata.get("role", node.get("type", "node"))

            step_trace = {
                "step": i + 1,
                "node_id": nid,
                "title": title,
                "role": role,
                "status": "success",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "inputs": current_data
            }

            # Check if it's a capability call
            cap_id = ndata.get("capability_id")
            if cap_id and cap_id in cls.FAKE_CAPABILITIES:
                step_trace["capability_executed"] = cap_id
                step_trace["capability_receipt"] = cls.FAKE_CAPABILITIES[cap_id]["mock_response"]
            
            # Check transform
            if "transform" in role.lower() or "parse" in title.lower():
                current_data = {"parsed_number": 1250.0, "amount": 1250.0, "currency": "USD"}
                step_trace["outputs"] = current_data
            elif "classifier" in role.lower():
                current_data = {"category": "tecnico", "confidence": 0.94}
                step_trace["outputs"] = current_data
            else:
                step_trace["outputs"] = {"processed": True, **current_data}

            trace.append(step_trace)

        trace.append({
            "step": len(nodes) + 1,
            "event": "run_completed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "final_outputs": current_data
        })

        return {
            "status": "success",
            "message": "Simulación de sandbox completada con éxito.",
            "execution_trace": trace,
            "final_data": current_data,
            "findings": [f.model_dump() for f in findings]
        }

    @classmethod
    def clone_to_workspace(cls, session_id: str) -> Dict[str, Any]:
        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        flow = session.get("sandbox_flow", {})
        findings = ValidatorService.validate_flow(flow, session.get("mission_id"))
        blockers = [f for f in findings if f.severity == "blocking"]

        if blockers:
            raise ValueError(
                f"No se puede clonar al workspace: Existen {len(blockers)} errores bloqueantes. "
                f"Ejemplo: {blockers[0].message}"
            )

        mission = CatalogService.get_mission(session["mission_id"])
        mission_title = mission.title if mission else session["mission_id"]

        workspace_flow_id = f"flow_academy_{session['mission_id']}_{uuid.uuid4().hex[:6]}"
        workspace_flow = {
            "id": workspace_flow_id,
            "name": f"[Academy] {mission_title}",
            "description": f"Flujo promovido desde Antigravity Academy (Sesión: {session_id})",
            "nodes": flow.get("nodes", []),
            "edges": flow.get("edges", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        db.flow_upsert(workspace_flow)

        return {
            "status": "success",
            "message": "Flujo validado y clonado con éxito en tu workspace de producción.",
            "flow_id": workspace_flow_id,
            "flow_name": workspace_flow["name"]
        }
