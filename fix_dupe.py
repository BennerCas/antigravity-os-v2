with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the real end of the component
end_idx = content.find('    </div>\n  );\n}')
if end_idx != -1:
    content = content[:end_idx + 18]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
