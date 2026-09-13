const fs = require('fs');
let mine = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');
mine = mine.replace(`  // Expanded Mode
  useEffect(() => {
    // temporarily disabled again
  }, [isExpanded]);`, `  const isFirstRender = useRef(true);
  // Expanded Mode
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if(graphRef.current) {
      try {
        const chargeForce = graphRef.current.d3Force('charge') as any;
        if (chargeForce) chargeForce.strength(isExpanded ? -1000 : -400);
        
        const linkForce = graphRef.current.d3Force('link') as any;
        if (linkForce) {
          linkForce.distance((link: any) => {
            const s = typeof link.source === 'object' ? link.source : gData.nodes.find((n: any) => n.id === link.source);
            const t = typeof link.target === 'object' ? link.target : gData.nodes.find((n: any) => n.id === link.target);
            const baseDist = s?.isSub || t?.isSub ? 40 : 120;
            return isExpanded ? baseDist * 2.5 : baseDist;
          });
        }
        
        graphRef.current.d3ReheatSimulation();
      } catch (e) {
        console.error("Error setting charge force:", e);
      }
    }
  }, [isExpanded]);`);
fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', mine);
