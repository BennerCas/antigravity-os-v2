with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "MODO EXPANDIDO" in lines[min(i+3, len(lines)-1)]:
        if "className=" in line:
            print(f"Found at line {i+1}")
            lines[i] = "              className={lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }\n"

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
