with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
start_idx = -1
for i in range(len(lines)):
    if 'title="Expandir/Contraer grafo para mejor legibilidad"' in lines[i]:
        start_idx = i
        break

if start_idx != -1:
    # lines[start_idx+1] has the bad classname
    # lines[start_idx+2] has the other bad classname
    # wait, let's just delete anything between title=... and <Crosshair
    end_idx = start_idx
    while '<Crosshair' not in lines[end_idx]:
        end_idx += 1
    
    # We replace from start_idx + 1 to end_idx - 1 with our classname + '>'
    new_btn = "              className={'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ' + (isExpanded ? 'bg-blue-900/60 border-blue-500 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700')}\n            >"
    
    lines[start_idx+1 : end_idx] = [new_btn]

text = '\n'.join(lines)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
