
import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class Node(BaseModel):
    class Config:
        extra = "allow"
    id: Optional[str] = None
    title: str
    content: str
    role: Optional[str] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = None

class Edge(BaseModel):
    source: str
    target: str

class CompileRequest(BaseModel):
    framework: str
    nodes: List[Node]
    edges: List[Edge]
    execution_plan: Optional[str] = None

def _parse_llm(llm_model: str) -> tuple[str, str, str]:
    '''Returns (provider, model_name, litellm_format)'''
    if not llm_model:
        return "ollama", "hermes3:unlocked", "ollama/hermes3:unlocked"
        
    llm_model = llm_model.lower()
    if "free.ai" in llm_model:
        model = llm_model.split("/")[-1] if "/" in llm_model else "qwen7b"
        return "free.ai", model, f"openai/{model}"
    elif "ollama" in llm_model or "hermes" in llm_model:
        model = llm_model.split("/")[-1] if "/" in llm_model else "hermes3:unlocked"
        return "ollama", model, f"ollama/{model}"
    else:
        return "ollama", "hermes3:unlocked", "ollama/hermes3:unlocked"

def generate_crewai_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    code = ["# -*- coding: utf-8 -*-"]
    code.append("import os")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\Antigravity_OS_v2\\backend\\.env')")
    code.append("os.environ['OPENAI_API_BASE'] = 'https://api.free.ai/v1'")
    code.append("if not os.environ.get('OPENAI_API_KEY'):")
    code.append("    os.environ['OPENAI_API_KEY'] = os.environ.get('FREE_AI_API_KEY', 'dummy_key')")
    code.append("from crewai import Agent, Task, Crew, Process")
    
    code.append("# --- Setup Agents ---")
    for i, node in enumerate(nodes):
        role = node.role or node.title or f"Agent_{i}"
        title = node.title or f"Agent_{i}"
        content = json.dumps((node.content or '').strip().replace('\n', ' '), ensure_ascii=False)
        provider, model_name, litellm = _parse_llm(node.llm_model)
        
        # Safe serialization
        safe_role = json.dumps(role, ensure_ascii=False)
        safe_goal = content # Already json.dumps
        safe_backstory = json.dumps(
            f"You are {role}, a senior specialist operating inside a multi-agent pipeline. "
            f"You receive structured input from upstream agents and must produce a precise, directly usable artifact. "
            f"Rules: follow your instructions exactly, never fabricate data not present in the input, "
            f"and if critical information is missing, state it explicitly instead of guessing.",
            ensure_ascii=False
        )
        
        code.append(f'''agent_{i} = Agent(
    role={safe_role},
    goal={safe_goal},
    backstory={safe_backstory},
    verbose=True,
    allow_delegation=False,
    llm="{litellm}"
)''')

    code.append("\n# --- Setup Tasks ---")
    for i, node in enumerate(nodes):
        title = node.title or f"Task_{i}"
        content = json.dumps((node.content or '').strip().replace('\n', ' '), ensure_ascii=False)
        
        # Safe serialization
        safe_desc = json.dumps(f"{title}: " + json.loads(content), ensure_ascii=False)
        safe_expected = json.dumps(f"Appropriate result for {title}", ensure_ascii=False)
        
        code.append(f'''task_{i} = Task(
    description={safe_desc},
    expected_output={safe_expected},
    agent=agent_{i}
)''')

    code.append("\n# --- Setup Crew ---")
    agents_list = ", ".join([f"agent_{i}" for i in range(len(nodes))])
    tasks_list = ", ".join([f"task_{i}" for i in range(len(nodes))])
    
    code.append(f'''crew = Crew(
    agents=[{agents_list}],
    tasks=[{tasks_list}],
    verbose=True,
    process=Process.sequential
)''')
    
    code.append("\nif __name__ == '__main__':")
    code.append("    print('Starting CrewAI process...')")
    code.append("    result = crew.kickoff()")
    code.append("    print('Result:', result)")
    
    return "\n".join(code)

def generate_autogen_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    code = ["# -*- coding: utf-8 -*-"]
    code.append("import os")
    code.append("import autogen")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\Antigravity_OS_v2\\backend\\.env')")
    
    code.append("api_key = 'ollama'")
    code.append("config_list = [{ 'model': 'hermes3:unlocked', 'api_key': api_key, 'base_url': 'http://127.0.0.1:11434/v1' }]")
    code.append("llm_config = {'config_list': config_list}\n")
    
    user_proxy = None
    assistants = []
    
    code.append("# --- Setup Agents ---")
    for i, node in enumerate(nodes):
        title = (node.title or f"Agent_{i}").replace(" ", "_")
        content = json.dumps((node.content or '').strip().replace('\n', ' '), ensure_ascii=False)
        
        if "user" in title.lower() or i == 0:
            user_proxy = f"user_proxy_{i}"
            safe_title = json.dumps(title, ensure_ascii=False)
            safe_content = content
            code.append(f'''{user_proxy} = autogen.UserProxyAgent(
    name={safe_title},
    system_message={safe_content},
    code_execution_config=False,
    human_input_mode="NEVER"
)''')
        else:
            assistant = f"assistant_{i}"
            assistants.append(assistant)
            safe_title = json.dumps(title, ensure_ascii=False)
            safe_content = content
            code.append(f'''{assistant} = autogen.AssistantAgent(
    name={safe_title},
    llm_config=llm_config,
    system_message={safe_content}
)''')

    code.append("\nif __name__ == '__main__':")
    code.append("    print('Starting AutoGen process...')")
    if assistants and user_proxy:
        exec_plan = (execution_plan or 'Start execution').replace('\n', ' ')
        safe_exec_plan = json.dumps(exec_plan, ensure_ascii=False)
        code.append(f"    {user_proxy}.initiate_chat({assistants[0]}, message={safe_exec_plan})")
    elif user_proxy:
        code.append(f"    print('Only UserProxyAgent defined: {user_proxy}')")
    else:
        code.append("    print('No valid agents to initiate chat.')")
    
    return "\n".join(code)

