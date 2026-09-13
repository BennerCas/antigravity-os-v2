const fs = require('fs');

let backup = fs.readFileSync('KnowledgeGraph3D_safe_backup.tsx', 'utf-8');
let mine = fs.readFileSync('KnowledgeGraph3D_mine.tsx', 'utf-8');

// I will extract Fila 1 to 5 from `mine` and put it into `backup`
const startMarker = '{/* Graph Toolbar Overlay */}';
const endMarker = '{/* The 3D Graph Canvas */}';

const mineOverlay = mine.substring(mine.indexOf(startMarker), mine.indexOf(endMarker));

let newBackup = backup.substring(0, backup.indexOf(startMarker)) + mineOverlay + backup.substring(backup.indexOf('{/* Right Sidebar'));

// Wait, the end marker in backup is just `<div ref={containerRef} className="w-full h-full absolute inset-0 z-0"></div>`
let backupOverlayEnd = backup.indexOf('<div ref={containerRef}');
newBackup = backup.substring(0, backup.indexOf(startMarker)) + mineOverlay + backup.substring(backupOverlayEnd);

// Now I need to add the states `isExpanded`, `rotationOn`, `rotationSpeed`, `contextFilter`
newBackup = newBackup.replace('const [hoverNode, setHoverNode] = useState<GraphSkillNode | null>(null);',
`const [hoverNode, setHoverNode] = useState<GraphSkillNode | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  const [contextFilter, setContextFilter] = useState('all');`);

// And the `useEffect` hooks for Rotation, Context, and Expanded Mode
const hooks = `
  // Camera Rotation
  useEffect(() => {
    let frameId: number;
    let angle = 0;
    const rotateCamera = () => {
      if(rotationOn && graphRef.current) {
        angle += 0.005 * rotationSpeed;
        graphRef.current.cameraPosition({
          x: 400 * Math.sin(angle),
          z: 400 * Math.cos(angle),
          y: 300
        });
      }
      frameId = requestAnimationFrame(rotateCamera);
    };
    rotateCamera();
    return () => cancelAnimationFrame(frameId);
  }, [rotationOn, rotationSpeed]);

  // Context Filter Visibility
  useEffect(() => {
    if (graphRef.current) {
      if (contextFilter === 'all') {
        graphRef.current.nodeVisibility(() => true);
        graphRef.current.linkVisibility(() => true);
      } else {
        graphRef.current.nodeVisibility((n: any) => n.group === (contextFilter === 'G1' ? 1 : (contextFilter === 'G2' ? 2 : 0)) || n.id === 'center');
        graphRef.current.linkVisibility((l: any) => {
           const s = typeof l.source === 'object' ? l.source : { group: 0 };
           const t = typeof l.target === 'object' ? l.target : { group: 0 };
           const targetGroup = contextFilter === 'G1' ? 1 : (contextFilter === 'G2' ? 2 : 0);
           return s.group === targetGroup || t.group === targetGroup || s.id === 'center' || t.id === 'center';
        });
      }
    }
  }, [contextFilter]);

  // Expanded Mode (Proper implementation)
  useEffect(() => {
    if(graphRef.current) {
      const d3ChargeForce = graphRef.current.d3Force("charge");
      if (d3ChargeForce && typeof d3ChargeForce.strength === 'function') {
        d3ChargeForce.strength(isExpanded ? -800 : -400);
      }
      const d3LinkForce = graphRef.current.d3Force("link");
      if (d3LinkForce && typeof d3LinkForce.distance === 'function') {
        d3LinkForce.distance((link) => {
          const s = typeof link.source === 'object' ? link.source : gData.nodes.find(n => n.id === link.source);
          const t = typeof link.target === 'object' ? link.target : gData.nodes.find(n => n.id === link.target);
          const baseDist = s?.isSub || t?.isSub ? 40 : 120;
          return isExpanded ? baseDist * 2 : baseDist;
        });
      }
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);
`;

newBackup = newBackup.replace('// Update resize logic', hooks + '\n  // Update resize logic');

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', newBackup);
