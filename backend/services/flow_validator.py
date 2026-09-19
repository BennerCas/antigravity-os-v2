from typing import Dict, Any, List, Set
from backend.schemas.builder_flow import Flow

class ValidationFinding:
    def __init__(self, code: str, severity: str, category: str, entity_ref: str, message: str):
        self.code = code
        self.severity = severity # info, warning, error, blocking
        self.category = category
        self.entity_ref = entity_ref
        self.message = message

class FlowValidator:
    """
    Deterministically validates a Flow topology and contracts.
    """
    
    @staticmethod
    def validate_topology(flow: Flow) -> List[ValidationFinding]:
        findings = []
        
        node_ids = {node.id: node for node in flow.nodes}
        edge_ids = set()
        
        # 1. Check uniqueness of IDs
        if len(node_ids) != len(flow.nodes):
            findings.append(ValidationFinding("VAL-TOP-001", "blocking", "topology", "flow.nodes", "Existen nodos con IDs duplicados."))
            
        start_nodes = [node for node in flow.nodes if node.kind == "start"]
        if not start_nodes:
            findings.append(ValidationFinding("VAL-TOP-002", "blocking", "topology", "flow", "El flujo no tiene nodo de inicio (Start)."))
            
        # 2. Check edges referencing non-existent nodes
        adjacency_list: Dict[str, List[str]] = {node_id: [] for node_id in node_ids}
        
        for edge in flow.edges:
            if edge.id in edge_ids:
                findings.append(ValidationFinding("VAL-TOP-003", "blocking", "topology", f"edge.{edge.id}", "Edge ID duplicado."))
            edge_ids.add(edge.id)
            
            if edge.from_node not in node_ids:
                findings.append(ValidationFinding("VAL-TOP-004", "blocking", "topology", f"edge.{edge.id}", f"Referencia a nodo origen inexistente: {edge.from_node}"))
            else:
                adjacency_list[edge.from_node].append(edge.to_node)
                
            if edge.to_node not in node_ids:
                findings.append(ValidationFinding("VAL-TOP-005", "blocking", "topology", f"edge.{edge.id}", f"Referencia a nodo destino inexistente: {edge.to_node}"))

        # 3. Reachability from start nodes
        reachable_nodes = set()
        def dfs(node_id: str):
            if node_id not in reachable_nodes and node_id in node_ids:
                reachable_nodes.add(node_id)
                for neighbor in adjacency_list.get(node_id, []):
                    dfs(neighbor)
                    
        for start_node in start_nodes:
            dfs(start_node.id)
            
        for node in flow.nodes:
            # We ignore presentation nodes for reachability if they got into Flow by mistake,
            # but ideally normalizer stripped them.
            if node.id not in reachable_nodes and node.kind not in ["postIt", "note", "drawing", "ruler"]:
                findings.append(ValidationFinding(
                    "VAL-TOP-006", "warning", "topology", f"node.{node.id}", 
                    f"Nodo {node.name} ({node.kind}) inalcanzable desde el inicio."
                ))

        # 4. End paths check
        for node_id, neighbors in adjacency_list.items():
            if not neighbors:
                node = node_ids.get(node_id)
                if node and node.kind not in ["end", "error_sink", "human_gate"]:
                    findings.append(ValidationFinding(
                        "VAL-TOP-007", "blocking", "topology", f"node.{node_id}",
                        f"Ruta sin final: el nodo {node.name} no tiene salidas y no es terminal (end/error_sink)."
                    ))
                    
        # 5. Check ambiguous branches
        for edge in flow.edges:
            if edge.kind == "ambiguous_branch":
                findings.append(ValidationFinding(
                    "VAL-TOP-008", "blocking", "control_flow", f"edge.{edge.id}",
                    "Rama ambigua detectada. Debe asignar una etiqueta o source_handle válido (ej. true/false)."
                ))

        # 6. Decision and Classifier checks
        for node in flow.nodes:
            if node.kind == "decision":
                # Check if it has true and false paths
                out_edges = [e for e in flow.edges if e.from_node == node.id]
                labels = [e.label or e.source_handle for e in out_edges]
                if "true" not in labels and "false" not in labels:
                    findings.append(ValidationFinding(
                        "VAL-TOP-009", "blocking", "control_flow", f"node.{node.id}",
                        f"El nodo decisión '{node.name}' no tiene ramas válidas (requiere true y/false)."
                    ))
            
        return findings
