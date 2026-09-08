import operator
import uuid
from typing import Any, Dict, List, TypedDict, Annotated, Callable, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
import re
import os
import json

router = APIRouter(prefix="/engine", tags=["Native Engine"])

memory = MemorySaver()
_apps: Dict[str, Any] = {}

class Node(BaseModel):
    id: str
    type: str
    properties: Dict[str, Any]
    parentId: Optional[str] = None

class Edge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None

class CompileRequest(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    inputs: Dict[str, Any] = {}
    recursion_limit: int = 25
    stream: bool = False

class ResumeRequest(BaseModel):
    thread_id: str
    user_input: str

class GraphState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]
    context: Dict[str, Any]
    variables: Dict[str, Any]

def create_node_function(node: Node, group_nodes: Dict[str, Node] = None) -> Callable:
    """
    Dynamically creates an async function for a LangGraph node based on its properties.
    """
    if group_nodes is None:
        group_nodes = {}
        
    async def node_func(state: GraphState) -> Dict[str, Any]:
        if node.type == 'human':
            # Human nodes pause execution, their logic is just to stand as a breakpoint
            # or maybe just return state unchanged, the actual interaction is via /resume
            return {}
            
        if node.type == 'subflow':
            return {"messages": [AIMessage(content=f"Ejecutado sub-flujo {node.id}")]}
            
        prompt_text = node.properties.get("prompt", "You are a helpful assistant.")
        temperature = node.properties.get("temperature", 0.7)
        model_name = node.properties.get("model", "gpt-4o-mini")
        
        # Group Inheritance
        if getattr(node, "parentId", None) and node.parentId in group_nodes:
            parent = group_nodes[node.parentId]
            parent_prompt = parent.properties.get("prompt")
            if parent_prompt:
                prompt_text = parent_prompt + "\n\n" + prompt_text
            parent_model = parent.properties.get("model")
            if parent_model:
                model_name = parent_model
        
        variables = state.get("variables", {})
        
        # Parse {{var_name}}
        def replace_var(match):
            var_name = match.group(1)
            return str(variables.get(var_name, ""))
            
        prompt_text = re.sub(r'\{\{(.*?)\}\}', replace_var, prompt_text)
        
        from langchain_community.chat_models import ChatOllama
        
        # Override to use Ollama with Qwen2.5-Coder as requested
        model_kwargs = {
            "model": "qwen2.5-coder-local:latest",
            "temperature": temperature,
            "base_url": "http://127.0.0.1:11434"
        }
        
        fallback_kwargs = {
            "model": "qwen2.5-coder-local:latest",
            "temperature": temperature,
            "base_url": "http://127.0.0.1:11434"
        }
        
        if node.type == 'condition':
            model_kwargs["format"] = "json"
            fallback_kwargs["format"] = "json"
            prompt_text += "\nOutput JSON with a single key 'decision' and value 'True' or 'False'."
            
        primary_llm = ChatOllama(**model_kwargs)
        fallback_llm_1 = ChatOllama(**fallback_kwargs)
        
        free_ai_key = os.getenv("FREE_AI_API_KEY", "placeholder")
        fallback_llm_2 = ChatOpenAI(base_url="https://api.free.ai/v1", model="free.ai/gpt-4o", temperature=temperature, api_key=free_ai_key)
        
        llm = primary_llm.with_fallbacks([fallback_llm_1, fallback_llm_2])
        
        messages = state.get("messages", [])
        
        if not messages:
            messages = [HumanMessage(content=prompt_text)]
        else:
            messages = list(messages) + [HumanMessage(content=prompt_text)]
            
        # Tool Calling
        if "tools" in node.properties and node.properties["tools"]:
            @tool
            def search(query: str) -> str:
                """Search the web."""
                return "Mock search result for: " + query
                
            @tool
            def calculator(expression: str) -> str:
                """Calculate expression."""
                return "Mock calculation for: " + expression
                
            tools = [search, calculator]
            react_agent = create_react_agent(llm, tools=tools)
            agent_response = await react_agent.ainvoke({"messages": messages})
            
            # create_react_agent returns dict with "messages"
            # Return the last message
            response = agent_response["messages"][-1]
        else:
            response = await llm.ainvoke(messages)
        
        if node.type == 'variable':
            var_name = node.properties.get("var_name", "default_var")
            new_vars = dict(variables)
            new_vars[var_name] = response.content
            return {"variables": new_vars}
            
        if node.type == 'condition':
            try:
                res_dict = json.loads(response.content)
                decision = str(res_dict.get("decision", "False"))
            except:
                decision = "False"
                
            ctx = dict(state.get("context", {}))
            ctx[f"decision_{node.id}"] = decision
            return {"context": ctx}
            
        return {"messages": [response]}
        
    return node_func

