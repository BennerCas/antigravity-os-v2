import re
content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# Count ALL nodes in gData
nodes = re.findall(r'\{\"id\":\s*\"([^\"]+)\"', content)
links = re.findall(r'\{\"source\":\s*\"([^\"]+)\",\s*\"target\":\s*\"([^\"]+)\"', content)
isSub = re.findall(r'\"id\":\s*\"([^\"]+)\"[^}]+\"isSub\":\s*true', content)
mainSkill = [n for n in nodes if re.match(r'^n\d+$', n)]

print(f'Total nodes in gData: {len(nodes)}')
print(f'Main skill nodes: {len(mainSkill)} -> {mainSkill}')
print(f'Sub/mission nodes: {len(isSub)} -> {isSub}')
print(f'Total links: {len(links)}')

# Show where graphData is called vs where we set fx
idx_gd = content.find('.graphData(initialGraphData)')
idx_fx = content.find('node.fx = px;')
print(f'\ngraphData() call at char: {idx_gd}')
print(f'node.fx = px at char: {idx_fx}')
print(f'Order OK (fx before graphData): {idx_fx < idx_gd}')
