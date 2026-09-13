content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# Find the fib block wherever it is now
fib_marker = '    // ── Pre-position nodes before graph init'
auto_rot_marker = '    // ── Auto-rotation loop'
fib_start = content.find(fib_marker)
auto_start = content.find(auto_rot_marker, fib_start)
fib_block = content[fib_start:auto_start]
print('Fib block at:', fib_start, '-> len:', len(fib_block))

# Remove it
content_clean = content[:fib_start] + content[auto_start:]

# Insert right after initialGraphData JSON.parse line
marker = '    const initialGraphData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = JSON.parse(JSON.stringify(gData));\n'
insert_pos = content_clean.find(marker) + len(marker)
print('Insert position:', insert_pos, 'graphData() at:', content_clean.find('.graphData(initialGraphData)'))

final = content_clean[:insert_pos] + fib_block + content_clean[insert_pos:]

open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','w',encoding='utf-8').write(final)

# Verify
fx = final.find('node.fx = px;')
gd = final.find('.graphData(initialGraphData)')
print(f'FINAL: node.fx={fx}, graphData()={gd}, fx<gd={fx<gd}')
