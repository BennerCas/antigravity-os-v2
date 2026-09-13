const fs = require('fs');

let mine = fs.readFileSync('KnowledgeGraph3D_mine.tsx', 'utf-8');

// The original buggy useEffect for isExpanded in mine:
/*
  // Expanded Mode
  useEffect(() => {
    if(graphRef.current) {
      const gNodes = graphRef.current.graphData().nodes;
      gNodes.forEach(node => {
        if (node.id !== 'center') {
           const baseNode = gData.nodes.find(n => n.id === node.id);
           if(baseNode && typeof baseNode.fx === 'number' && typeof baseNode.fy === 'number' && typeof baseNode.fz === 'number') {
             const factor = isExpanded ? (node.isSub ? 2.5 : 2.5) : 1;
             node.fx = baseNode.fx * factor;
             node.fy = baseNode.fy * factor;
             node.fz = baseNode.fz * factor;
           }
        }
      });
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);
*/
// The new proper one for isExpanded:
const properIsExpanded = `  // Expanded Mode
  useEffect(() => {
    if(graphRef.current) {
      const d3ChargeForce = graphRef.current.d3Force("charge") as any;
      if (d3ChargeForce && typeof d3ChargeForce.strength === 'function') {
        d3ChargeForce.strength(isExpanded ? -800 : -400);
      }
      const d3LinkForce = graphRef.current.d3Force("link") as any;
      if (d3LinkForce && typeof d3LinkForce.distance === 'function') {
        d3LinkForce.distance((link: any) => {
          const s = typeof link.source === 'object' ? link.source : gData.nodes.find((n: any) => n.id === link.source);
          const t = typeof link.target === 'object' ? link.target : gData.nodes.find((n: any) => n.id === link.target);
          const baseDist = s?.isSub || t?.isSub ? 40 : 120;
          return isExpanded ? baseDist * 2.5 : baseDist;
        });
      }
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);`;

// Regex replace the Expanded Mode hook
mine = mine.replace(/  \/\/ Expanded Mode\n  useEffect\(\(\) => \{[\s\S]*?\}, \[isExpanded\]\);/g, properIsExpanded);

// Background
const bgCode = `
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
      // Load and apply background texture
      new THREE.TextureLoader().load('/images/bg_space.jpg', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      });
    }
`;
mine = mine.replace(`
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
    }
`, bgCode);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', mine);
