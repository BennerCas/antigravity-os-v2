const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'pan') return;
    
    if (cursorMode === 'erase') {
      const { clientX, clientY } = e;
      const target = document.elementFromPoint(clientX, clientY);
      const wrapper = target?.closest('.drawing-node-wrapper');
      
      if (wrapper) {
        // Encontramos un trazo bajo el puntero
        // El id del nodo de ReactFlow se puede obtener del ancestro .react-flow__node
        const rfNode = target?.closest('.react-flow__node');
        if (rfNode) {
          const nodeId = rfNode.getAttribute('data-id');
          if (nodeId) {
            const updatedNodes = nodes.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            saveHistory(updatedNodes, edges);
          }
        }
      }
      return;
    }
    
    e.stopPropagation();
`;

content = content.replace(
    /const onPointerDown = \(e: React\.PointerEvent<HTMLDivElement>\) => \{\s*if \(cursorMode === 'pan' \|\| cursorMode === 'erase'\) return;\s*e\.stopPropagation\(\);/s,
    replacement
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added direct erase collision detection");
