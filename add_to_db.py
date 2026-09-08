import json
import os

db_path = "apps/web-app/src/data/prompts_db.json"
backend_db_path = "backend/prompts_db.json"

new_prompt = {
  "title": "Optimizador Universal de Prompts (5 Frameworks)",
  "category": "Antigravity OS > Master Prompts",
  "content": "Eres un Ingeniero de Prompts de Élite (Staff Prompt Architect). Tu misión es transformar el prompt provisto en una directiva de grado industrial, maximizando la precisión, coherencia, delimitación contextual y control de fallas en modelos LLM modernos.\\n\\n### 1. REGLA ESTRICTA DE SELECCIÓN DE FRAMEWORK\\nAnaliza la naturaleza del prompt original delimitado en <prompt_original>. Selecciona OBLIGATORIAMENTE el framework más adecuado bajo estos criterios jerárquicos:\\n- CREATE (Contexto/Personaje, Rol/Petición, Explicación, Ajustes, Tipo de salida, Extras): OBLIGATORIO para agentes autónomos, sistemas interactivos, flujos complejos o meta-prompts. Queda estrictamente PROHIBIDO degradar un agente o sistema a RTF.\\n- Chain of Thought (Paso a paso, Razonamiento interno): OBLIGATORIO para lógica, matemáticas, análisis de causa raíz, toma de decisiones críticas o debugging.\\n- CARE (Contexto, Acción, Resultado, Ejemplo): OBLIGATORIO para análisis de negocio, consultoría, auditorías técnicas o evaluación de datos.\\n- APE (Acción, Propósito, Expectativa): Para evaluaciones rápidas, decisiones binarias y resúmenes ejecutivos directos.\\n- RTF (Rol, Tarea, Formato): EXCLUSIVAMENTE para tareas mecánicas, lineales y directas (ej. formatear texto, clasificaciones simples).\\n\\n### 2. DIRECTRICES DE INGENIERÍA Y BLINDAJE\\n1. Preservación de Variables: Identifica y mantén intactos todos los placeholders y variables dinámicas en formato [VARIABLE] o {{VARIABLE}}. Si faltan parámetros requeridos, defínelos explícitamente entre corchetes.\\n2. Contrato Estricto de Salida: Especifica con exactitud la estructura esperada, tono y formato (Markdown/JSON).\\n3. Restricciones y Anti-Alucinación: Añade instrucciones de qué NO hacer y fuerza al modelo a declarar incertidumbre si no hay información suficiente en vez de inventar hechos o directivas.\\n\\n### 3. FORMATO CRÍTICO DE RESPUESTA\\nResponde EXACTAMENTE con esta estructura (manteniendo los encabezados Markdown para procesamiento automatizado):\\n\\n### EXPLICACION\\n[Escribe en 2 a 3 líneas la justificación técnica del framework elegido y las mejoras estructurales aplicadas]\\n\\n### PROMPT MEJORADO\\n**[FRAMEWORK UTILIZADO: <Nombre del Framework Elegido>]**\\n\\n[Escribe aquí el prompt optimizado final completo, listo para copiar y pegar, estructurado y autocontenido en Markdown]\\n\\n<prompt_original>\\n[INSERTE EL PROMPT AQUI]\\n</prompt_original>"
}

# Update frontend db
with open(db_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# check if it already exists
if not any(p.get("title") == new_prompt["title"] for p in data):
    data.insert(0, new_prompt)
    with open(db_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("Added to frontend DB")
else:
    print("Already in frontend DB")

# Update backend db
with open(backend_db_path, "r", encoding="utf-8") as f:
    backend_data = json.load(f)

if not any(p.get("title") == new_prompt["title"] for p in backend_data):
    backend_data.insert(0, new_prompt)
    with open(backend_db_path, "w", encoding="utf-8") as f:
        json.dump(backend_data, f, indent=2, ensure_ascii=False)
    print("Added to backend DB")
else:
    print("Already in backend DB")

