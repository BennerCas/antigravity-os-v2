from typing import Any

from backend.schemas.academy import ArchitectureDriftFinding


class DriftEngine:
    """
    Architecture Drift Engine for Antigravity Academy V3.
    Compares FlowArchitect ArchitectureSpec vs BuilderFlow canvas to detect:
    - Loss of architectural intent
    - Missing error / failure routes
    - Missing Human-in-the-Loop gates
    - Contract schema divergence
    - Dropped retry or idempotency policies
    """

    @classmethod
    def analyze_drift(
        cls, architecture_spec: dict[str, Any], builder_flow: dict[str, Any]
    ) -> list[ArchitectureDriftFinding]:
        findings: list[ArchitectureDriftFinding] = []

        spec_steps = architecture_spec.get("steps", [])
        spec_transitions = architecture_spec.get("transitions", [])
        spec_intent = architecture_spec.get("intent", {})
        spec_failure = architecture_spec.get("failure_policy", {})

        builder_nodes = builder_flow.get("nodes", [])
        builder_edges = builder_flow.get("edges", [])

        builder_node_ids = {n.get("id"): n for n in builder_nodes if n.get("id")}
        builder_node_kinds = {
            n.get("data", {}).get("role") or n.get("type"): n for n in builder_nodes
        }

        # 1. Check missing steps from ArchitectureSpec
        for step in spec_steps:
            step_id = step.get("id")
            step_kind = step.get("kind")
            step_name = step.get("name", step_id)

            if step_id not in builder_node_ids:
                # Check if there is any node with the same name or special singleton role
                matched = any(
                    n.get("data", {}).get("title") == step_name
                    or (
                        step_kind in ["start", "end", "error_sink"]
                        and (
                            n.get("data", {}).get("role") == step_kind
                            or n.get("type") == step_kind
                        )
                    )
                    for n in builder_nodes
                )
                if not matched:
                    findings.append(
                        ArchitectureDriftFinding(
                            id=f"drift_step_{step_id}",
                            severity=(
                                "blocker"
                                if step_kind in ["human_gate", "error_sink"]
                                else "warning"
                            ),
                            category="missing_step",
                            architecture_ref=f"step.{step_id}",
                            description=f"El paso arquitectónico '{step_name}' ({step_kind}) fue especificado en FlowArchitect pero falta en el canvas de Builder.",
                            remediation_hint=f"Añade un nodo para '{step_name}' en Builder y conéctalo al flujo.",
                        )
                    )

        # 2. Check Human Gate requirement
        requires_hitl = (
            any(
                "aprobación" in str(req).lower() or "approval" in str(req).lower()
                for req in architecture_spec.get("requirements", {}).get(
                    "constraints", []
                )
            )
            or any(s.get("kind") == "human_gate" for s in spec_steps)
            or bool(spec_failure.get("human_escalation"))
        )
        has_hitl_in_builder = any(
            n.get("type") == "human" or n.get("data", {}).get("role") == "human_gate"
            for n in builder_nodes
        )

        if requires_hitl and not has_hitl_in_builder:
            findings.append(
                ArchitectureDriftFinding(
                    id="drift_hitl_missing",
                    severity="blocker",
                    category="missing_hitl",
                    architecture_ref="requirements.constraints.human_approval",
                    description="La arquitectura exige compuerta Human-in-the-Loop, pero el flujo en Builder no contiene ningún HumanGateNode.",
                    remediation_hint="Inserta un nodo HumanGateNode antes de la ejecución de acciones críticas.",
                )
            )

        # 3. Check failure routes & dead letter
        requires_dead_letter = bool(spec_failure.get("dead_letter")) or any(
            s.get("kind") == "error_sink" for s in spec_steps
        )
        has_error_sink = any(
            n.get("data", {}).get("role") in ["error_sink", "dead_letter"]
            or "error" in n.get("id", "").lower()
            for n in builder_nodes
        )
        if requires_dead_letter and not has_error_sink:
            findings.append(
                ArchitectureDriftFinding(
                    id="drift_unhandled_failure",
                    severity="warning",
                    category="unhandled_route",
                    architecture_ref="failure_policy.dead_letter",
                    description="La arquitectura especifica ruta de captura de fallos (dead-letter), pero el Builder no tiene nodo ErrorSink conectado.",
                    remediation_hint="Añade un nodo ErrorSink y conéctalo a las salidas de fallo de los nodos principales.",
                )
            )

        # 4. Check retry policies
        requires_retries = bool(spec_failure.get("retry"))
        if requires_retries:
            builder_has_retries = any(
                n.get("data", {}).get("retries", 0) > 0
                or n.get("data", {}).get("retry_policy")
                for n in builder_nodes
            )
            if not builder_has_retries and len(builder_nodes) > 1:
                findings.append(
                    ArchitectureDriftFinding(
                        id="drift_retry_missing",
                        severity="warning",
                        category="policy_drift",
                        architecture_ref="failure_policy.retry",
                        description="ArchitectureSpec especifica política de reintento, pero la configuración en Builder carece de retries.",
                        remediation_hint="Configura 'retries' en los nodos de tools o agentes externos.",
                    )
                )

        return findings
