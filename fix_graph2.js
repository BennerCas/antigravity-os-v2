const fs = require('fs');

let backup = fs.readFileSync('KnowledgeGraph3D_safe_backup.tsx', 'utf-8');
let mine = fs.readFileSync('KnowledgeGraph3D_mine.tsx', 'utf-8');

// Get overlay from mine
const startMarker = '{/* Graph Toolbar Overlay */}';
const endMarker = '<div ref={containerRef}';

let mineOverlay = mine.substring(mine.indexOf(startMarker), mine.indexOf(endMarker));
// Fix up the onChange events that reference setContextFilter and setActiveTopFilter
mineOverlay = mineOverlay.replace(/setContextFilter/g, 'setContextFilter');

// Replace overlay in backup
let backupOverlayEnd = backup.indexOf('<div ref={containerRef}');
let newBackup = backup.substring(0, backup.indexOf(startMarker)) + mineOverlay + backup.substring(backupOverlayEnd);

// Add missing imports
if (!newBackup.includes('Circle,')) {
   newBackup = newBackup.replace('import { Database,', 'import { Database, Circle, Target,');
}

// Inject state variables
const stateVars = `
  const [isExpanded, setIsExpanded] = useState(false);
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  // Re-use contextFilter from safe_backup if exists, otherwise declare.
  // Wait, safe_backup ALREADY has contextFilter and activeTopFilter!
`;
newBackup = newBackup.replace('const [nodeHistory, setNodeHistory] = useState<GraphSkillNode[]>([]);', 
  'const [nodeHistory, setNodeHistory] = useState<GraphSkillNode[]>([]);\n' + stateVars);

// Inject Hooks
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
          return isExpanded ? baseDist * 2.5 : baseDist;
        });
      }
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);
`;

newBackup = newBackup.replace('    const handleResize = () => {', hooks + '\n    const handleResize = () => {');

// Remove unused Database import warning if necessary. Actually we can just leave it.
// Also fix contextFilter default value:
newBackup = newBackup.replace("const [contextFilter, setContextFilter] = useState('FlowArchitect AI');", "const [contextFilter, setContextFilter] = useState('all');");
newBackup = newBackup.replace("const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');", "const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');");

// Put background inside:
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
newBackup = newBackup.replace(`
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
    }
`, bgCode);


fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', newBackup);
