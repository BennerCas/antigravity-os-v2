import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_effect = """  // Efecto de expansión
  useEffect(() => {
    if (graphRef.current) {
      // Re-calentar simulación para aplicar las nuevas fuerzas
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);"""

good_effect = """  // Efecto de expansión (CABLEADO)
  useEffect(() => {
    const mainNodes = gData.nodes.filter(n => !n.isSub && n.id !== 'center');
    const radius = isExpanded ? 700 : 300;
    const orbit = isExpanded ? 90 : 45;
    
    // Recalcular posiciones
    mainNodes.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / mainNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      node.fx = radius * Math.cos(theta) * Math.sin(phi);
      node.fy = radius * Math.sin(theta) * Math.sin(phi);
      node.fz = radius * Math.cos(phi);
      
      const subNodes = gData.nodes.filter(n => n.isSub && n.id.split('_')[0] === node.id);
      subNodes.forEach((sub, j) => {
        const subTheta = (j / subNodes.length) * 2 * Math.PI;
        sub.fx = node.fx! + orbit * Math.cos(subTheta);
        sub.fy = node.fy! + orbit * Math.sin(subTheta);
        sub.fz = node.fz! + orbit * Math.cos(subTheta) * 0.5; // slight inclination
      });
    });
    
    const centerNode = gData.nodes.find(n => n.id === 'center');
    if (centerNode) {
      centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0;
    }
    
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);"""

content = content.replace(bad_effect, good_effect)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
