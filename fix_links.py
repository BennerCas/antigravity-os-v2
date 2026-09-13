with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Instead of removing the link force, we just keep it but set strength to 0 so it resolves objects but doesn't pull
old = "graph.d3Force('link', null);"
new = "if (graph.d3Force('link')) { graph.d3Force('link').strength(0); }"

if old in content:
    content = content.replace(old, new)
    with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed link force")
else:
    print("Could not find old link force disable")
