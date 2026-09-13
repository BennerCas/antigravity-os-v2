import re

path = r"C:\antigravityAS\Antigravity_OS_v2\backend\routers\architecture.py"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to remove arch["flow"].extend([ ... ]) and append those prompts directly to the "builder" step (which is id="builder").
# A safer way: we can just add a completely new APP to rch["apps"] called "Engine Autonomy & Prompts" so it stands out with a 100% guarantee it's visible.

if 'arch["flow"].extend([' in content:
    idx_start = content.find('arch["flow"].extend([')
    idx_end = content.find('return arch', idx_start)
    content = content[:idx_start] + content[idx_end:]

new_app = '''
    arch["apps"].insert(0, {
        "id": "master_prompts",
        "name": "🌟 Master Prompts (Nuevos)",
        "what": "Colección completa de los 23 nuevos Master Prompts integrados en las pestañas del Builder.",
        "prompts": [
            {"key": "requirements_gatekeeper", "used_at": "Flow Architect Tab", "text": REQUIREMENTS_GATEKEEPER_SYSTEM, "explanation": "Filtro estricto que no deja avanzar si tu idea es ambigua."},
            {"key": "architecture_alternatives", "used_at": "Flow Architect Tab", "text": ARCHITECTURE_ALTERNATIVES_SYSTEM, "explanation": "Te propone 3 caminos (Rápido, Preciso, Local) antes de generar."},
            {"key": "feasibility_cost_analyzer", "used_at": "Flow Architect Tab", "text": FEASIBILITY_COST_ANALYZER_SYSTEM, "explanation": "Audita si tu computadora o presupuesto aguantan el diseño."},
            {"key": "state_schema_designer", "used_at": "Flow Architect Tab", "text": STATE_SCHEMA_DESIGNER_SYSTEM, "explanation": "Diseña el JSON/Base de datos temporal que usarán los agentes."},
            
            {"key": "canvas_validator", "used_at": "FlowBoard Tab", "text": CANVAS_VALIDATOR_SYSTEM, "explanation": "Analiza la topología del canvas, detectando ciclos infinitos y nodos aislados."},
            {"key": "edge_contract_generator", "used_at": "FlowBoard Tab", "text": EDGE_CONTRACT_GENERATOR_SYSTEM, "explanation": "Asegura que los outputs de un nodo coincidan con el input esperado del siguiente."},
            {"key": "dynamic_router", "used_at": "FlowBoard Tab", "text": DYNAMIC_ROUTER_SYSTEM, "explanation": "Clasifica la intención del usuario y decide en tiempo real a qué agente derivar."},
            {"key": "tool_discovery", "used_at": "FlowBoard Tab", "text": TOOL_DISCOVERY_SYSTEM, "explanation": "Analiza un problema y escoge la herramienta exacta (ej. Python, Web Search)."},
            {"key": "skill_synthesizer", "used_at": "FlowBoard Tab", "text": SKILL_SYNTHESIZER_SYSTEM, "explanation": "Funde múltiples roles en un súper-agente cohesivo."},
            {"key": "cost_token_optimizer", "used_at": "FlowBoard Tab", "text": COST_TOKEN_OPTIMIZER_SYSTEM, "explanation": "Filtra ruido del prompt, minimizando tokens para ahorrar dinero y tiempo."},
            
            {"key": "root_cause_analyzer", "used_at": "Run Inspector Tab", "text": ROOT_CAUSE_ANALYZER_SYSTEM, "explanation": "Realiza una autopsia exhaustiva de la traza de ejecución y logs de error."},
            {"key": "auto_patcher", "used_at": "Run Inspector Tab", "text": AUTO_PATCHER_SYSTEM, "explanation": "Sintetiza y aplica parches dinámicos al código para restaurar operatividad."},
            {"key": "hallucination_detector", "used_at": "Run Inspector Tab", "text": HALLUCINATION_DETECTOR_SYSTEM, "explanation": "Cruza salidas generativas contra el contexto base para detectar invenciones."},
            {"key": "cognitive_profiler", "used_at": "Run Inspector Tab", "text": COGNITIVE_PROFILER_SYSTEM, "explanation": "Monitorea el comportamiento de razonamiento, evaluando coherencia y sesgos."},
            {"key": "data_leak_scanner", "used_at": "Run Inspector Tab", "text": DATA_LEAK_SCANNER_SYSTEM, "explanation": "Salvaguarda información confidencial escaneando proactivamente el contexto de entrada y salida."},
            
            {"key": "test_scenario_generator", "used_at": "Run Results Tab", "text": TEST_SCENARIO_GENERATOR_SYSTEM, "explanation": "Diseña escenarios de prueba extremos y de casos límite para desafiar la robustez del flujo."},
            {"key": "output_evaluator", "used_at": "Run Results Tab", "text": OUTPUT_EVALUATOR_SYSTEM, "explanation": "Califica la calidad final de los resultados producidos contrastándolos con criterios de éxito."},
            
            {"key": "security_guardrail", "used_at": "Engine Autonomy", "text": SECURITY_GUARDRAIL_SYSTEM, "explanation": "Última línea de defensa, bloquea ejecución de código o herramientas peligrosas."},
            {"key": "hitl_manager", "used_at": "Engine Autonomy", "text": HITL_MANAGER_SYSTEM, "explanation": "Negociador de escalamiento que pausa el estado para solicitar instrucciones humanas."},
            {"key": "context_memory_strategist", "used_at": "Engine Autonomy", "text": CONTEXT_MEMORY_STRATEGIST_SYSTEM, "explanation": "Orquesta gestión de memoria a corto y largo plazo para evitar degradación de contexto."},
            {"key": "debate_moderator", "used_at": "Engine Autonomy", "text": DEBATE_MODERATOR_SYSTEM, "explanation": "Arbitra el proceso de consenso cuando múltiples sub-agentes proponen soluciones divergentes."},
            {"key": "meta_prompt_optimizer", "used_at": "Engine Autonomy", "text": META_PROMPT_OPTIMIZER_SYSTEM, "explanation": "Reescribe y optimiza prompts dinámicamente según rendimiento empírico."}
        ]
    })
'''

# insert new_app before return arch
idx_return = content.find('return arch')
content = content[:idx_return] + new_app + '\n    ' + content[idx_return:]

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
