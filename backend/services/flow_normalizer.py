from typing import Dict, Any, List
import uuid

class LegacyFlowAdapter:
    """
    Adapter to migrate legacy React Flow JSON representations into Flow v1.
    """
    
    @staticmethod
    def normalize(legacy_flow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts a legacy flow to a Flow v1 dictionary.
        """
        nodes = legacy_flow.get("nodes", [])
        edges = legacy_flow.get("edges", [])
        
        normalized_nodes = []
        ui_annotations = []
        
        for node in nodes:
            node_type = node.get("type", "unknown")
            data = node.get("data", {})
            ui_data = {
                "position": node.get("position", {"x": 0, "y": 0}),
                "width": node.get("width"),
                "height": node.get("height"),
            }
            
            if node_type in ["postIt", "drawing", "ruler", "note"]:
                ui_annotations.append({
                    "id": node.get("id"),
                    "type": node_type,
                    "data": data,
                    "ui": ui_data
                })
                continue
            
            # Base node mapping
            builder_node = {
                "id": node.get("id", str(uuid.uuid4())),
                "name": data.get("label", node_type),
                "config": {},
                "ui": ui_data,
                "input_contract": None,
                "output_contracts": {},
            }
            
            # Map specific types
            if node_type == "mainPrompt" or node_type == "agent":
                builder_node["kind"] = "agent"
                builder_node["config"]["prompt"] = data.get("content", "")
                builder_node["config"]["role"] = data.get("role", "system")
                if "llm_model" in data:
                    builder_node["config"]["model_profile_override"] = data["llm_model"]
                if "temperature" in data:
                    builder_node["config"]["temperature"] = data["temperature"]
                if "tools" in data:
                    builder_node["config"]["unresolved_capabilities"] = data["tools"]
            
            elif node_type == "variable":
                builder_node["kind"] = "transform"
                builder_node["config"]["var_name"] = data.get("variableName", "")
                
            elif node_type == "condition" or node_type == "logic":
                builder_node["kind"] = "decision"
                # Legacy conditions often stored condition logic in 'condition' or 'prompt'
                builder_node["config"]["expression"] = data.get("condition", data.get("prompt", ""))
                
            elif node_type == "human" or node_type == "human_gate":
                builder_node["kind"] = "human_gate"
                builder_node["config"]["objective"] = data.get("label", "Human Approval")
                
            elif node_type == "subflow":
                builder_node["kind"] = "subflow"
                builder_node["config"]["unresolved_subflow"] = data.get("content", "")
                
            else:
                builder_node["kind"] = node_type
                builder_node["config"].update(data)
                
            normalized_nodes.append(builder_node)
            
        normalized_edges = []
        for edge in edges:
            builder_edge = {
                "id": edge.get("id", str(uuid.uuid4())),
                "from": edge.get("source"),
                "to": edge.get("target"),
                "kind": "route",
                "ui": {
                    "style": edge.get("style", {})
                }
            }
            
            source_handle = edge.get("sourceHandle")
            target_handle = edge.get("targetHandle")
            label = edge.get("label")
            
            # Preserve labels and handles
            if source_handle:
                builder_edge["source_handle"] = source_handle
            if target_handle:
                builder_edge["target_handle"] = target_handle
            if label:
                builder_edge["label"] = label
                
            # Detect ambiguous branches (e.g., from a condition node without explicit true/false label)
            source_node = next((n for n in normalized_nodes if n["id"] == builder_edge["from"]), None)
            if source_node and source_node["kind"] == "decision":
                if not label and not source_handle:
                    builder_edge["kind"] = "ambiguous_branch"
            
            normalized_edges.append(builder_edge)
            
        return {
            "schema_version": "builder/v1",
            "id": legacy_flow.get("id", str(uuid.uuid4())),
            "revision": 1,
            "metadata": {
                "name": legacy_flow.get("name", "Migrated Flow"),
                "source": "legacy_migration"
            },
            "nodes": normalized_nodes,
            "edges": normalized_edges,
            "ui": {
                "viewport": legacy_flow.get("viewport", {"x": 0, "y": 0, "zoom": 1}),
                "annotations": ui_annotations
            }
        }
