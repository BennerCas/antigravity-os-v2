from typing import Dict, Any, List, Set, Optional
from backend.schemas.academy import ValidationFinding


class ValidatorService:
    """
    Deterministic validation engine for Antigravity Academy V3.
    Applies strict, reproducible rules to flow topologies, contracts,
    control flow, security policies, and expert capstones.
    """

    @classmethod
    def validate_flow(cls, flow: Dict[str, Any], mission_id: Optional[str] = None) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []
        nodes = flow.get("nodes", [])
        edges = flow.get("edges", [])

        # Exemption for mission_00 or flows with only presentation nodes
        if mission_id == "mission_00" or not any(n.get("type") not in ["postIt", "note", "drawingNode", "rulerNode"] for n in nodes):
            return findings

        # 1. Topology checks
        findings.extend(cls.validate_topology(nodes, edges))

        # 2. Contract & Schema checks
        findings.extend(cls.validate_contracts(nodes, edges))

        # 3. Control flow checks (Decisions & Classifiers)
        findings.extend(cls.validate_control_flow(nodes, edges))

        # 4. Reliability & Idempotency
        findings.extend(cls.validate_reliability(nodes, edges))

        # 5. Human Gate checks
        findings.extend(cls.validate_human_gates(nodes, edges))

        # 6. Fork / Join & Reducers
        findings.extend(cls.validate_parallelism(nodes, edges))

        # 7. Capstone checks if mission_id is mission_18
        if mission_id == "mission_18":
            findings.extend(cls.validate_expert_capstone(nodes, edges))

        return findings

    @classmethod
    def validate_topology(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []
        node_map = {n.get("id"): n for n in nodes if n.get("id")}

        # Check start node
        start_nodes = [
            n for n in nodes 
            if (n.get("type") in ["start", "action"] and n.get("data", {}).get("role") == "start") or n.get("id", "").startswith("start") or n.get("id", "").startswith("node_start")
        ]
        if not start_nodes:
            findings.append(
                ValidationFinding(
                    code="VAL-TOP-001",
                    severity="blocking",
                    category="topology",
                    entity_ref="flow",
                    message="El flujo no tiene nodo de inicio (Start).",
                    suggested_action="Añade un nodo Start con el esquema de entrada inicial."
                )
            )

        # Check end node
        end_nodes = [
            n for n in nodes 
            if (n.get("type") in ["end", "action"] and n.get("data", {}).get("role") in ["end", "error_sink"]) or n.get("id", "").startswith("end") or n.get("id", "").startswith("node_end")
        ]
        if not end_nodes and len(nodes) > 1:
            findings.append(
                ValidationFinding(
                    code="VAL-TOP-002",
                    severity="blocking",
                    category="topology",
                    entity_ref="flow",
                    message="El flujo no tiene nodo terminal (End o ErrorSink).",
                    suggested_action="Añade un nodo End para cerrar las rutas de ejecución."
                )
            )

        # Check edges point to valid nodes
        for edge in edges:
            src = edge.get("source") or edge.get("from")
            tgt = edge.get("target") or edge.get("to")
            if src not in node_map:
                findings.append(
                    ValidationFinding(
                        code="VAL-TOP-003",
                        severity="blocking",
                        category="topology",
                        entity_ref=f"edge.{edge.get('id')}",
                        message=f"El edge apunta desde un nodo inexistente: {src}"
                    )
                )
            if tgt not in node_map:
                findings.append(
                    ValidationFinding(
                        code="VAL-TOP-004",
                        severity="blocking",
                        category="topology",
                        entity_ref=f"edge.{edge.get('id')}",
                        message=f"El edge apunta hacia un nodo inexistente: {tgt}"
                    )
                )

        # Reachability from start
        if start_nodes:
            adjacency: Dict[str, List[str]] = {nid: [] for nid in node_map}
            for e in edges:
                s = e.get("source") or e.get("from")
                t = e.get("target") or e.get("to")
                if s in adjacency and t in node_map:
                    adjacency[s].append(t)

            visited = set()
            def dfs(nid: str):
                if nid not in visited and nid in node_map:
                    visited.add(nid)
                    for nxt in adjacency.get(nid, []):
                        dfs(nxt)

            for sn in start_nodes:
                dfs(sn.get("id"))

            for n in nodes:
                nid = n.get("id")
                ntype = n.get("type")
                if nid not in visited and ntype not in ["postIt", "note", "drawingNode", "rulerNode"]:
                    findings.append(
                        ValidationFinding(
                            code="VAL-TOP-005",
                            severity="warning",
                            category="topology",
                            entity_ref=f"node.{nid}",
                            message=f"El nodo '{n.get('data', {}).get('title', nid)}' es inalcanzable desde el inicio.",
                            suggested_action="Conéctalo al flujo principal o elimínalo si no es necesario."
                        )
                    )

        return findings

    @classmethod
    def validate_contracts(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []
        node_map = {n.get("id"): n for n in nodes if n.get("id")}

        for edge in edges:
            src_id = edge.get("source") or edge.get("from")
            tgt_id = edge.get("target") or edge.get("to")
            src = node_map.get(src_id)
            tgt = node_map.get(tgt_id)

            if not src or not tgt:
                continue

            src_data = src.get("data", {})
            tgt_data = tgt.get("data", {})

            # Check explicit type mismatch: string output connected directly to number input
            out_type = src_data.get("output_type")
            in_type = tgt_data.get("input_type")

            if out_type == "string" and in_type in ["number", "float", "int"]:
                findings.append(
                    ValidationFinding(
                        code="VAL-CON-001",
                        severity="blocking",
                        category="contracts",
                        entity_ref=f"edge.{edge.get('id')}",
                        message=f"Incompatibilidad de tipos: {src_data.get('title')} entrega 'string' pero {tgt_data.get('title')} requiere 'number'.",
                        suggested_action="Inserta un nodo Transform (parse_number) entre ambos nodos."
                    )
                )

            # Check schema mismatch
            out_schema = src_data.get("output_schema")
            in_schema = tgt_data.get("input_schema")
            if out_schema and in_schema and "string" in str(out_schema) and "number" in str(in_schema):
                findings.append(
                    ValidationFinding(
                        code="VAL-CON-002",
                        severity="blocking",
                        category="contracts",
                        entity_ref=f"edge.{edge.get('id')}",
                        message=f"Contrato violado entre {src_data.get('title')} y {tgt_data.get('title')}: tipos de campos incompatibles.",
                        suggested_action="Alinea los schemas o inserta un transform."
                    )
                )

        return findings

    @classmethod
    def validate_control_flow(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []
        
        for node in nodes:
            ntype = node.get("type")
            data = node.get("data", {})
            role = data.get("role", "")
            nid = node.get("id")

            # Check Decision / Condition nodes
            if ntype == "condition" or role == "decision":
                out_edges = [e for e in edges if (e.get("source") or e.get("from")) == nid]
                labels = [str(e.get("label") or e.get("sourceHandle") or e.get("data", {}).get("branch") or e.get("data", {}).get("case") or "").lower() for e in out_edges]
                
                has_true = any("true" in l or "si" in l or "yes" in l for l in labels)
                has_false = any("false" in l or "no" in l for l in labels)

                if len(out_edges) < 2 or not (has_true and has_false):
                    findings.append(
                        ValidationFinding(
                            code="VAL-CTL-001",
                            severity="blocking",
                            category="control_flow",
                            entity_ref=f"node.{nid}",
                            message=f"La decisión '{data.get('title', nid)}' no tiene ambas ramas explícitas (True y False).",
                            suggested_action="Conecta y etiqueta las dos rutas de salida: True y False."
                        )
                    )

            # Check Classifier nodes
            if role == "classifier":
                out_edges = [e for e in edges if (e.get("source") or e.get("from")) == nid]
                labels = [str(e.get("label") or e.get("sourceHandle") or "").lower() for e in out_edges]
                threshold = data.get("threshold", 0.0)
                
                if threshold > 0 and not any("uncertain" in l or "low_confidence" in l or "fallback" in l for l in labels):
                    findings.append(
                        ValidationFinding(
                            code="VAL-CTL-002",
                            severity="warning",
                            category="control_flow",
                            entity_ref=f"node.{nid}",
                            message=f"El clasificador '{data.get('title', nid)}' tiene umbral {threshold} pero carece de ruta 'uncertain' para baja confianza.",
                            suggested_action="Añade una salida para desviar incertidumbre a revisión humana o fallback."
                        )
                    )

        return findings

    @classmethod
    def validate_reliability(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []

        for node in nodes:
            data = node.get("data", {})
            nid = node.get("id")
            role = data.get("role", "")
            side_effect = data.get("side_effect", False)

            if side_effect or role in ["payment", "tool_write", "sms", "email_send"]:
                idempotency = data.get("idempotency_scope") or data.get("idempotency_key")
                if not idempotency:
                    findings.append(
                        ValidationFinding(
                            code="VAL-REL-001",
                            severity="blocking",
                            category="reliability",
                            entity_ref=f"node.{nid}",
                            message=f"El nodo con efecto secundario '{data.get('title', nid)}' no tiene definida idempotency_key o idempotency_scope.",
                            suggested_action="Declara la llave de idempotencia de negocio (ej. order_id) para evitar cobros o envíos duplicados."
                        )
                    )

        return findings

    @classmethod
    def validate_human_gates(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []

        for node in nodes:
            ntype = node.get("type")
            data = node.get("data", {})
            role = data.get("role", "")
            nid = node.get("id")

            if ntype == "human" or role == "human_gate":
                out_edges = [e for e in edges if (e.get("source") or e.get("from")) == nid]
                labels = [str(e.get("label") or e.get("sourceHandle") or "").lower() for e in out_edges]
                timeout_action = data.get("timeout_action")

                if not timeout_action and not any("timeout" in l or "expired" in l for l in labels):
                    findings.append(
                        ValidationFinding(
                            code="VAL-HITL-001",
                            severity="warning",
                            category="human_in_loop",
                            entity_ref=f"node.{nid}",
                            message=f"El Human Gate '{data.get('title', nid)}' no define política de expiración o ruta timeout.",
                            suggested_action="Configura expiry_ms y una ruta de contingencia ante supervisor ausente."
                        )
                    )

        return findings

    @classmethod
    def validate_parallelism(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []
        node_map = {n.get("id"): n for n in nodes if n.get("id")}

        fork_nodes = [n for n in nodes if n.get("data", {}).get("role") == "fork" or n.get("type") == "fork"]
        join_nodes = [n for n in nodes if n.get("data", {}).get("role") == "join" or n.get("type") == "join"]

        if fork_nodes and not join_nodes:
            findings.append(
                ValidationFinding(
                    code="VAL-PAR-001",
                    severity="blocking",
                    category="parallelism",
                    entity_ref="flow",
                    message="Se detectó bifurcación Fork pero no existe ningún nodo Join para consolidar ramas.",
                    suggested_action="Inserta un nodo Join con Reducer para sincronizar las ramas paralelas."
                )
            )

        return findings

    @classmethod
    def validate_expert_capstone(cls, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[ValidationFinding]:
        findings: List[ValidationFinding] = []

        # Quantitative checks for Mission 18
        # 1. At least 8 agents
        agents = [n for n in nodes if n.get("data", {}).get("role") == "agent" or n.get("type") in ["action", "agent"]]
        if len(agents) < 8:
            findings.append(
                ValidationFinding(
                    code="VAL-CAP-001",
                    severity="blocking",
                    category="capstone_scope",
                    entity_ref="flow.nodes",
                    message=f"El Capstone Expert requiere al menos 8 agentes especializados. Encontrados: {len(agents)}.",
                    suggested_action="Descompone el problema en más agentes con roles específicos."
                )
            )

        # 2. At least 15 prompts / prompt configurations
        prompts_count = sum(1 for n in nodes if n.get("data", {}).get("prompt") or n.get("data", {}).get("content"))
        if prompts_count < 15:
            findings.append(
                ValidationFinding(
                    code="VAL-CAP-002",
                    severity="blocking",
                    category="capstone_scope",
                    entity_ref="flow.prompts",
                    message=f"El Capstone Expert requiere al menos 15 prompts versionados. Encontrados: {prompts_count}.",
                    suggested_action="Configura prompts específicos para extracción, clasificación, síntesis y auditoría."
                )
            )

        # 3. At least 2 subflows
        subflows = [n for n in nodes if n.get("type") == "subflow" or n.get("data", {}).get("role") == "subflow"]
        if len(subflows) < 2:
            findings.append(
                ValidationFinding(
                    code="VAL-CAP-003",
                    severity="blocking",
                    category="capstone_scope",
                    entity_ref="flow.subflows",
                    message=f"El Capstone Expert requiere al menos 2 subflows reutilizables. Encontrados: {len(subflows)}.",
                    suggested_action="Encapsula capacidades repetitivas en subflows modulares."
                )
            )

        # 4. At least 1 Fork / Join
        has_fork = any(n.get("type") == "fork" or n.get("data", {}).get("role") == "fork" for n in nodes)
        has_join = any(n.get("type") == "join" or n.get("data", {}).get("role") == "join" for n in nodes)
        if not (has_fork and has_join):
            findings.append(
                ValidationFinding(
                    code="VAL-CAP-004",
                    severity="blocking",
                    category="capstone_scope",
                    entity_ref="flow.parallelism",
                    message="El Capstone Expert requiere al menos una estructura de ejecución concurrente (Fork + Join).",
                    suggested_action="Ejecuta investigaciones de fuentes múltiples en paralelo."
                )
            )

        # 5. At least 1 Human Gate
        has_human = any(n.get("type") == "human" or n.get("data", {}).get("role") == "human_gate" for n in nodes)
        if not has_human:
            findings.append(
                ValidationFinding(
                    code="VAL-CAP-005",
                    severity="blocking",
                    category="capstone_scope",
                    entity_ref="flow.hitl",
                    message="El Capstone Expert requiere al menos una compuerta Human-in-the-Loop con política de expiración.",
                    suggested_action="Añade un HumanGateNode para autorizar acciones sensibles."
                )
            )

        return findings
