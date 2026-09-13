import sys

with open("backend/routers/agents_factory.py", "r", encoding="utf-8") as f:
    code = f.read()

new_search = """search_prompt = f\"\"\"El usuario busca: \\"{req.query}\\"
Contexto: {context_info}

CATÁLOGO DISPONIBLE:

AGENTES:
{json.dumps([{"nombre": a['name'] or a.get('id',''), "categoria": a['category'], "descripcion": a['description'][:60] if a.get('description') else ''} for a in skills[:60] if isinstance(a, dict)], ensure_ascii=False, indent=1)}

KNOWLEDGE BASE:
{json.dumps([{"titulo": p['title'], "categoria": p.get('category','')} for p in prompts[:60] if isinstance(p, dict)], ensure_ascii=False, indent=1)}

INSTRUCCION: Basandote en la consulta del usuario, responde en espanol con:
1. Una breve explicacion de lo que necesita el usuario (1 oracion)
2. Lista de 3-5 agentes MAS relevantes con sus nombres EXACTOS del catalogo
3. Lista de 2-3 KB MAS relevantes con sus titulos EXACTOS del catalogo
Se conciso. Usa exactamente los nombres/titulos del catalogo.\"\"\""""

import re
code = re.sub(r'search_prompt\s*=\s*f"""[\s\S]*?"""', new_search, code)

with open("backend/routers/agents_factory.py", "w", encoding="utf-8") as f:
    f.write(code)