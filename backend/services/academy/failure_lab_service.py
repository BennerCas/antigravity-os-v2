from typing import Dict, Any, List, Optional
from backend.schemas.academy import FailureScenario


class FailureLabService:
    """
    Failure Lab Service provides controlled, deterministic failure scenarios
    for deliberate error-based learning in Antigravity Academy V3.
    """

    SCENARIOS: List[FailureScenario] = [
        FailureScenario(
            id="fail_schema_mismatch",
            title="Incompatibilidad de Schema (String a Float)",
            category="contract",
            description="El nodo extractor emite 'amount' como texto 'USD 1,250.00', pero la herramienta ERP exige un tipo numérico.",
            symptom="TypeError: '<' not supported between instances of 'str' and 'int'",
            flow_patch={
                "nodes": [
                    {"id": "ag_bad", "type": "action", "position": {"x": 100, "y": 150}, "data": {"title": "Extractor", "role": "agent", "output_type": "string"}},
                    {"id": "erp_target", "type": "action", "position": {"x": 450, "y": 150}, "data": {"title": "ERP Tool", "role": "tool", "input_type": "number"}}
                ],
                "edges": [{"id": "e_fail_schema", "source": "ag_bad", "target": "erp_target"}]
            },
            error_log_sample="[CRITICAL] Payload validation failed for node erp_target: field 'amount' expected float, received string 'USD 1,250.00'",
            root_cause_explanation="El LLM generó un string formateado con moneda y comas. La herramienta transaccional no realiza casting implícito.",
            expected_repair_description="Inserta un nodo Transform (parse_number) o ajusta el schema de salida del agente.",
            validation_rule_id="VAL-CON-001"
        ),
        FailureScenario(
            id="fail_rate_limit",
            title="Rate Limit 429 sin Backoff Exponencial",
            category="reliability",
            description="El proveedor de inferencia responde HTTP 429 Too Many Requests y el flujo aborta sin reintentar.",
            symptom="HTTP 429 Too Many Requests - Provider quota exhausted",
            flow_patch={
                "nodes": [
                    {"id": "ag_rate", "type": "action", "position": {"x": 200, "y": 150}, "data": {"title": "Inferencia Pesada", "role": "agent", "retries": 0}}
                ],
                "edges": []
            },
            error_log_sample="[ERROR] Request failed with status 429. Max retries (0) exceeded. Flow aborted.",
            root_cause_explanation="El nodo no tiene configurada una política de reintento con backoff exponencial y jitter.",
            expected_repair_description="Configura retries >= 3 y backoff_multiplier = 2.0 en la política de ejecución.",
            validation_rule_id="VAL-REL-002"
        ),
        FailureScenario(
            id="fail_duplicate_side_effect",
            title="Doble Efecto Secundario por Reenvío de Webhook",
            category="reliability",
            description="El gateway externo reenvía el webhook de cobro dos veces y el sistema cobra al cliente dos veces.",
            symptom="Duplicate Charge Detected: Order #9822 charged twice",
            flow_patch={
                "nodes": [
                    {"id": "hook_in", "type": "action", "position": {"x": 100, "y": 150}, "data": {"title": "Webhook Ingest", "role": "start"}},
                    {"id": "pay_tool", "type": "action", "position": {"x": 400, "y": 150}, "data": {"title": "Cobrar Tarjeta", "role": "tool", "side_effect": True}}
                ],
                "edges": [{"id": "e_dup", "source": "hook_in", "target": "pay_tool"}]
            },
            error_log_sample="[ALERT] Transaction completed for order #9822. [ALERT] Transaction completed AGAIN for order #9822.",
            root_cause_explanation="El nodo de cobro carece de llave de idempotencia ('idempotency_scope' = 'order_id').",
            expected_repair_description="Establece 'idempotency_scope' = 'order_id' en el nodo de cobro.",
            validation_rule_id="VAL-REL-001"
        ),
        FailureScenario(
            id="fail_unhandled_branch",
            title="Rama False Huérfana en Decisión Crítica",
            category="control_flow",
            description="Una condición evalúa si el score es positivo, pero no define ruta para cuando la condición es falsa.",
            symptom="RuntimeWarning: Execution stalled at node 'Score >= 80': No matching outgoing edge for outcome False",
            flow_patch={
                "nodes": [
                    {"id": "cond_orph", "type": "condition", "position": {"x": 250, "y": 150}, "data": {"title": "Score >= 80", "expression": "score >= 80"}},
                    {"id": "pass_node", "type": "action", "position": {"x": 550, "y": 80}, "data": {"title": "Aprobar", "role": "agent"}}
                ],
                "edges": [{"id": "e_only_true", "source": "cond_orph", "target": "pass_node", "label": "true"}]
            },
            error_log_sample="[FATAL] Unhandled condition branch. Condition evaluated to False but no edge exists for handle 'false'.",
            root_cause_explanation="En un grafo de automatización, las ramas falsas no cubiertas causan pérdida silenciosa de eventos o bloqueos del motor.",
            expected_repair_description="Añade un nodo para la ruta False y conéctalo con el label 'false'.",
            validation_rule_id="VAL-CTL-001"
        ),
        FailureScenario(
            id="fail_expired_gate",
            title="Compuerta Humana Vencida sin Escalación",
            category="human_in_loop",
            description="Un supervisor no responde a tiempo la solicitud de reembolso y el flujo queda en suspensión indefinida.",
            symptom="TimeoutException: HumanGate 'Aprobación Gerencia' expired after 24 hours with no action taken",
            flow_patch={
                "nodes": [
                    {"id": "hitl_stuck", "type": "human", "position": {"x": 250, "y": 150}, "data": {"title": "Aprobación Gerencia", "role": "human_gate"}}
                ],
                "edges": []
            },
            error_log_sample="[ERROR] Task timer expired. No timeout action or fallback route configured. Pipeline frozen.",
            root_cause_explanation="Los procesos que interactúan con humanos deben contemplar invariablemente la ausencia del operador mediante expiración y ruta alternativa.",
            expected_repair_description="Define 'timeout_action' = 'escalate' y conecta la ruta 'timeout'.",
            validation_rule_id="VAL-HITL-001"
        )
    ]

    @classmethod
    def list_scenarios(cls) -> List[FailureScenario]:
        return cls.SCENARIOS

    @classmethod
    def get_scenario(cls, scenario_id: str) -> Optional[FailureScenario]:
        for sc in cls.SCENARIOS:
            if sc.id == scenario_id:
                return sc
        return None

    @classmethod
    def inject_scenario(cls, session_id: str, scenario_id: str) -> Dict[str, Any]:
        import copy
        import db

        scenario = cls.get_scenario(scenario_id)
        if not scenario:
            raise ValueError(f"Scenario '{scenario_id}' not found.")

        session = db.mission_session_get(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        current_flow = copy.deepcopy(session.get("sandbox_flow", {}))
        nodes = current_flow.get("nodes", [])
        edges = current_flow.get("edges", [])

        # In-place chaos injection if learner has an active flow
        mutation_applied = False
        if nodes:
            if scenario_id == "fail_schema_mismatch":
                for n in nodes:
                    ndata = n.setdefault("data", {})
                    role = ndata.get("role", n.get("type", ""))
                    if role in ["agent", "action", "transform"]:
                        ndata["chaos_fault"] = "schema_mismatch"
                        ndata["output_type"] = "string"
                        ndata["output_schema"] = "invalid_string_format"
                        mutation_applied = True
                        break

            elif scenario_id == "fail_rate_limit":
                for n in nodes:
                    ndata = n.setdefault("data", {})
                    role = ndata.get("role", n.get("type", ""))
                    if role in ["agent", "action"]:
                        ndata["chaos_fault"] = "rate_limit_429"
                        ndata["retries"] = 0
                        ndata["backoff_multiplier"] = 1.0
                        mutation_applied = True
                        break

            elif scenario_id == "fail_duplicate_side_effect":
                for n in nodes:
                    ndata = n.setdefault("data", {})
                    if "slack" in ndata.get("title", "").lower() or "erp" in ndata.get("title", "").lower() or ndata.get("role") in ["tool", "action"]:
                        ndata.pop("idempotency_key", None)
                        ndata.pop("idempotency_scope", None)
                        ndata.pop("business_key", None)
                        ndata["side_effect"] = True
                        ndata["chaos_fault"] = "duplicate_side_effect"
                        mutation_applied = True
                        break

            elif scenario_id == "fail_unhandled_branch":
                # Find condition/decision node and strip false edge
                decision_nids = {n.get("id") for n in nodes if n.get("type") in ["condition", "decision"] or n.get("data", {}).get("role") == "decision"}
                if decision_nids:
                    # Filter out edges where source is in decision_nids and label/branch is 'false'
                    edges = [
                        e for e in edges
                        if not (e.get("source") in decision_nids and str(e.get("label", "")).lower() == "false")
                    ]
                    current_flow["edges"] = edges
                    mutation_applied = True

            elif scenario_id == "fail_expired_gate":
                for n in nodes:
                    ndata = n.setdefault("data", {})
                    if n.get("type") == "human" or ndata.get("role") == "human":
                        ndata["timeout_seconds"] = 1
                        ndata["chaos_fault"] = "expired_gate"
                        ndata.pop("timeout_action", None)
                        mutation_applied = True
                        break

        # If no matching node was mutated or flow was empty, inject scenario template
        if not mutation_applied:
            injected_flow = copy.deepcopy(scenario.flow_patch)
        else:
            injected_flow = current_flow

        # Update session with mutated flow and blocked status
        db.mission_session_update(
            session_id,
            {
                "sandbox_flow": injected_flow,
                "status": "blocked"
            }
        )

        return {
            "status": "injected",
            "scenario_id": scenario.id,
            "title": scenario.title,
            "symptom": scenario.symptom,
            "in_place_mutation": mutation_applied,
            "error_log_sample": scenario.error_log_sample,
            "message": "Escenario de fallo inyectado in-situ en tu flujo. Inspecciona el canvas y la traza de ejecución para formular tu hipótesis de reparación."
        }
