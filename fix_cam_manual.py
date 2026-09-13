import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find all lines with graphRef.current.cameraPosition (besides the useEffect one already removed)
bad_starts = []
for i, line in enumerate(lines):
    if 'graphRef.current.cameraPosition' in line:
        bad_starts.append(i)

print('Lines with cameraPosition:', bad_starts)

# For each, find the block and mark for removal
to_remove = set()
for start in bad_starts:
    # Walk backward to find the 'if' that opens this block
    block_start = start
    for j in range(start, max(start-10, 0), -1):
        if 'graphRef.current &&' in lines[j] or ('if (' in lines[j] and 'typeof' in lines[j]):
            block_start = j
            break
    # Walk forward to find closing brace
    open_braces = 0
    block_end = start
    for j in range(block_start, min(start+20, len(lines))):
        open_braces += lines[j].count('{')
        open_braces -= lines[j].count('}')
        block_end = j
        if open_braces <= 0 and j > block_start:
            break
    for j in range(block_start, block_end + 1):
        to_remove.add(j)

print(f'Removing lines: {sorted(to_remove)}')

new_lines = [l for i, l in enumerate(lines) if i not in to_remove]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done')
