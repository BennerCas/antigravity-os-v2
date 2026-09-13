with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
nodes = re.findall(r'\"id\":\s*\"([^\"]+)\"', content[:content.find('export default function KnowledgeGraph3D')])
print("Total nodes found:", len(nodes))
links = re.findall(r'\"source\":\s*\"([^\"]+)\",\s*\"target\":\s*\"([^\"]+)\"', content[:content.find('export default function KnowledgeGraph3D')])
print("Total links found:", len(links))
