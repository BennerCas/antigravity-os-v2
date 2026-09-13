with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add a console.log right after initialGraphData
insert = "    console.log('Total nodes:', initialGraphData.nodes.length, 'Total links:', initialGraphData.links.length);"

idx = content.find('const SPHERE_R')
new_content = content[:idx] + insert + '\n    ' + content[idx:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
