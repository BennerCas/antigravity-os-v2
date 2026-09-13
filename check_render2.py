import sys
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const renderCustomNode')
sys.stdout.buffer.write(content[idx:idx+800].encode('utf-8'))
