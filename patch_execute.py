import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\execute.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Add updated_nodes to TaskNodeExecuteResponse
content = content.replace(
    'class TaskNodeExecuteResponse(BaseModel):\n    framework: str\n    execution_plan: str\n    model_used: str',
    'class TaskNodeExecuteResponse(BaseModel):\n    framework: str\n    execution_plan: str\n    model_used: str\n    updated_nodes: Optional[List[NodeData]] = None'
)

# Replace execute_task_endpoint logic
old_func = '''@router.post("/task", response_model=TaskNodeExecuteResponse)
async def execute_task_endpoint(request: TaskNodeExecuteRequest):'''

new_func = '''@router.post("/task", response_model=TaskNodeExecuteResponse)
async def execute_task_endpoint(request: TaskNodeExecuteRequest):
    import json
    
    # 1. Pre-Processing: Cohesion & Autocomplete
    # Check if we need to auto-configure nodes (e.g., missing role, very short content)
    needs_autoconfig = any(n.role == "Default Agent" or len(n.content) < 30 for n in request.nodes)
    
    if needs_autoconfig:
        cohesion_sys = (
            "Eres un Arquitecto de Sistemas Multi-Agente Empresarial. Tu tarea es analizar un grafo de nodos (agentes) "
            "y autoconfigurar aquellos que estén incompletos o vacíos, asegurando una COHESIÓN PERFECTA entre todos los agentes del flujo.\\n"
            "Devuelve ÚNICAMENTE un JSON válido (sin marcas markdown) donde cada clave sea el ID del nodo, y el valor sea un objeto con:\\n"
            "{ 'role': '...', 'content': '...', 'variables': '...', 'framework': 'auto', 'llm_model': 'hermes3:8b' }.\\n"
            "REGLA OBLIGATORIA: El 'content' (Master Prompt) debe estar en Español y muy detallado, pero debe terminar SIEMPRE con: "
            "'RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH.'"
        )
        
        graph_desc = f"Task Global: {request.task_description}\\nNodos:\\n"
        for n in request.nodes:
            graph_desc += f"- ID: {n.id} | Título: {n.title} | Rol: {n.role} | Prompt: {n.content}\\n"
        graph_desc += "\\nConexiones:\\n"
        for e in request.edges:
            graph_desc += f"- {e.source} -> {e.target}\\n"
            
        try:
            cohesion_res, _ = await call_ai(cohesion_sys, graph_desc)
            cohesion_res = cohesion_res.replace("```json", "").replace("```", "").strip()
            # Intento de parseo de JSON
            import re
            json_match = re.search(r'\{.*\}', cohesion_res, re.DOTALL)
            if json_match:
                updates = json.loads(json_match.group(0))
                for n in request.nodes:
                    if n.id in updates:
                        upd = updates[n.id]
                        n.role = upd.get("role", n.role)
                        n.content = upd.get("content", n.content)
                        n.variables = upd.get("variables", getattr(n, 'variables', ''))
                        n.framework = upd.get("framework", n.framework)
        except Exception as e:
            print("Auto-config cohesion failed, continuing with original nodes. Error:", e)'''

content = content.replace(old_func, new_func)

# Return the updated nodes in the return statement
content = content.replace(
    'return TaskNodeExecuteResponse(\n        framework=framework,\n        execution_plan=result_text,\n        model_used=model_name\n    )',
    'return TaskNodeExecuteResponse(\n        framework=framework,\n        execution_plan=result_text,\n        model_used=model_name,\n        updated_nodes=request.nodes\n    )'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("execute.py modified successfully.")
