from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.prompt_builder import generate_prompt_from_preset
from routers.builder_actions import call_ai

COHESION_PROMPT_DOC = (
    "Eres APEX-COHESION, un Arquitecto de Sistemas Multi-Agente Empresarial de elite. Tu mision es analizar un grafo de nodos (agentes) "
    "y AUTOCONFIGURAR los nodos que esten incompletos, vacios o mal definidos, garantizando una COHESION PERFECTA entre todos los "
    "agentes del flujo: cada nodo debe saber exactamente que recibe del anterior y que debe entregar al siguiente.\n\n"
    "REGLAS DE AUTOCONFIGURACION:\n"
    "1. NUNCA reescribas un nodo que ya este bien definido (rol especifico + prompt detallado). Solo completa o mejora los deficientes.\n"
    "2. El 'role' debe ser un rol profesional senior especifico (ej. 'Analista SEO Tecnico Senior', 'Staff Backend Engineer').\n"
    "3. El 'content' (Master Prompt) debe ser MUY detallado y estar en Espanol, incluyendo: objetivo explicito, contexto que recibira "
    "del nodo anterior (segun las conexiones del grafo), proceso de razonamiento paso a paso, formato de salida estricto, y reglas "
    "anti-alucinacion ('Si un dato no esta en el input, indicalo en lugar de inventarlo').\n"
    "4. El 'content' debe terminar SIEMPRE con la linea exacta: 'RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH.'\n"
    "5. 'variables': lista snake_case separada por comas con las variables que el prompt espera recibir (vacio si ninguna).\n"
    "6. 'framework': crewai (creativo/colaborativo), autogen (codigo/ingenieria), langgraph (maquinas de estado/condicionales) o 'auto'.\n"
    "7. 'llm_model': usa siempre 'hermes3:unlocked'.\n\n"
    "FORMATO DE SALIDA OBLIGATORIO: devuelve UNICAMENTE un JSON valido (sin marcas markdown, sin comentarios, sin texto extra) "
    "donde cada clave sea el ID del nodo y el valor un objeto con las claves: role, content, variables, framework, llm_model. "
    "Incluye TODOS los nodos del grafo, incluso los que no modificaste (con sus valores originales)."
)

ORCHESTRATOR_PROMPT_DOC = (
    "You are APEX-ORCHESTRATOR, the Meta-Orchestrator of a visual multi-agent IDE. You receive a directed graph of AI agent nodes "
    "(each with title, role, master prompt, preferred framework) plus its connections (data flow), and you must decide the single "
    "best execution framework and produce a precise, actionable execution plan.\n\n"
    "FRAMEWORK SELECTION CRITERIA (apply in order):\n"
    "1. 'langgraph' - Choose when the graph has conditional branches, loops, cycles, checkpoints, human-in-the-loop steps, or strict "
    "state-machine behavior. Signs: a node with multiple outgoing edges used as a decision, retry loops, or validation gates.\n"
    "2. 'autogen' - Choose when the core work is software engineering, code generation, debugging, math, or tool use, where agents "
    "must converse iteratively to converge on a correct artifact.\n"
    "3. 'crewai' - Choose for collaborative knowledge work: research, writing, marketing, analysis pipelines where role-based agents "
    "delegate subtasks in a sequential/hierarchical crew.\n"
    "4. If evidence is mixed, prefer the framework matching the MAJORITY of nodes; break ties toward crewai (simplest to execute).\n\n"
    "EXECUTION PLAN REQUIREMENTS:\n"
    "- Ordered execution phases respecting the DAG topology (which nodes run first, which can run in parallel).\n"
    "- For each node: its exact input (from which upstream node), its responsibility, and its expected output artifact.\n"
    "- Failure strategy per critical node (retry, fallback, or abort).\n"
    "- A final aggregation step describing how outputs merge into the final deliverable.\n\n"
    "OUTPUT FORMAT (strict, no markdown fences):\n"
    "FRAMEWORK: <crewai|autogen|langgraph>\n"
    "PLAN: <detailed execution plan, in Spanish, structured with numbered phases>"
)

router = APIRouter(
    prefix="/execute",
    tags=["Execution"]
)

class ExecuteRequest(BaseModel):
    framework: str  # 'autogen' or 'crewai'
    task_description: str
    preset_name: Optional[str] = "saas-landing"

class ExecuteResponse(BaseModel):
    status: str
    framework_used: str
    generated_prompt: Optional[str] = None
    message: str

