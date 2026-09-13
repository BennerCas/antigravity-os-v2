import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    full_str = match.group(0)
    if "'info'" in full_str:
        return "className={\lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 \\}"
    if "'competencias'" in full_str:
        return "className={\lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 \\}"
    if "'sistema'" in full_str:
        return "className={\lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 \\}"
    if "'progreso'" in full_str:
        return "className={\lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 \\}"
    return full_str

content = re.sub(r'className=\{\lex-1[^}]+?bg-blue-600[^}]+?\}\\}', replacer, content, flags=re.DOTALL)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