@router.post("/run")
async def run_dynamic_graph(request: CompileRequest):
    """
    Dynamically builds and runs a LangGraph StateGraph from requested nodes and edges.
    """
    try:
        workflow = StateGraph(GraphState)
        
        if not request.nodes:
            raise ValueError("No nodes provided in the request.")
            
        node_ids = {node.id for node in request.nodes}
        node_dict = {node.id: node for node in request.nodes}
        group_nodes = {node.id: node for node in request.nodes if node.type == 'group'}
        
        # Add nodes
        for node in request.nodes:
            workflow.add_node(node.id, create_node_function(node, group_nodes))
            
        sources = {edge.source for edge in request.edges}
        targets = {edge.target for edge in request.edges}
        
        condition_edges = {}
        normal_edges = []
        for edge in request.edges:
            if edge.source not in node_ids or edge.target not in node_ids:
                raise ValueError(f"Invalid edge references: {edge.source} -> {edge.target}")
            
            source_node = node_dict[edge.source]
            if source_node.type == 'condition':
                if edge.source not in condition_edges:
                    condition_edges[edge.source] = {}
                label = edge.label
                if not label:
                    label = "True" if "True" not in condition_edges[edge.source] else "False"
                condition_edges[edge.source][label] = edge.target
            else:
                normal_edges.append(edge)
                
        # Add normal edges (LangGraph supports parallel native execution)
        for edge in normal_edges:
            workflow.add_edge(edge.source, edge.target)
            
        # Add conditional edges
        for source_id, mapping in condition_edges.items():
            def make_router(node_id):
                def router(state: GraphState):
                    return state.get("context", {}).get(f"decision_{node_id}", "False")
                return router
                
            workflow.add_conditional_edges(
                source_id,
                make_router(source_id),
                mapping
            )
            
        # Determine START and END nodes dynamically if not explicitly specified
        start_nodes = node_ids - targets
        end_nodes = node_ids - sources
        
        for start_node in start_nodes:
            workflow.add_edge(START, start_node)
            
        for end_node in end_nodes:
            if node_dict[end_node].type != 'condition':
                workflow.add_edge(end_node, END)
            
        # Compile graph with breakpoints for human nodes
        human_node_ids = [node.id for node in request.nodes if node.type == 'human']
        app = workflow.compile(checkpointer=memory, interrupt_before=human_node_ids)
        
        thread_id = str(uuid.uuid4())
        _apps[thread_id] = app
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": request.recursion_limit}
        
        # Prepare initial state
        initial_state = {
            "messages": [],
            "context": request.inputs,
            "variables": {}
        }
        
        if "messages" in request.inputs:
            initial_state["messages"] = [
                HumanMessage(content=m) if isinstance(m, str) else m 
                for m in request.inputs["messages"]
            ]
            
        def serialize_output(event_data):
            if not isinstance(event_data, dict): return str(event_data)
            res = {}
            for node_name, output in event_data.items():
                if not isinstance(output, dict):
                    res[node_name] = str(output)
                    continue
                serialized = {}
                for k, v in output.items():
                    if k == "messages":
                        serialized[k] = [{"type": msg.__class__.__name__, "content": msg.content} for msg in v]
                    else:
                        serialized[k] = v
                res[node_name] = serialized
            return res

        if getattr(request, 'stream', False):
            async def event_generator():
                try:
                    async for event in app.astream(initial_state, config, stream_mode="updates"):
                        yield f"data: {json.dumps({'type': 'update', 'data': serialize_output(event)})}\n\n"
                    state = app.get_state(config)
                    if state.next:
                        yield f"data: {json.dumps({'type': 'paused', 'thread_id': thread_id})}\n\n"
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            return StreamingResponse(event_generator(), media_type="text/event-stream")
        
        # Non-streaming fallback
        result = await app.ainvoke(initial_state, config)
        
        # Check if paused
        state = app.get_state(config)
        if state.next:
            return {"status": "paused", "thread_id": thread_id}
            
        # Extract messages and serialize
        final_messages = result.get("messages", []) if result else []
        serialized_messages = [
            {"type": msg.__class__.__name__, "content": msg.content} 
            for msg in final_messages
        ]
        
        return {
            "status": "success",
            "result": {
                "messages": serialized_messages,
                "context": result.get("context", {}) if result else {},
                "variables": result.get("variables", {}) if result else {}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume")
async def resume_graph(request: ResumeRequest):
    try:
        if request.thread_id not in _apps:
            raise HTTPException(status_code=404, detail="Thread not found")
            
        app = _apps[request.thread_id]
        config = {"configurable": {"thread_id": request.thread_id}}
        
        # Update state
        app.update_state(config, {"messages": [HumanMessage(content=request.user_input)]})
        
        # Resume workflow
        result = await app.ainvoke(None, config)
        
        # Check if paused again
        state = app.get_state(config)
        if state.next:
            return {"status": "paused", "thread_id": request.thread_id}
            
        final_messages = result.get("messages", []) if result else []
        serialized_messages = [
            {"type": msg.__class__.__name__, "content": msg.content} 
            for msg in final_messages
        ]
        
        return {
            "status": "success",
            "result": {
                "messages": serialized_messages,
                "context": result.get("context", {}) if result else {},
                "variables": result.get("variables", {}) if result else {}
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        from routers.builder_actions import call_ai
        system = "Eres un asistente experto en traduccion."
        user = ""
        for m in request.messages:
            if m.get("role") == "system":
                system = m.get("content", system)
            elif m.get("role") == "user":
                user = m.get("content", user)
        reply, _ = await call_ai(system, user)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