@router.post("/", response_model=ExecuteResponse)
def execute_task(request: ExecuteRequest):
    # Determine the framework to use
    framework = request.framework.lower()
    
    if framework not in ["autogen", "crewai"]:
        raise HTTPException(status_code=400, detail="Unsupported framework. Choose 'autogen' or 'crewai'.")

    # Integrate the modular concepts from Promter
    # This generates a prompt based on the chosen preset and task
    try:
        composed_prompt = generate_prompt_from_preset(request.preset_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prompt from Promter: {str(e)}")
        
    full_prompt = f"Task: {request.task_description}\n\nContext Prompt:\n{composed_prompt}"

    # Here we would initialize and run either autogen or crewai
    if framework == "autogen":
        # TODO: Implement AutoGen execution logic here
        return ExecuteResponse(
            status="success",
            framework_used="autogen",
            generated_prompt=full_prompt,
            message="Scaffolding ready. AutoGen framework would be executed here."
        )
    elif framework == "crewai":
        # TODO: Implement CrewAI execution logic here
        return ExecuteResponse(
            status="success",
            framework_used="crewai",
            generated_prompt=full_prompt,
            message="Scaffolding ready. CrewAI framework would be executed here."
        )

class NodeData(BaseModel):
    id: str
    title: str = "Sin Título"
    content: str = ""
    role: str = "Default Agent"
    framework: str = "auto"
    type: str = "mainPrompt"
    variables: str = ""
    llm_model: str = "hermes3:unlocked"
    temperature: float = 0.7
    output_schema: str = '{"type": "object"}'

class EdgeData(BaseModel):
    source: str
    target: str

class TaskNodeExecuteRequest(BaseModel):
    task_description: str
    nodes: List[NodeData] = []
    edges: List[EdgeData] = []

class TaskNodeExecuteResponse(BaseModel):
    framework: str
    execution_plan: str
    model_used: str
    updated_nodes: Optional[List[NodeData]] = None
    cohesion_applied: bool = False
    cohesion_error: Optional[str] = None

@router.post("/task", response_model=TaskNodeExecuteResponse)
async def execute_task_endpoint(request: TaskNodeExecuteRequest):
    import json
    
    # 1. Pre-Processing: Cohesion & Autocomplete
    # Check if we need to auto-configure nodes (e.g., missing role, very short content)
    needs_autoconfig = any(n.role == "Default Agent" or len(n.content) < 30 for n in request.nodes)
    cohesion_applied = False
    cohesion_error = None
    
    if needs_autoconfig:
        cohesion_sys = COHESION_PROMPT_DOC
        
        graph_desc = f"Task Global: {request.task_description}\nNodos:\n"
        for n in request.nodes:
            graph_desc += f"- ID: {n.id} | Título: {n.title} | Rol: {n.role} | Prompt: {n.content}\n"
        graph_desc += "\nConexiones:\n"
        for e in request.edges:
            graph_desc += f"- {e.source} -> {e.target}\n"
            
        try:
            cohesion_res, _ = await call_ai(cohesion_sys, graph_desc)
            cohesion_res = cohesion_res.replace("```json", "").replace("```", "").strip()
            import re
            updates = None
            last_err = None
            # Intento 1: JSON directo. Intento 2: extraer el objeto mas externo. Intento 3: reparar comillas simples.
            candidates = [cohesion_res]
            m = re.search(r'\{.*\}', cohesion_res, re.DOTALL)
            if m:
                candidates.append(m.group(0))
            for cand in candidates:
                for variant in (cand, cand.replace("'", '"')):
                    try:
                        parsed = json.loads(variant, strict=False)
                        if isinstance(parsed, dict):
                            updates = parsed
                            break
                    except Exception as ex:
                        last_err = ex
                if updates is not None:
                    break
            if updates is None:
                cohesion_error = f"JSON no parseable: {last_err}"
                print("[COHESION] Parse failed:", last_err, "| Raw (200):", cohesion_res[:200])
            else:
                applied = 0
                for n in request.nodes:
                    if n.id in updates and isinstance(updates[n.id], dict):
                        upd = updates[n.id]
                        if upd.get("role"):
                            n.role = upd["role"]
                        if upd.get("content"):
                            n.content = upd["content"]
                        if upd.get("variables"):
                            n.variables = upd["variables"]
                        if upd.get("framework"):
                            n.framework = upd["framework"]
                        applied += 1
                cohesion_applied = applied > 0
                if not cohesion_applied:
                    cohesion_error = "JSON parseado pero ningun ID de nodo coincidio"
                    print("[COHESION] No node IDs matched. Keys:", list(updates.keys()))
        except Exception as e:
            cohesion_error = str(e)
            print("[COHESION] Failed:", e)
    system_prompt = ORCHESTRATOR_PROMPT_DOC
    
    # Format the graph for the LLM
    graph_str = f"Task Description: {request.task_description}\n\nNodes (Agents/Steps):\n"
    for n in request.nodes:
        graph_str += f"- [{n.id}] {n.title} (Role: {n.role} | Preferred FW: {n.framework})\n  Prompt: {n.content}\n"
    
    graph_str += "\nConnections (Data Flow):\n"
    for e in request.edges:
        graph_str += f"- {e.source} -> {e.target}\n"

    user_prompt = (
        f"{graph_str}\n\n"
        "Analyze the above graph. Which framework should orchestrate this workflow, and how will it be executed?"
    )
    
    try:
        result_text, model_name = await call_ai(system_prompt, user_prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    framework = "crewai"
    lines = result_text.split("\n")
    for line in lines:
        if line.upper().startswith("FRAMEWORK:"):
            fw = line.split(":", 1)[1].strip().lower()
            if "crewai" in fw: framework = "crewai"
            elif "autogen" in fw: framework = "autogen"
            elif "langgraph" in fw: framework = "langgraph"
            else: framework = fw
            break
            
    return TaskNodeExecuteResponse(
        framework=framework,
        execution_plan=result_text,
        model_used=model_name,
        updated_nodes=request.nodes,
        cohesion_applied=cohesion_applied,
        cohesion_error=cohesion_error
    )
