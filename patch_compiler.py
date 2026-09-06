import codecs
import re

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\compiler.py'

new_compiler = """
import os
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
        return "free.ai", "qwen7b", "openai/qwen7b"
        
    llm_model = llm_model.lower()
    if "free.ai" in llm_model:
        model = llm_model.split("/")[-1] if "/" in llm_model else "qwen7b"
        return "free.ai", model, f"openai/{model}"
    elif "ollama" in llm_model or "hermes" in llm_model:
        model = llm_model.split("/")[-1] if "/" in llm_model else "hermes3:8b"
        return "ollama", model, f"ollama/{model}"
    else:
        return "free.ai", "qwen7b", "openai/qwen7b"

def generate_crewai_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    code = []
    code.append("import os")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\BennerAI\\.env')")
    code.append("os.environ['OPENAI_API_BASE'] = 'https://api.free.ai/v1'")
    code.append("if not os.environ.get('OPENAI_API_KEY'):")
    code.append("    os.environ['OPENAI_API_KEY'] = os.environ.get('FREE_AI_API_KEY', 'dummy_key')")
    code.append("from crewai import Agent, Task, Crew, Process\n")
    
    code.append("# --- Setup Agents ---")
    for i, node in enumerate(nodes):
        role = node.role or node.title or f"Agent_{i}"
        title = node.title or f"Agent_{i}"
        content = (node.content or '').strip().replace('\\n', ' ')
        provider, model_name, litellm = _parse_llm(node.llm_model)
        
        code.append(f'''agent_{i} = Agent(
    role="{role}",
    goal="{content}",
    backstory="You are an expert {role}.",
    verbose=True,
    allow_delegation=False,
    llm="{litellm}"
)''')

    code.append("\\n# --- Setup Tasks ---")
    for i, node in enumerate(nodes):
        title = node.title or f"Task_{i}"
        content = (node.content or '').strip().replace('\\n', ' ')
        
        code.append(f'''task_{i} = Task(
    description="{title}: {content}",
    expected_output="Appropriate result for {title}",
    agent=agent_{i}
)''')

    code.append("\\n# --- Setup Crew ---")
    agents_list = ", ".join([f"agent_{i}" for i in range(len(nodes))])
    tasks_list = ", ".join([f"task_{i}" for i in range(len(nodes))])
    
    code.append(f'''crew = Crew(
    agents=[{agents_list}],
    tasks=[{tasks_list}],
    verbose=True,
    process=Process.sequential
)''')
    
    code.append("\\nif __name__ == '__main__':")
    code.append("    print('Starting CrewAI process...')")
    code.append("    result = crew.kickoff()")
    code.append("    print('Result:', result)")
    
    return "\\n".join(code)

def generate_autogen_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    code = []
    code.append("import os")
    code.append("import autogen")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\BennerAI\\.env')\\n")
    
    code.append("api_key = os.environ.get('FREE_AI_API_KEY', 'dummy')")
    code.append("config_list = [{ 'model': 'qwen7b', 'api_key': api_key, 'base_url': 'https://api.free.ai/v1' }]")
    code.append("llm_config = {'config_list': config_list}\\n")
    
    user_proxy = None
    assistants = []
    
    code.append("# --- Setup Agents ---")
    for i, node in enumerate(nodes):
        title = (node.title or f"Agent_{i}").replace(" ", "_")
        content = (node.content or '').strip().replace('\\n', ' ')
        
        if "user" in title.lower() or i == 0:
            user_proxy = f"user_proxy_{i}"
            code.append(f'''{user_proxy} = autogen.UserProxyAgent(
    name="{title}",
    system_message="{content}",
    code_execution_config=False,
    human_input_mode="NEVER"
)''')
        else:
            assistant = f"assistant_{i}"
            assistants.append(assistant)
            code.append(f'''{assistant} = autogen.AssistantAgent(
    name="{title}",
    llm_config=llm_config,
    system_message="{content}"
)''')

    code.append("\\nif __name__ == '__main__':")
    code.append("    print('Starting AutoGen process...')")
    if assistants and user_proxy:
        exec_plan = (execution_plan or 'Start execution').replace('\\n', ' ')
        code.append(f"    {user_proxy}.initiate_chat({assistants[0]}, message='{exec_plan}')")
    elif user_proxy:
        code.append(f"    print('Only UserProxyAgent defined: {user_proxy}')")
    else:
        code.append("    print('No valid agents to initiate chat.')")
    
    return "\\n".join(code)

def generate_langgraph_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:
    code = []
    code.append("import os")
    code.append("from dotenv import load_dotenv")
    code.append("load_dotenv(r'C:\\antigravityAS\\BennerAI\\.env')")
    code.append("from typing import TypedDict")
    code.append("from langgraph.graph import StateGraph, END")
    code.append("from langchain_openai import ChatOpenAI\\n")
    
    code.append("class GraphState(TypedDict):")
    code.append("    input: str")
    code.append("    output: str\\n")
    
    code.append("llm = ChatOpenAI(model='qwen7b', openai_api_key=os.environ.get('FREE_AI_API_KEY', 'dummy'), openai_api_base='https://api.free.ai/v1')\\n")
    
    code.append("# --- Node Functions ---")
    for i, node in enumerate(nodes):
        node_name = f"node_{i}"
        content = (node.content or '').strip().replace('\\n', ' ')
        code.append(f"def {node_name}(state: GraphState):")
        code.append(f"    print(f'Executing {node_name}...')")
        code.append(f"    prompt = '{content} ' + state.get('input', '')")
        code.append(f"    response = llm.invoke(prompt)")
        code.append(f"    return {{'output': response.content}}")
        code.append("")
        
    code.append("workflow = StateGraph(GraphState)")
    for i in range(len(nodes)):
        code.append(f"workflow.add_node('node_{i}', node_{i})")
        
    if nodes:
        code.append("workflow.set_entry_point('node_0')")
        for i in range(len(nodes) - 1):
            code.append(f"workflow.add_edge('node_{i}', 'node_{i+1}')")
        code.append(f"workflow.add_edge('node_{len(nodes)-1}', END)")
        
    code.append("app = workflow.compile()\\n")
    
    code.append("if __name__ == '__main__':")
    code.append("    print('Starting LangGraph process...')")
    exec_plan = (execution_plan or 'Start execution').replace('\\n', ' ')
    code.append(f"    result = app.invoke({{'input': '{exec_plan}'}})")
    code.append("    print('Final Output:', result['output'])")
    
    return "\\n".join(code)

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
"""

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_compiler)
print("compiler.py successfully rewritten with all 3 frameworks.")
