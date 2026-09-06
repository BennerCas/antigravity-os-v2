const fs = require('fs');

// 1. Fix BuilderNodes.tsx
let nodes = fs.readFileSync('src/components/BuilderNodes.tsx', 'utf-8');

// Fix PostIt contrasting colors
const postItRegex = /<div className="p-4 rounded-sm shadow-md w-64 border relative transform rotate-1" style=\{\{ backgroundColor: color, borderColor: 'rgba\\(0,0,0,0\.1\\)', color: '#000000' \}\}>/;

// function to calculate contrast color in JS but we can inject a quick luminance check
const postItColorLogic = `  const hexToRgb = (hex: string) => {
    let r = parseInt(hex.slice(1, 3), 16) || 255;
    let g = parseInt(hex.slice(3, 5), 16) || 255;
    let b = parseInt(hex.slice(5, 7), 16) || 255;
    return { r, g, b };
  };
  const getContrast = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };
  const textColor = getContrast(color);
  
  return (
    <div className="p-4 rounded-sm shadow-md w-64 border relative transform rotate-1 transition-colors" style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.2)', color: textColor }側に
`;
nodes = nodes.replace(postItRegex, postItColorLogic.replace('}側に', '} >'));

// Fix Ruler rotation
const rulerRegex = /export const RulerNode = \(\) => \{\s+const \[rotation, setRotation\] = useState\(0\);\s+const \[isDragging, setIsDragging\] = useState\(false\);/;
const rulerReplacement = `export const RulerNode = () => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = React.useRef<HTMLDivElement>(null);`;
nodes = nodes.replace(rulerRegex, rulerReplacement);

// Fix rotation math
const rotationRegex = /const onPointerMove = \(e: PointerEvent\) => \{\s+setRotation\(prev => \(prev \+ e\.movementY\) % 360\);\s+\};/;
const rotationReplacement = `const onPointerMove = (e: PointerEvent) => {
      if (!nodeRef.current) return;
      const rect = nodeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      setRotation(angle);
    };`;
nodes = nodes.replace(rotationRegex, rotationReplacement);

// Add ref to ruler div
nodes = nodes.replace(/<div \s*className="relative flex items-center justify-center border border-transparent\/50 shadow-lg backdrop-blur-md"/, 
  `<div ref={nodeRef} className="relative flex items-center justify-center border border-transparent/50 shadow-lg backdrop-blur-md"`
);

// Add 10 more node styles
// We'll add them to the dropdown in Builder.tsx

fs.writeFileSync('src/components/BuilderNodes.tsx', nodes);

// 2. Fix Builder.tsx
let builder = fs.readFileSync('src/pages/Builder.tsx', 'utf-8');

// Fix drawing performance
// Add necessary imports to Builder.tsx if not there
if (!builder.includes("getStroke")) {
  builder = builder.replace(/import \{ v4 as uuidv4 \} from 'uuid';/, 
    "import { v4 as uuidv4 } from 'uuid';\nimport { getStroke } from 'perfect-freehand';\nimport { getSvgPathFromStroke } from '../utils/drawUtils';"
  );
}

// Add state for active drawing
if (!builder.includes('const [activeDrawPoints, setActiveDrawPoints]')) {
  builder = builder.replace(/const \[currentDrawNodeId, setCurrentDrawNodeId\] = useState<string \| null>\(null\);/, 
    `const [currentDrawNodeId, setCurrentDrawNodeId] = useState<string | null>(null);
  const [activeDrawPoints, setActiveDrawPoints] = useState<number[][] | null>(null);
  const activeDrawStartPos = useRef({ x: 0, y: 0 });`
  );
}

// Replace onPointerDown
const ptrDownRegex = /const onPointerDown = \(e: React\.PointerEvent<HTMLDivElement>\) => \{[\s\S]*?setNodes\(\(nds\) => \[\.\.\.nds, newNode\]\);\s+\};/;
const ptrDownReplacement = `const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'pan' || cursorMode === 'erase') return;
    
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const { clientX, clientY } = e;
    const pos = screenToFlowPosition({ x: clientX, y: clientY });
    
    activeDrawStartPos.current = { x: pos.x, y: pos.y };
    setActiveDrawPoints([[0, 0]]);
    setCurrentDrawNodeId(uuidv4());
  };`;
builder = builder.replace(ptrDownRegex, ptrDownReplacement);

// Replace onPointerMove
const ptrMoveRegex = /const onPointerMove = \(e: React\.PointerEvent<HTMLDivElement>\) => \{[\s\S]*?\}\)\);\s+\};/;
const ptrMoveReplacement = `const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentDrawNodeId || cursorMode === 'pan' || cursorMode === 'erase' || !activeDrawPoints) return;

    e.stopPropagation();
    const { clientX, clientY } = e;
    const pos = screenToFlowPosition({ x: clientX, y: clientY });
    
    const relativeX = pos.x - activeDrawStartPos.current.x;
    const relativeY = pos.y - activeDrawStartPos.current.y;
    
    setActiveDrawPoints([...activeDrawPoints, [relativeX, relativeY]]);
  };`;
