import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'className=\{[^}]*lex items-center gap-2 text-xs font-semibold px-3 py-1\.5 rounded-lg border transition-all \}', "className={lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }", content)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
