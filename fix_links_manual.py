with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Right after initialGraphData is defined and before it is used
# initialGraphData.links.forEach(l => {
#   if (typeof l.source === 'string') l.source = initialGraphData.nodes.find(n => n.id === l.source) as any;
#   if (typeof l.target === 'string') l.target = initialGraphData.nodes.find(n => n.id === l.target) as any;
# });

marker = 'const subsByParent: Record<string, GraphSkillNode[]> = {};'
if marker in content:
    idx = content.find(marker)
    # let's put it right before subsByParent
    insert = '''
    // 4. Manually resolve links so 3d-force-graph can draw them even without active forces
    initialGraphData.links.forEach(l => {
      if (typeof l.source === 'string') l.source = initialGraphData.nodes.find(n => n.id === l.source) as any;
      if (typeof l.target === 'string') l.target = initialGraphData.nodes.find(n => n.id === l.target) as any;
    });
    
    '''
    content = content[:idx] + insert + content[idx:]
    with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Links manually resolved.")
else:
    print("Could not find insertion marker")