builder = builder.replace(ptrMoveRegex, ptrMoveReplacement);

// Replace onPointerUp
const ptrUpRegex = /const onPointerUp = \(e: React\.PointerEvent<HTMLDivElement>\) => \{[\s\S]*?saveHistory\(nds, edges\);[\s\S]*?\}\);[\s\S]*?\}\s+\};/;
const ptrUpReplacement = `const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (currentDrawNodeId && activeDrawPoints) {
      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      const newNode: Node = {
        id: currentDrawNodeId,
        type: 'drawingNode',
        position: { x: activeDrawStartPos.current.x, y: activeDrawStartPos.current.y },
        data: {
          points: activeDrawPoints,
          color: strokeColor,
          size: strokeWidth,
          type: cursorMode === 'line' ? 'line' : 'free'
        },
        draggable: false,
        selectable: false
      };

      setCurrentDrawNodeId(null);
      setActiveDrawPoints(null);
      
      setNodes((nds) => {
        const next = [...nds, newNode];
        saveHistory(next, edges);
        return next;
      });
    }
  };`;
builder = builder.replace(ptrUpRegex, ptrUpReplacement);

// Add Active Drawing Overlay inside ReactFlow
// It must be placed after <Background> and before <Controls> or anywhere inside ReactFlow
const activeOverlay = `
            {activeDrawPoints && currentDrawNodeId && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', transform: \`translate(\${activeDrawStartPos.current.x}px, \${activeDrawStartPos.current.y}px)\` }}>
                  {cursorMode === 'line' ? (
                    <line x1={activeDrawPoints[0][0]} y1={activeDrawPoints[0][1]} x2={activeDrawPoints[activeDrawPoints.length - 1][0]} y2={activeDrawPoints[activeDrawPoints.length - 1][1]} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                  ) : (
                    <path d={getSvgPathFromStroke(getStroke(activeDrawPoints, { size: strokeWidth, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }))} fill={strokeColor} />
                  )}
                </svg>
              </div>
            )}
`;
if (!builder.includes('activeDrawPoints && currentDrawNodeId')) {
  builder = builder.replace(/\{showControls && <Controls \/>\}/, activeOverlay + '\n            {showControls && <Controls />}');
}

// 10 extra node styles
const extraStylesOptions = `
          <option value="default">Default</option>
          <option value="neon">Neón Destello</option>
          <option value="brutalist">Brutalista</option>
          <option value="glass">Cristal 3D</option>
          <option value="wireframe">Wireframe</option>
          <option value="hologram">Holograma</option>
          <option value="soft">Suave Redondo</option>
          <option value="sharp">Afilado 0px</option>
          <option value="terminal">Terminal CLI</option>
          <option value="retro">Retro 8-bit</option>
          
          <option value="ghost">Fantasma (Opaco)</option>
          <option value="comic">Cómic (Comic Sans + Sombras)</option>
          <option value="cutout">Recorte (Bordes Invertidos)</option>
          <option value="cyber">Cyberpunk (Líneas diagonales)</option>
          <option value="floating">Flotante (Gravedad Cero)</option>
          <option value="metal">Metal (Gradiente Plateado)</option>
          <option value="blueprint">Plano (Azul Arquitecto)</option>
          <option value="glowing-edges">Bordes Resplandecientes</option>
          <option value="lcd">LCD (Matrix Display)</option>
          <option value="liquid">Líquido (Bordes Ondulados)</option>
`;
builder = builder.replace(/<option value="default">Default<\/option>[\s\S]*?<option value="retro">Retro 8-bit<\/option>/, extraStylesOptions);

