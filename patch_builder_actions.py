import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\builder_actions.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

new_code = '''
class AutocompleteRequest(BaseModel):
    title: str
    content: str
    role: str = ""
    framework: str = "auto"
    variables: str = ""

@router.post("/autocomplete_node")
async def autocomplete_node(req: AutocompleteRequest):
    system_prompt = (
        "Eres un Arquitecto de IA Experto de Grado Empresarial. Tu trabajo es tomar el nombre y contexto "
        "de un nodo (agente) y auto-completar su configuración entera para un sistema multi-agente (como CrewAI o AutoGen).\\n\\n"
        "REGLA OBLIGATORIA: Escribe el 'content' (el prompt principal) en ESPAÑOL para el usuario, "
        "pero **debes** añadir una nota final firme en INGLÉS diciendo: 'RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH.'\\n\\n"
        "Debes responder **EXCLUSIVAMENTE** con un JSON puro (sin marcas de markdown ```json). El JSON debe contener las siguientes claves:\\n"
        "- content: El prompt mejorado (En español, terminando con la nota de reglas en inglés).\\n"
        "- role: El rol específico corporativo (ej. 'Senior Data Analyst').\\n"
        "- variables: Variables clave inferidas separadas por coma (ej. 'topic, user_query').\\n"
        "- framework: El framework ideal ('crewai', 'autogen' o 'langgraph').\\n"
        "- llm_model: Sugerencia del mejor modelo para la tarea ('hermes3:8b', 'gpt-4o', etc).\\n"
        "- temperature: '0.0' a '1.0' (Cadena de texto).\\n"
        "- output_schema: Un pequeño JSON representativo de lo que este agente debería devolver.\\n"
    )
    
    user_prompt = f"Nodo Título: {req.title}\\nContexto Actual: {req.content}\\nRol Actual: {req.role}\\nFramework Actual: {req.framework}\\nVariables: {req.variables}\\n\\nAuto-completa y mejora todo en formato JSON puro."
    
    import json
    try:
        result_text, model_name = await call_ai(system_prompt, user_prompt)
        
        # Limpiar posible markdown
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        
        # Intentar parsear el JSON
        try:
            parsed = json.loads(result_text)
            return {"status": "success", "data": parsed}
        except json.JSONDecodeError:
            # Fallback en caso de que el LLM no responda un JSON perfecto
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return {"status": "success", "data": parsed}
            raise Exception("El LLM no devolvió un JSON válido.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''

content += new_code

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Endpoint autocomplete_node agregado con éxito.")
