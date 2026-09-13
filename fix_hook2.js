const fs = require('fs');

let mine = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

mine = mine.replace(`  // Expanded Mode
  useEffect(() => {
    // temporarily disabled
  }, [isExpanded]);`, `  // Expanded Mode
  useEffect(() => {
    if(graphRef.current) {
      try {
        const chargeForce = graphRef.current.d3Force('charge');
        if (chargeForce) chargeForce.strength(isExpanded ? -1000 : -400);
        graphRef.current.d3ReheatSimulation();
      } catch (e) {
        console.error("Error setting charge force:", e);
      }
    }
  }, [isExpanded]);`);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', mine);
