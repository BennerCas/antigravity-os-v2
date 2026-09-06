import json, codecs, re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

def process_match(match):
    prefix = match.group(1)
    json_str = match.group(2)
    suffix = match.group(3)
    
    try:
        data = json.loads(json_str)
        for node in data.get("nodes", []):
            if "data" in node and "content" in node["data"]:
                title = node["data"].get("title", "Agente")
                original = node["data"]["content"]
                
                mega = f"""# 🧠 PERFIL COGNITIVO
Actúas como un **{title.upper()}** de Grado Senior. Eres un especialista implacable, altamente calibrado y orientado exclusivamente a resultados de nivel empresarial. Operas sin sesgos y con precisión milimétrica.

# 📋 CONTEXTO Y MISIÓN
{original}

# ⚠️ REGLAS INQUEBRANTABLES
1. Cero Alucinaciones: Limítate a los datos proporcionados.
2. Tono y Estilo: Prohibido usar clichés corporativos.
3. Formato Estricto: Mantén la respuesta pura."""
                node["data"]["content"] = mega
        
        return prefix + json.dumps(data) + suffix
    except Exception as e:
        print("Error parsing JSON:", e)
        return match.group(0)

# Replace builderData: {...}
new_content = re.sub(r'(builderData:\s*)({.*?})([,\n\}])', process_match, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_content)

print("Master Prompts inyectados en TODAS las plantillas mediante parseo JSON.")
