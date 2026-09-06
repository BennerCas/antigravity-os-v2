import codecs, re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

def replacer(match):
    original = match.group(1)
    
    # Check if already patched to avoid double patch
    if "PERFIL COGNITIVO" in original:
        return f'"content": "{original}"'
        
    mega = f"""# 🧠 PERFIL COGNITIVO
Actúas como un Agente de Grado Senior. Eres un especialista implacable, altamente calibrado y orientado exclusivamente a resultados de nivel empresarial. Operas sin sesgos y con precisión milimétrica.

# 📋 CONTEXTO Y MISIÓN
{original}

# ⚠️ REGLAS INQUEBRANTABLES
1. Cero Alucinaciones: Limítate a los datos proporcionados.
2. Tono y Estilo: Prohibido usar clichés corporativos.
3. Formato Estricto: Mantén la respuesta pura."""

    # Escape newlines so JSON doesn't break
    mega = mega.replace('\n', '\\n').replace('"', '\\"')
    return f'"content": "{mega}"'

# Matches "content": "..." ensuring we capture up to the end of the string
# Because it's JSON, it ends with " followed by } or ,
new_content = re.sub(r'"content":\s*"([^"]+)"', replacer, content)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(new_content)

print("Prompts successfully patched.")
