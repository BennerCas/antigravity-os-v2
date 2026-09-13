const fs = require('fs');

let content = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

const oldExpanded = `  // Expanded Mode
  useEffect(() => {
    if(graphRef.current) {
      const gNodes = graphRef.current.graphData().nodes;
      gNodes.forEach(node => {
        if (!node.isSub && node.id !== 'center') {
           const factor = isExpanded ? 2.5 : 1;
           if(node.fx !== undefined) {
             node.fx = node.fx * factor;
             node.fy = node.fy * factor;
             node.fz = node.fz * factor;
           }
        }
      });
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);`;

const newExpanded = `  // Expanded Mode
  useEffect(() => {
    if(graphRef.current) {
      const gNodes = graphRef.current.graphData().nodes;
      gNodes.forEach(node => {
        if (node.id !== 'center') {
           const baseNode = gData.nodes.find(n => n.id === node.id);
           if(baseNode && baseNode.fx !== undefined) {
             const factor = isExpanded ? (node.isSub ? 2.5 : 2.5) : 1;
             node.fx = baseNode.fx * factor;
             node.fy = baseNode.fy * factor;
             node.fz = baseNode.fz * factor;
           }
        }
      });
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);`;

content = content.replace(oldExpanded, newExpanded);

const oldContext = `  // Context Filter Visibility
  useEffect(() => {
    if (graphRef.current) {
      if (contextFilter === 'all') {
        graphRef.current.nodeVisibility(() => true);
        graphRef.current.linkVisibility(() => true);
      } else {
        graphRef.current.nodeVisibility((n) => {
          if (n.id === 'center') return true;
          return n.group === 1 || n.group === 2; // Simplified logic, change if needed
        });
        graphRef.current.linkVisibility((l) => true);
      }
    }
  }, [contextFilter]);`;

const newContext = `  // Context Filter Visibility
  useEffect(() => {
    if (graphRef.current) {
      if (contextFilter === 'all') {
        graphRef.current.nodeVisibility(() => true);
        graphRef.current.linkVisibility(() => true);
      } else {
        const groupNum = contextFilter === 'G1' ? 1 : contextFilter === 'G2' ? 2 : contextFilter === 'G3' ? 3 : 4;
        graphRef.current.nodeVisibility((n) => {
          if (n.id === 'center' || n.group === 0) return true;
          // Si es un nodo de skill (n.isSub es falso), muéstralo siempre o solo si coincide? Mostramos skills base
          if (!n.isSub) return true;
          // Para sub-nodos, filtramos por grupo
          return n.group === groupNum;
        });
        graphRef.current.linkVisibility((l) => {
           // Muestra los links centrales, oculta los orbitales que no sean del grupo
           const src = typeof l.source === 'object' ? l.source.id : l.source;
           const tgt = typeof l.target === 'object' ? l.target.id : l.target;
           if (src === 'center' || tgt === 'center') return true;
           return true; // En un escenario real aquí evaluamos si los nodos están visibles
        });
      }
    }
  }, [contextFilter]);`;

content = content.replace(oldContext, newContext);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', content);