def generate_langgraph_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    """Genera un runner LangGraph alineado al motor local por defecto (Hermes 3 Unlocked en Ollama)."""
    code = ["# -*- coding: utf-8 -*-"]
    code.append("import os, sys")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\Antigravity_OS_v2\\backend\\.env')")
    code.append("from typing import TypedDict")
    code.append("from langgraph.graph import StateGraph, END")
    code.append("from langchain_openai import ChatOpenAI\n")
    code.append("if hasattr(sys.stdout, 'reconfigure'):")
    code.append("    sys.stdout.reconfigure(encoding='utf-8', errors='replace')\n")

    code.append("class GraphState(TypedDict):")
    code.append("    input: str")
    code.append("    output: str\n")

    code.append("def make_llm(model, provider, temperature=0.7):")
    code.append("    if provider == 'ollama':")
    code.append("        return ChatOpenAI(model=model, base_url='http://127.0.0.1:11434/v1', api_key='ollama', temperature=temperature)")
    code.append("    return ChatOpenAI(model='openai/gpt-4o', base_url='https://api.free.ai/v1', api_key=os.environ.get('FREE_AI_API_KEY', 'dummy'), temperature=temperature)\n")

    code.append("# --- Node Functions ---")
    id_to_name = {}
    for i, node in enumerate(nodes):
        node_name = f"node_{i}"
        id_to_name[node.id or node_name] = node_name
        provider, model, _ = _parse_llm(getattr(node, 'llm_model', '') or 'hermes3:unlocked')
        temperature = getattr(node, 'temperature', 0.7) or 0.7
        content = json.dumps((node.content or '').strip().replace('\n', ' '), ensure_ascii=False)
        node_id_val = str(node.id or node_name)
        code.append(f"llm_{i} = make_llm({json.dumps(model)}, {json.dumps(provider)}, {temperature})")
        code.append(f"def {node_name}(state: GraphState):")
        code.append(f"    print(f'[NODE-START] {node_id_val}', flush=True)")
        code.append(f"    print(f'[NODE] Executing {node_name} ({model})...', flush=True)")
        code.append(f"    prompt = {content} + ' ' + state.get('input', '') + ' ' + state.get('output', '')")
        code.append(f"    response = llm_{i}.invoke(prompt)")
        code.append(f"    return {{'output': response.content}}")
        code.append("")

    code.append("workflow = StateGraph(GraphState)")
    for i in range(len(nodes)):
        code.append(f"workflow.add_node('node_{{}}', node_{{}})".format(i, i))

    # Respetar las conexiones reales del grafo; fallback a cadena secuencial
    used_edges = False
    if nodes and edges:
        targets = {e.target for e in edges}
        entry_candidates = [n.id or f"node_{i}" for i, n in enumerate(nodes) if (n.id or f"node_{i}") not in targets]
        valid = [(e.source, e.target) for e in edges if e.source in id_to_name and e.target in id_to_name]
        if entry_candidates and valid:
            code.append(f"workflow.set_entry_point('{id_to_name[entry_candidates[0]]}')")
            for s, t in valid:
                code.append(f"workflow.add_edge('{id_to_name[s]}', '{id_to_name[t]}')")
            connected = {t for _, t in valid} | {s for s, _ in valid}
            last = id_to_name[entry_candidates[0]]
            for i, n in enumerate(nodes):
                name = f"node_{i}"
                if name in connected and all(t != name for _, t in valid):
                    last = name
            code.append(f"workflow.add_edge('{last}', END)")
            used_edges = True
    if nodes and not used_edges:
        code.append("workflow.set_entry_point('node_0')")
        for i in range(len(nodes) - 1):
            code.append(f"workflow.add_edge('node_{i}', 'node_{i+1}')")
        code.append(f"workflow.add_edge('node_{len(nodes)-1}', END)")

    code.append("app = workflow.compile()\n")

    code.append("if __name__ == '__main__':")
    code.append("    print('Starting LangGraph process...')")
    safe_exec_plan = json.dumps(execution_plan or 'Start execution', ensure_ascii=False)
    code.append(f"    result = app.invoke({{'input': {safe_exec_plan}}})")
    code.append("    print('Final Output:', result['output'])")

    return "\n".join(code)

@router.post("/compile/generate")
async def compile_generate(request: CompileRequest):
    framework = request.framework.lower()
    
    if framework == "autogen":
        script_content = generate_autogen_code(request.nodes, request.edges, request.execution_plan)
    elif framework == "langgraph":
        script_content = generate_langgraph_code(request.nodes, request.edges, request.execution_plan)
    else:
        # Default to crewai
        script_content = generate_crewai_code(request.nodes, request.edges, request.execution_plan)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sandbox_dir = os.path.join(base_dir, "sandbox")
    os.makedirs(sandbox_dir, exist_ok=True)
    
    runner_path = os.path.join(sandbox_dir, "runner.py")
    with open(runner_path, "w", encoding="utf-8") as f:
        f.write(script_content)
        
    return {"status": "success", "code": script_content, "file": runner_path}
