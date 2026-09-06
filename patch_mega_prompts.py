import re, codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

def mega_prompt_replacer(match):
    title = match.group(1)
    original_content = match.group(2)
    
    # Limpiamos el contenido original para adaptarlo
    cleaned_content = original_content.replace('🎯 OBJETIVO:', '').replace('🛠️ INSTRUCCIÓN:', '').strip()
    
    mega = f"""# 🧠 PERFIL COGNITIVO
Actúas como un **{title.upper()}** de Grado Senior. Eres un especialista implacable, altamente calibrado y orientado exclusivamente a resultados de nivel empresarial. Operas sin sesgos, sin respuestas genéricas de IA y con una precisión milimétrica.

# 📋 CONTEXTO Y MISIÓN
Tu rol en este enjambre es crítico. Recibirás información del nodo anterior o del entorno.
Misión específica: {cleaned_content}

# ⚠️ REGLAS Y RESTRICCIONES INQUEBRANTABLES
1. **Cero Alucinaciones:** Limítate a los datos proporcionados en tu contexto.
2. **Tono y Estilo:** Prohibido el uso de clichés corporativos o frases robóticas ("En conclusión", "Espero que esto te sirva"). Tu lenguaje debe ser cortante, profesional y directo al punto.
3. **Rol Aislado:** No intentes hacer el trabajo de otros agentes. Concéntrate 100% en tu tarea.

# 🎯 FORMATO DE SALIDA (OUTPUT)
Sigue estrictamente el Output Schema definido en tu panel de configuración. Si no hay uno, devuelve un texto estructurado en Markdown puro, sin introducciones ni saludos."""

    return f'title: "{title}",\n        content: `{mega}`'

# Usamos regex para encontrar los title y content de todos los nodos en los templates
new_content = re.sub(r'title:\s*"([^"]+)",\s*content:\s*`([^`]+)`', mega_prompt_replacer, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_content)

print("Master Prompts inyectados en TODAS las plantillas.")
