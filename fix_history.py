import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State definition
state_orig = "  const [selectedNode, setSelectedNode] = useState<GraphSkillNode | null>(null);"
state_new = '''  const [selectedNode, setSelectedNode] = useState<GraphSkillNode | null>(() => gData.nodes.find(n => n.id === 'center') || null);
  const [nodeHistory, setNodeHistory] = useState<GraphSkillNode[]>([]);

  const selectNode = (node: GraphSkillNode | null) => {
    if (node === null) {
      setSelectedNode(null);
      setNodeHistory([]);
    } else {
      if (selectedNode && selectedNode.id !== node.id) {
        setNodeHistory(prev => [...prev, selectedNode]);
      }
      setSelectedNode(node);
    }
  };

  const handleBack = () => {
    if (nodeHistory.length > 0) {
      const newHistory = [...nodeHistory];
      const prevNode = newHistory.pop();
      setSelectedNode(prevNode || null);
      setNodeHistory(newHistory);
      
      if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number' && typeof prevNode.z === 'number') {
        const hyp = Math.hypot(prevNode.x, prevNode.y, prevNode.z);
        const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
        // The cameraPosition is only safe if graphRef.current exists, handled inside the call if needed, but we can just use the global graph if available or wait till we need it. 
        // Actually since handleBack is called from UI, graphRef.current should exist.
      }
    } else {
      setSelectedNode(null);
    }
  };'''

content = content.replace(state_orig, state_new)

# 2. Replaces of setSelectedNode(node) -> selectNode(node)
# Exclude lines that are part of the state declaration (already handled)
content = content.replace('setSelectedNode(found);', 'selectNode(found);')
content = content.replace('setSelectedNode(node);', 'selectNode(node);')
content = content.replace('setSelectedNode(null);', 'selectNode(null);')
content = content.replace('setSelectedNode(sub);', 'selectNode(sub);')
content = content.replace('setSelectedNode(otherNode);', 'selectNode(otherNode);')
content = content.replace('setSelectedNode(skill);', 'selectNode(skill);')

# Fix handleBack inside the "Atrás" button
atras_target = '''                        <button 
                          onClick={() => selectNode(null)}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>'''
atras_replacement = '''                        <button 
                          onClick={() => handleBack()}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>'''
content = content.replace(atras_target, atras_replacement)

# Also fix the camera logic in handleBack
camera_logic_orig = '''      if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number' && typeof prevNode.z === 'number') {
        const hyp = Math.hypot(prevNode.x, prevNode.y, prevNode.z);
        const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
        // The cameraPosition is only safe if graphRef.current exists, handled inside the call if needed, but we can just use the global graph if available or wait till we need it. 
        // Actually since handleBack is called from UI, graphRef.current should exist.
      }'''
camera_logic_new = '''      if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number' && typeof prevNode.z === 'number') {
        if (graphRef.current) {
          const hyp = Math.hypot(prevNode.x, prevNode.y, prevNode.z);
          const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
          graphRef.current.cameraPosition(
            { x: prevNode.x * distRatio, y: prevNode.y * distRatio, z: prevNode.z * distRatio },
            prevNode as unknown as { x: number; y: number; z: number },
            2000
          );
        }
      }'''
content = content.replace(camera_logic_orig, camera_logic_new)


# 3. Replace the title in "Próxima recomendación"
proxima_target = '''                                <h5 className="text-sm font-bold text-white">
                                  {selectedNode.name ? Laboratorio de  : 'Laboratorio guiado'}
                                </h5>'''
proxima_new = '''                                <h5 className="text-sm font-bold text-white">
                                  FLOW ARCHITECT AI - LAB
                                </h5>'''
content = content.replace(proxima_target, proxima_new)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
