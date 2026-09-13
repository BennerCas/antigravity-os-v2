with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all' in line:
        lines[i] = "              className={lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }\n"

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
