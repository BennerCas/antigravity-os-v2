import re, json
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

nodes_match = re.search(r'nodes:\s*\[(.*?)\]\s*,\s*links:', content, re.DOTALL)
if nodes_match:
    nodes_str = nodes_match.group(1)
    lines = nodes_str.strip().split('\n')
    for i in range(10): # print first 10 nodes
        print(lines[i].strip())
    print("...")
    for i in range(len(lines)-10, len(lines)):
        print(lines[i].strip())
