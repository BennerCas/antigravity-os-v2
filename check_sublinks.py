with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
links = re.findall(r'\"source\":\s*\"([^\"]+)\",\s*\"target\":\s*\"([^\"]+)\"', content[:content.find('export default function KnowledgeGraph3D')])

sub_nodes = set(re.findall(r'\"id\":\s*\"([^\"]+)\"[^}]+\"isSub\":\s*true', content))

# Find existing links where BOTH source and target are sub-nodes
sub_to_sub = [(s,t) for (s,t) in links if s in sub_nodes and t in sub_nodes]
print("Existing sub-to-sub links:", sub_to_sub)
