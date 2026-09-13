with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for i in range(len(lines)):
    if "MODO EXPANDIDO" in lines[i]:
        # The className is 2 lines above
        lines[i-2] = "              className={'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ' + (isExpanded ? 'bg-blue-900/60 border-blue-500 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700')}"

text = '\n'.join(lines)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
