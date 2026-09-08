import hashlib
import json
from datetime import datetime
from typing import Dict, Any
from backend.schemas.builder_flow import BuilderFlow, RuntimeGraph
from backend.services.flow_validator import FlowValidator

class CompilerError(Exception):
    pass

class FlowCompiler:
    """
    Deterministically compiles a BuilderFlow v1 into a RuntimeGraph v1.
    """
    
    @staticmethod
    def compile(flow: BuilderFlow, revision: int) -> RuntimeGraph:
        # 1. Run validation
        findings = FlowValidator.validate_topology(flow)
        blocking_findings = [f for f in findings if f.severity == "blocking"]
        
        if blocking_findings:
            raise CompilerError(f"Cannot compile flow with blocking findings: {[f.message for f in blocking_findings]}")
            
        # 2. Normalize and extract executable nodes
        executable_nodes = []
        for node in flow.nodes:
            # Skip presentation nodes
            if node.kind in ["postIt", "note", "drawing", "ruler"]:
                continue
                
            runtime_node = {
                "id": node.id,
                "kind": node.kind,
                "name": node.name,
                "config": node.config.copy(),
                "execution_policy": node.execution_policy.model_dump() if node.execution_policy else {},
                "failure_policy": node.failure_policy.model_dump() if node.failure_policy else {},
                "security_policy": node.security_policy.model_dump() if node.security_policy else {}
            }
            
            # Map specific logic for LangGraph target
            if node.kind == "decision":
                runtime_node["router_expression"] = node.config.get("expression", "")
            elif node.kind == "human_gate":
                runtime_node["interrupt_before"] = True
                
            executable_nodes.append(runtime_node)
            
        # 3. Extract semantic edges
        executable_edges = []
        for edge in flow.edges:
            if edge.kind == "ambiguous_branch":
                raise CompilerError(f"Ambiguous branch detected on edge {edge.id}")
                
            runtime_edge = {
                "id": edge.id,
                "from": edge.from_node,
                "to": edge.to_node,
                "kind": edge.kind,
                "label": edge.label,
                "source_handle": edge.source_handle,
                "target_handle": edge.target_handle,
            }
            if edge.route:
                runtime_edge["route"] = edge.route.model_dump()
                
            executable_edges.append(runtime_edge)
            
        # 4. Generate manifest
        manifest = {
            "schema_versions": {
                "builder": flow.schema_version,
                "runtime": "runtime/v1"
            },
            "compiled_at": datetime.utcnow().isoformat(),
            "compiler_version": "1.0.0",
            "entrypoints": [n.id for n in flow.nodes if n.kind == "start"],
            "state_contract": flow.state_contract.model_dump() if flow.state_contract else None
        }
        
        # 5. Hash generation for immutability
        graph_dict = {
            "nodes": sorted([n["id"] for n in executable_nodes]),
            "edges": sorted([f"{e['from']}->{e['to']}:{e.get('label', '')}" for e in executable_edges]),
            "metadata": manifest
        }
        content_hash = hashlib.sha256(json.dumps(graph_dict, sort_keys=True).encode()).hexdigest()
        
        return RuntimeGraph(
            schema_version="runtime/v1",
            id=flow.id,
            revision=revision,
            flow_hash=content_hash,
            nodes=executable_nodes,
            edges=executable_edges,
            manifest=manifest
        )
