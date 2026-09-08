import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_prompt = """      const promptText = `Eres un Ingeniero de IA hispanohablante. Tu objetivo es mejorar este prompt.
INSTRUCCIÓN CRÍTICA: Responde EXACTAMENTE con esta estructura (incluyendo los encabezados):

### EXPLICACION
[Escribe aquí tu justificación detallada en ESPAÑOL de por qué es mejor (2 a 3 líneas)]

### PROMPT MEJORADO
[Escribe aquí el prompt mejorado en formato Markdown, estrictamente en español]

Prompt Original a mejorar:
${inspectedPrompt.content}`;"""

new_prompt = """      const promptText = `Eres un Ingeniero de Prompts Experto. Tu objetivo es transformar el prompt del usuario en una plantilla profesional.
Primero, clasifica la intención del prompt original y selecciona EL MEJOR de estos 5 frameworks para reescribirlo:
1. RTF (Rol, Tarea, Formato): Para tareas mecánicas y directas.
2. APE (Acción, Propósito, Expectativa): Para evaluación y decisiones rápidas.
3. CREATE (Personaje, Petición, Explicación, Ajustes, Tipo de salida, Extras): Para tareas complejas, agentes o sistemas.
4. CARE (Contexto, Acción, Resultado, Ejemplo): Para auditoría, análisis de datos o consultoría.
5. Chain of Thought (Paso a paso): Para lógica, matemáticas o debugging crítico.

INSTRUCCIÓN CRÍTICA: Responde EXACTAMENTE con esta estructura:

### EXPLICACION
[Escribe tu justificación detallada de 2 a 3 líneas sobre por qué elegiste ese framework específico (RTF, APE, CREATE, CARE o CoT) y cómo mejoró el prompt]

### PROMPT MEJORADO
**[FRAMEWORK UTILIZADO: <Nombre del Framework Elegido>]**

[Escribe aquí el prompt final optimizado aplicando el framework elegido, en formato Markdown]

Prompt Original a mejorar:
${inspectedPrompt.content}`;"""

code = code.replace(old_prompt, new_prompt)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Prompt logic updated!")

