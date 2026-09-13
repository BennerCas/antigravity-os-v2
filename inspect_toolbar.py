import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('ROTACIÓN')
if idx != -1:
    print(content[idx-200:idx+300])
else:
    print("Not found")
