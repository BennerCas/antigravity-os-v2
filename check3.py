content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# show what comes BETWEEN initialGraphData and createForceGraph
init_end_idx = content.find('const initialGraphData') + len('const initialGraphData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = JSON.parse(JSON.stringify(gData));')
create_idx = content.find('const createForceGraph')

between = content[init_end_idx:create_idx]
print('Between initialGraphData and createForceGraph (chars):',len(between))
# Check if fib block is in there
print('Has SPHERE_R:', 'SPHERE_R' in between)
print('Has node.fx:', 'node.fx' in between)
print('Has skillNodes:', 'skillNodes' in between)
