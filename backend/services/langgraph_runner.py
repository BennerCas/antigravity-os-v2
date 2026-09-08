import json
import logging
from typing import Dict, Any, List, TypedDict, Callable
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from backend.schemas.builder_flow import RuntimeGraph

logger = logging.getLogger(__name__)

class FlowState(TypedDict):
    """
    State dictionary used by LangGraph to track execution.
    """
    input_data: Dict[str, Any]
    shared_data: Dict[str, Any]
    output_data: Dict[str, Any]
    run_history: List[str]
    errors: List[str]

class LangGraphRunner:
    """
    Dynamically builds and executes a LangGraph StateGraph based on a RuntimeGraph.
    """
    def __init__(self, db_path: str = "data/antigravity.db"):
        self.db_path = db_path
        
    def _create_node_handler(self, node: Dict[str, Any]) -> Callable:
        """
        Creates a dynamic async handler for a node based on its kind.
        """
        async def node_handler(state: FlowState) -> Dict[str, Any]:
            node_id = node.get("id", "unknown")
            logger.info(f"Executing node: {node.get('name')} ({node_id})")
            
            # Record execution
            if "run_history" not in state:
                state["run_history"] = []
            state["run_history"].append(node_id)
            
            # --- Specific Node Logic ---
            kind = node.get("kind")
            config = node.get("config", {})
            
            try:
                if kind == "agent":
                    # MOCK: In reality, call the LLM using backend.routers.builder_actions.call_ai
                    prompt = config.get("prompt", "")
                    state["shared_data"][f"{node_id}_result"] = f"Processed by agent with prompt: {prompt[:20]}..."
                    
                elif kind == "transform":
                    var_name = config.get("var_name", "temp")
                    state["shared_data"][var_name] = state["input_data"]
                    
                elif kind == "decision":
                    # Evaluate the expression logic to determine next step
                    expr = config.get("expression", "false")
                    # Extremely basic mock evaluation
                    is_true = "true" in expr.lower() or "1" in expr
                    state["shared_data"][f"{node_id}_decision"] = "true" if is_true else "false"
                    
                elif kind == "human_gate":
                    # When execution reaches here, LangGraph pauses if interrupt_before is set.
                    state["shared_data"][f"{node_id}_approval"] = "pending"
                    
            except Exception as e:
                logger.error(f"Error in node {node_id}: {str(e)}")
                if "errors" not in state:
                    state["errors"] = []
                state["errors"].append(str(e))
                # Depending on failure_policy, we might raise or continue
                
            return state
            
        return node_handler

    def _create_decision_router(self, node: Dict[str, Any], edges: List[Dict[str, Any]]) -> Callable:
        """
        Creates a conditional edge router for decision nodes.
        """
        node_id = node.get("id")
        def router(state: FlowState) -> str:
            decision = state.get("shared_data", {}).get(f"{node_id}_decision", "false")
            for edge in edges:
                if edge.get("from") == node_id:
                    label = str(edge.get("label", "")).lower()
                    if label == decision:
                        return edge.get("to")
            return END
        return router

    def build_graph(self, runtime_graph: RuntimeGraph) -> StateGraph:
        """
        Builds the LangGraph StateGraph from the compiled RuntimeGraph.
        """
        graph = StateGraph(FlowState)
        
        entrypoints = runtime_graph.manifest.get("entrypoints", [])
        if not entrypoints:
            raise ValueError("No entrypoint (start node) defined in RuntimeGraph")
            
        interrupts_before = []
        
        # 1. Add all nodes
        for node in runtime_graph.nodes:
            kind = node.get("kind")
            if kind == "start":
                # Start nodes don't do much, they just pass state
                async def start_handler(s: FlowState):
                    return s
                graph.add_node(node["id"], start_handler)
                
            elif kind in ["end", "error_sink"]:
                async def end_handler(s: FlowState):
                    return s
                graph.add_node(node["id"], end_handler)
                
            else:
                graph.add_node(node["id"], self._create_node_handler(node))
                if node.get("interrupt_before"):
                    interrupts_before.append(node["id"])

        # 2. Add edges
        for node in runtime_graph.nodes:
            node_id = node["id"]
            kind = node.get("kind")
            
            # Find outgoing edges
            out_edges = [e for e in runtime_graph.edges if e.get("from") == node_id]
            
            if not out_edges:
                # If no outgoing edges, route to END
                if kind not in ["end", "error_sink"]:
                    graph.add_edge(node_id, END)
                continue
                
            if kind == "decision":
                # Add conditional edges based on decision output
                # LangGraph expects mapping: { "route_result": "target_node" }
                route_map = {}
                for e in out_edges:
                    label = str(e.get("label", "")).lower()
                    route_map[label] = e.get("to")
                
                graph.add_conditional_edges(
                    node_id,
                    self._create_decision_router(node, runtime_graph.edges),
                    route_map
                )
            else:
                # Standard linear edge
                # In this simplified model, if multiple edges exist (Fork), LangGraph handles it natively
                for edge in out_edges:
                    graph.add_edge(node_id, edge["to"])

        # 3. Set Entry Point
        # For simplicity, we just use the first start node
        graph.set_entry_point(entrypoints[0])

        return graph

    def compile(self, runtime_graph: RuntimeGraph):
        """
        Returns an executable LangGraph app with SQLite checkpointing.
        """
        graph = self.build_graph(runtime_graph)
        interrupts = [n["id"] for n in runtime_graph.nodes if n.get("interrupt_before")]
        
        import sqlite3
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        checkpointer = SqliteSaver(conn)
        
        # Compile with checkpointer and HITL interrupts
        app = graph.compile(
            checkpointer=checkpointer,
            interrupt_before=interrupts
        )
        return app
