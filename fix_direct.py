content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()

# Find initialGraphData and the createForceGraph call, swap the order definitively
# The Fibonacci sphere code must run on initialGraphData BEFORE .graphData() is called

# Step 1: Extract the entire Fibonacci + sub-node placement block
fib_marker = '    // ── Pre-position nodes before graph init'
auto_rot_marker = '    // ── Auto-rotation loop'

fib_start = content.find(fib_marker)
# Now find the AUTO-ROTATION marker AFTER fib_start
auto_start = content.find(auto_rot_marker, fib_start)

fib_block = content[fib_start:auto_start].strip()
print('Fib block length:', len(fib_block))

# Step 2: Remove it from current position 
content_no_fib = content[:fib_start].rstrip() + '\n\n    ' + auto_rot_marker + content[auto_start + len('    ' + auto_rot_marker):]

# Step 3: Insert it right after the initialGraphData = JSON.parse line
init_pattern = '    const initialGraphData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = JSON.parse(JSON.stringify(gData));\n'
idx = content_no_fib.find(init_pattern)
if idx < 0:
    print('ERROR: initialGraphData not found')
else:
    insert_at = idx + len(init_pattern)
    new_content = content_no_fib[:insert_at] + '\n' + fib_block + '\n\n' + content_no_fib[insert_at:]
    
    open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','w',encoding='utf-8').write(new_content)
    
    c = new_content
    fx = c.find('node.fx = px;')
    gd = c.find('.graphData(initialGraphData)')
    print(f'node.fx at {fx}, graphData() at {gd}, fx BEFORE graphData: {fx < gd}')
