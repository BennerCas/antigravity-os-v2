import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_logic2 = "const subSkills = gData.nodes.filter((n) => n.isSub && n.group === skill.group);"
good_logic2 = "const subSkills = gData.nodes.filter((n) => n.isSub && n.id.split('_')[0] === skill.id);"

content = content.replace(bad_logic2, good_logic2)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
