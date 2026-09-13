import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the duplicate block
dup_start = content.find('    const SPHERE_R = 300;\n    const goldenAngle = Math.PI * (3 - Math.sqrt(5));', content.find('.graphData(initialGraphData)'))

if dup_start != -1:
    # Find the end of the duplicate block
    dup_end = content.find('    // disable all forces so nothing drifts', dup_start)
    
    if dup_end != -1:
        new_content = content[:dup_start] + content[dup_end:]
        with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Duplicate block removed successfully.")
    else:
        print("Could not find end of duplicate block.")
else:
    print("Could not find duplicate block.")
