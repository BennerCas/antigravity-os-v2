const fs = require('fs');

let content = fs.readFileSync('KnowledgeGraph3D_merged.tsx', 'utf-8');

// 1. Add states
const statesToAdd = `
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);
`;
content = content.replace(
  "const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');",
  "const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');\n" + statesToAdd
);

// 2. Extract the Fila 2 globalScore logic, which is slightly different in commit
// Actually we can just leave it as it is in the commit, it is: const globalScore = ...

// 3. Find where the return statement starts for the UI
const returnOverlayMatch = `      {/* Graph Toolbar Overlay */}
      <div className="absolute top-0 left-0 right-[340px] p-4 z-10 flex items-start gap-8 pointer-events-none">`;

const newOverlay = `      {/* Graph Toolbar Overlay (Fila 1 a 5) */}
      <div className="absolute top-0 left-0 right-[340px] p-4 z-10 flex flex-col gap-4 pointer-events-none">
          {/* Fila 1 & 2 */}
          <div className="flex items-center gap-6 pointer-events-auto">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="text-gray-400 w-5 h-5" /> FLOW ARCHITECT AI - LAB
              </h1>
              
              {/* Fila 2: Progreso Global */}
              <div 
                onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                className="flex items-center gap-2 text-xs bg-[#161b22] hover:bg-[#1f242c] border border-gray-800 hover:border-gray-700 rounded-full px-3 py-1 cursor-pointer transition"
              >
                  <span className="text-gray-400">Progreso Global:</span>
                  <Target className="text-green-500 w-4 h-4" />
                  <span className="text-green-500 font-bold">{globalScore}%</span>
              </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-[-8px]">Explora, conecta y domina el conocimiento. Todo en un solo lugar.</p>

          {/* Fila 3: Controles de Animación y Expansión */}
          <div className="flex items-center gap-4 pointer-events-auto bg-gray-900/40 p-2 rounded-lg border border-gray-800/50 w-fit backdrop-blur-md">
            <span className="text-xs font-semibold text-gray-300">MODO 3D:</span>
            <button onClick={() => setIsExpanded(!isExpanded)} className={\`px-3 py-1 rounded text-xs font-bold transition-all \${isExpanded ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}\`}>
              {isExpanded ? 'EXPANDIDO' : 'DENSO'}
            </button>
            <div className="w-px h-4 bg-gray-700 mx-2"></div>
            <span className="text-xs font-semibold text-gray-300">ANIMACIÓN:</span>
            <button onClick={() => setRotationOn(!rotationOn)} className={\`px-3 py-1 rounded text-xs font-bold transition-all \${rotationOn ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}\`}>
              {rotationOn ? 'ON' : 'OFF'}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-gray-500">Velocidad:</span>
              <input type="range" min="0.1" max="3" step="0.1" value={rotationSpeed} onChange={(e) => setRotationSpeed(parseFloat(e.target.value))} className="w-20 cursor-pointer accent-cyan-500" />
            </div>
          </div>

          {/* Fila 4: Tabs de Filtro Superiores */}
          <div className="flex items-center gap-6 pointer-events-auto mt-2">
              <div className="flex gap-4 text-xs font-medium pb-1 border-b border-gray-800 w-fit pr-8">
                  {['Habilidades', 'Competencias', 'Relaciones', 'Progreso'].map(tab => (
                    <span 
                      key={tab}
                      onClick={() => { 
                        setActiveTopFilter(tab); 
                        if(tab === 'Progreso') setActiveTab('progreso');
                        else if(tab === 'Competencias') setActiveTab('competencias');
                        else setActiveTab('info');
                      }}
                      className={activeTopFilter === tab ? "green-text-active pb-1 cursor-pointer transition-colors relative after:content-[''] after:absolute after:bottom-[-1px] after:left-0 after:w-full after:h-[2px] after:bg-green-500" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}
                    >
                      {tab}
                    </span>
                  ))}
              </div>
          </div>

          {/* Fila 5: Selector de Contexto */}
          <div className="flex items-center gap-3 pointer-events-auto mt-2 bg-gray-900/60 p-2 rounded-lg border border-gray-800 w-fit">
              <span className="text-xs text-gray-400">CONTEXTO:</span>
              <select 
                value={contextFilter} 
                onChange={(e) => setContextFilter(e.target.value)}
                className="bg-black text-cyan-400 border border-gray-700 rounded px-2 py-1 text-xs outline-none cursor-pointer font-medium"
              >
                  <option value="all" className="bg-[#161b22] text-white">Todos los Contextos</option>
                  <option value="G1" className="bg-[#161b22] text-white">G1 - Agentic Framework</option>
                  <option value="G2" className="bg-[#161b22] text-white">G2 - Data Ontology</option>
              </select>
          </div>
      </div>`;

// Replace from `{/* Graph Toolbar Overlay */}` up to just before `<div ref={containerRef}` 
const overlayRegex = /\{\/\* Graph Toolbar Overlay \*\/\}[\s\S]*?(?=<div ref=\{containerRef\})/m;
if (!overlayRegex.test(content)) {
  console.log("Could not find the original overlay code to replace.");
} else {
  content = content.replace(overlayRegex, newOverlay + "\n      ");
}

// 4. Add useEffects for animation, context, and expansion
const useEffects = `
  // Camera Rotation
  useEffect(() => {
    let frameId;
    let angle = 0;
    const rotateCamera = () => {
      if(rotationOn && graphRef.current) {
        angle += 0.005 * rotationSpeed;
        graphRef.current.cameraPosition({
          x: 800 * Math.cos(angle),
          z: 800 * Math.sin(angle),
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
        graphRef.current.nodeVisibility((n) => {
          if (n.id === 'center') return true;
          return n.group === 1 || n.group === 2; // Simplified logic, change if needed
        });
        graphRef.current.linkVisibility((l) => true);
      }
    }
  }, [contextFilter]);

  // Expanded Mode
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
  }, [isExpanded]);
`;

// Insert useEffects just before the return statement
content = content.replace(/\n\s*return \(\s*<div className="flex-1/, useEffects + '\n  return (\n    <div className="flex-1');

// Make sure we include standard react imports if they were somehow stripped
if(!content.includes("Target")) {
  content = content.replace("Database,", "Database, Target,");
}

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', content);
console.log("Patched component successfully.");
