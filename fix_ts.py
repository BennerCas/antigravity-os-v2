import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("sub.fx = node.fx! + orbit", "sub.fx = (node.fx as number) + orbit")
content = content.replace("sub.fy = node.fy! + orbit", "sub.fy = (node.fy as number) + orbit")
content = content.replace("sub.fz = node.fz! + orbit", "sub.fz = (node.fz as number) + orbit")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
