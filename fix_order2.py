content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# The Fibonacci block needs to be between initialGraphData and renderCustomNode
# Currently: initialGraphData(34203) -> renderCustomNode(34408) -> graphData(39234) -> node.fx(41291)
# Target:    initialGraphData(34203) -> node.fx -> graphData(39234) -> renderCustomNode -> etc

# Find exact positions
idx_init = content.find('    const initialGraphData')
init_end = content.find('\n\n    const renderCustomNode', idx_init)

idx_render = content.find('    const renderCustomNode')
idx_gd = content.find('    const createForceGraph')

# Get the pre-position fibonacci block (currently after graphData call in the useEffect)
fib_marker = '    // ── Pre-position nodes before graph init'
fib_start = content.find(fib_marker)
# Find end of fib block - it ends before '    // ── Auto-rotation loop'
fib_end = content.find('    // ── Auto-rotation loop', fib_start)

fib_block = content[fib_start:fib_end]
print('Fib block found:', len(fib_block), 'chars')
print('Starts with:', fib_block[:80].encode('ascii','replace').decode())

# Remove fib block from current location
content2 = content[:fib_start].rstrip() + '\n\n' + content[fib_end:]

# Find insertion point: right after initialGraphData JSON.parse line
init_start2 = content2.find('    const initialGraphData')
init_end2 = content2.find('\n\n    ', init_start2) + 2

print('Inserting at:', init_end2)
print('Context:', content2[init_end2:init_end2+60].encode('ascii','replace').decode())

new_content = content2[:init_end2] + '\n' + fib_block + '\n' + content2[init_end2:]

open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','w',encoding='utf-8').write(new_content)

# Verify final order
c3 = new_content
print('\nFinal order:')
print('  initialGraphData at:', c3.find('const initialGraphData'))
print('  node.fx at:         ', c3.find('node.fx = px;'))
print('  graphData() at:     ', c3.find('.graphData(initialGraphData)'))
print('  fx BEFORE graphData:', c3.find('node.fx = px;') < c3.find('.graphData(initialGraphData)'))
