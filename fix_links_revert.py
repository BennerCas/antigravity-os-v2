with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's completely remove the manual link resolution because 3d-force-graph should do it.
marker = '// 4. Manually resolve links'
idx = content.find(marker)
if idx != -1:
    end_idx = content.find('});', idx) + 3
    content = content[:idx] + content[end_idx:]
    with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Reverted manual link resolution.")
else:
    print("Could not find manual link resolution.")
