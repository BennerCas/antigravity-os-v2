with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('{"source": "n17", "target": "n17_c04"}')
if idx != -1:
    print(content[idx-200:idx+200])
else:
    print("Not found where I injected!")
