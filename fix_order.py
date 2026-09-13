content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# The fix: move all the Fibonacci/position-setting code BEFORE the graph chain call
# Find the block that creates the graph and sets graphData
graph_chain_start = content.find('    const createForceGraph = ForceGraph3D')
graph_chain_end = content.find('    // ── Fibonacci sphere:', graph_chain_start)

# Get the fibonacci block (from '// ── Fibonacci sphere:' to 'graph.d3Force')
fib_start = content.find('    // ── Fibonacci sphere:', graph_chain_end)
fib_end = content.find('    // disable all forces so nothing drifts\n    graph.d3Force', fib_start)
# Include the 3 d3Force(null) calls
after_fib_end = content.find('\n\n    // ── Auto-rotation loop', fib_end)

fib_block = content[fib_start:after_fib_end]  # includes the d3Force nulls

# Remove fib block from its current position
content_no_fib = content[:fib_start] + content[after_fib_end:]

# Now find the initialGraphData declaration  
init_idx = content_no_fib.find('    const initialGraphData: {')
# Find end of that const
init_end = content_no_fib.find('\n\n', init_idx) + 2

# Insert fib block AFTER initialGraphData and BEFORE createForceGraph
insert_at = content_no_fib.find('    const renderCustomNode', init_end)

# Build updated content: up to init_end, then fib block, then rest
new_content = (
    content_no_fib[:init_end] +
    '\n    // ── Pre-position nodes before graph init (must happen before graphData()) ──\n' +
    fib_block + '\n\n' +
    content_no_fib[insert_at:]
)

open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','w',encoding='utf-8').write(new_content)
print('Order fixed. Fib block moved before renderCustomNode.')

# Verify
content2 = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()
idx_gd = content2.find('.graphData(initialGraphData)')
idx_fx = content2.find('node.fx = px;')
print(f'graphData() at char {idx_gd}, node.fx at char {idx_fx}')
print(f'fx BEFORE graphData: {idx_fx < idx_gd}')