const extraStylesCss = `.theme-node-style-ghost .react-flow__node > div { background: transparent !important; border: 1px solid var(--theme-border) !important; opacity: 0.6; backdrop-filter: blur(4px); }
          .theme-node-style-comic .react-flow__node > div { border: 3px solid #000 !important; border-radius: 20px !important; box-shadow: 6px 6px 0 var(--theme-border) !important; font-family: 'Comic Sans MS', cursive, sans-serif !important; background: var(--theme-card) !important; color: var(--theme-text) !important; }
          .theme-node-style-cutout .react-flow__node > div { border: 2px solid var(--theme-border) !important; border-radius: 24px 0 24px 0 !important; }
          .theme-node-style-cyber .react-flow__node > div { background: repeating-linear-gradient(45deg, var(--theme-card), var(--theme-card) 10px, transparent 10px, transparent 20px) !important; border: 2px solid var(--theme-border) !important; border-radius: 0 !important; }
          .theme-node-style-floating .react-flow__node > div { border-radius: 12px; border: none !important; box-shadow: 0 20px 40px -10px var(--theme-border) !important; transform: translateY(-5px); transition: transform 0.3s; }
          .theme-node-style-metal .react-flow__node > div { background: linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 50%, #424242 100%) !important; border: 1px solid #fff !important; color: #000 !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
          .theme-node-style-blueprint .react-flow__node > div { background: #0044aa !important; border: 2px solid #fff !important; color: #fff !important; font-family: monospace; }
          .theme-node-style-glowing-edges .react-flow__node > div { border: 2px solid var(--theme-border) !important; box-shadow: 0 0 20px var(--theme-border), inset 0 0 20px var(--theme-border) !important; background: transparent !important; }
          .theme-node-style-lcd .react-flow__node > div { background: #9ea786 !important; border: 4px solid #4a523a !important; color: #000 !important; font-family: 'Courier New', monospace; box-shadow: inset 4px 4px 0 rgba(0,0,0,0.1); }
          .theme-node-style-liquid .react-flow__node > div { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50% !important; border: 3px solid var(--theme-border) !important; }
`;
builder = builder.replace(/.theme-node-style-retro \.react-flow__node > div \{ [\s\S]*? \}/, `$&
          ${extraStylesCss}`);

// Ensure local persistence (themes, node styles, bg pattern)
// ReactFlow nodes/edges are saved to localStorage via saveHistory.
// We should save the settings on every change using useEffect.
if (!builder.includes('useEffect(() => { localStorage.setItem("builderTheme"')) {
  const settingsEffect = `
  useEffect(() => {
    localStorage.setItem("builderTheme", theme);
    localStorage.setItem("builderBgPattern", bgPattern);
    localStorage.setItem("builderNodeStyle", nodeStyle);
  }, [theme, bgPattern, nodeStyle]);
`;
  // Insert before return
  builder = builder.replace(/  return \(\s*<div className=\{`fixed/, `${settingsEffect}\n  return (\n    <div className={\`fixed`);
  
  // And load on init
  builder = builder.replace(/const \[theme, setTheme\] = useState<string>\("Cyberpunk"\);/, `const [theme, setTheme] = useState<string>(() => localStorage.getItem("builderTheme") || "Cyberpunk");`);
  builder = builder.replace(/const \[bgPattern, setBgPattern\] = useState\("dots"\);/, `const [bgPattern, setBgPattern] = useState(() => localStorage.getItem("builderBgPattern") || "dots");`);
  builder = builder.replace(/const \[nodeStyle, setNodeStyle\] = useState\("default"\);/, `const [nodeStyle, setNodeStyle] = useState(() => localStorage.getItem("builderNodeStyle") || "default");`);
}

fs.writeFileSync('src/pages/Builder.tsx', builder);

// Finally, create src/utils/drawUtils.ts for getSvgPathFromStroke
const drawUtils = `
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q']
  );
  d.push('Z');
  return d.join(' ');
}
`;
if (!fs.existsSync('src/utils')) fs.mkdirSync('src/utils');
fs.writeFileSync('src/utils/drawUtils.ts', drawUtils);

