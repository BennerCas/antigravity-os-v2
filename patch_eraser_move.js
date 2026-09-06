const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const moveReplacement = `
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'pan') return;
    
    if (cursorMode === 'erase') {
      if (e.buttons !== 1) return; // Only erase while dragging (left click held)
      
      const { clientX, clientY } = e;
      const target = document.elementFromPoint(clientX, clientY);
      const wrapper = target?.closest('.drawing-node-wrapper');
      
      if (wrapper) {
        const rfNode = target?.closest('.react-flow__node');
        if (rfNode) {
          const nodeId = rfNode.getAttribute('data-id');
          if (nodeId) {
            setNodes((currentNodes) => {
              if (!currentNodes.find(n => n.id === nodeId)) return currentNodes;
              const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
              // Optimización: Solo guardamos en historial al levantar el clic para no saturarlo,
              // pero actualizamos la vista inmediatamente.
              return updatedNodes;
            });
          }
        }
      }
      return;
    }

    if (!currentDrawNodeId || !activeDrawPoints) return;
`;

content = content.replace(
    /const onPointerMove = \(e: React\.PointerEvent<HTMLDivElement>\) => \{\s*if \(!currentDrawNodeId \|\| cursorMode === 'pan' \|\| cursorMode === 'erase' \|\| !activeDrawPoints\) return;/s,
    moveReplacement
);

// We need to also fix onPointerUp so it saves history if erasing finished
const upReplacement = `
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'erase') {
       saveHistory(nodes, edges); // Save after drag-erasing completes
       return;
    }
    if (currentDrawNodeId && activeDrawPoints) {
`;

content = content.replace(
    /const onPointerUp = \(e: React\.PointerEvent<HTMLDivElement>\) => \{\s*if \(currentDrawNodeId && activeDrawPoints\) \{/s,
    upReplacement
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added continuous erase (drag to erase)");
