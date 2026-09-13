import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('new_gdata.ts', 'r', encoding='utf-8') as f:
    new_gdata = f.read()

start_marker = "export const gData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = {"
end_marker = "export function KnowledgeGraph3D"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_gdata + "\n" + content[end_idx:]
    with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced!")
else:
    print("Markers not found")
