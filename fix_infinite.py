with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_select = '''  const selectNode = (node: GraphSkillNode | null) => {
    if (node === null) {
      selectNode(null);
      setNodeHistory([]);
    } else {
      if (selectedNode && selectedNode.id !== node.id) {
        setNodeHistory(prev => [...prev, selectedNode]);
      }
      selectNode(node);
    }
  };'''

good_select = '''  const selectNode = (node: GraphSkillNode | null) => {
    if (node === null) {
      setSelectedNode(null);
      setNodeHistory([]);
    } else {
      if (selectedNode && selectedNode.id !== node.id) {
        setNodeHistory(prev => [...prev, selectedNode]);
      }
      setSelectedNode(node);
    }
  };'''

content = content.replace(bad_select, good_select)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
