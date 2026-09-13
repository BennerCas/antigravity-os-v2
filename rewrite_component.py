import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find where the component starts
idx = content.find('export function KnowledgeGraph3D')

header = content[:idx]

new_component = """export function KnowledgeGraph3D(props: KnowledgeGraph3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraph3DInstance<GraphSkillNode, GraphSkillLink> | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphSkillNode | null>(() => gData.nodes.find(n => n.id === 'center') || null);
  const [nodeHistory, setNodeHistory] = useState<GraphSkillNode[]>([]);

  // Fila 2, 3, 4, 5 Estados
  const [globalScore, setGlobalScore] = useState(12);
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');
  const [contextFilter, setContextFilter] = useState('all');
  
  // Right sidebar tab state
  const [activeTab, setActiveTab] = useState<'info' | 'competencias' | 'sistema' | 'progreso'>('info');

  const selectNode = (node: GraphSkillNode | null) => {
    if (node === null) {
      setSelectedNode(null);
      setNodeHistory([]);
    } else {
      if (selectedNode && selectedNode.id !== node.id) {
        setNodeHistory(prev => [...prev, selectedNode]);
      }
      setSelectedNode(node);
    }
  };

  const handleBack = () => {
    if (nodeHistory.length > 0) {
      const newHistory = [...nodeHistory];
      const prevNode = newHistory.pop();
      setSelectedNode(prevNode || null);
      setNodeHistory(newHistory);
    }
  };

  // CABLEADO FILA 2: Actualización de progreso global
  useEffect(() => {
    const subNodes = gData.nodes.filter(n => n.isSub);
    const totalMissions = subNodes.length;
    const completed = 23; 
    const calculatedProgress = totalMissions > 0 ? Math.round((completed / totalMissions) * 100) : 12;
    setGlobalScore(calculatedProgress);
  }, []);

  useEffect(() => {
    if (props.selectedSkillId) {
      const node = gData.nodes.find(n => n.id === props.selectedSkillId);
      if (node) {
        selectNode(node);
      }
    }
  }, [props.selectedSkillId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initialGraphData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = JSON.parse(JSON.stringify(gData));

    // Calculate initial fibonacci coordinates for main nodes
    const mainNodes = initialGraphData.nodes.filter(n => !n.isSub && n.id !== 'center');
    const radius = 300;
    const orbit = 45;
    mainNodes.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / mainNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      node.fx = radius * Math.cos(theta) * Math.sin(phi);
      node.fy = radius * Math.sin(theta) * Math.sin(phi);
      node.fz = radius * Math.cos(phi);

      const subNodes = initialGraphData.nodes.filter(n => n.isSub && n.id.split('_')[0] === node.id);
      subNodes.forEach((sub, j) => {
        const subTheta = (j / subNodes.length) * 2 * Math.PI;
        sub.fx = (node.fx as number) + orbit * Math.cos(subTheta);
        sub.fy = (node.fy as number) + orbit * Math.sin(subTheta);
        sub.fz = (node.fz as number) + orbit * Math.cos(subTheta) * 0.5;
      });
    });

    const centerNode = initialGraphData.nodes.find(n => n.id === 'center');
    if (centerNode) {
      centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0;
    }

    const renderCustomNode = (node: any) => {
      let iconStr = node.icon || '??';
      
      const groupColors: Record<number, string> = {
        0: '#ffffff', 1: '#00f5d4', 2: '#00bbf9', 3: '#fee440', 4: '#f15bb5', 5: '#9b5de5'
      };
      
      const groupIcons: Record<number, string> = {
        0: '⚛️', 1: '💡', 2: '🛠️', 3: '⚙️', 4: '📐', 5: '👑'
      };

      if (!node.icon || node.icon === '?') {
        iconStr = groupIcons[node.group || 1] || '??';
      }

      if (node.isSub) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        ctx.font = '24px Sans-Serif';
        const textWidth = ctx.measureText(node.name).width;
        canvas.width = Math.max(300, textWidth + 80);
        canvas.height = 80;
        ctx.font = '24px Sans-Serif'; // reset after resize
        ctx.fillStyle = 'rgba(10, 10, 15, 0.85)';
        ctx.roundRect(10, 10, canvas.width - 20, 60, 30);
        ctx.fill();
        ctx.strokeStyle = node.color || groupColors[node.group || 1] || '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name, canvas.width / 2, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(canvas.width / 10, 8, 1);
        sprite.renderOrder = 999;
        return sprite;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d')!;
      ctx.beginPath();
      ctx.arc(80, 80, 70, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(20,20,30,0.85)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = node.color || groupColors[node.group || 1] || '#ffffff';
      ctx.stroke();
      if (node.id === 'center') {
        ctx.shadowColor = node.color || '#ffffff';
        ctx.shadowBlur = 20;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.font = '60px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconStr, 80, 80);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(16, 16, 1);
      
      const label = new SpriteText(node.name);
      label.color = '#ffffff';
      label.textHeight = 4;
      label.position.y = -12;
      sprite.add(label);
      
      return sprite;
    };

    const getSourceNode = (source: string | GraphSkillNode): GraphSkillNode | undefined => {
      if (typeof source === 'object' && source !== null) return source as GraphSkillNode;
      return initialGraphData.nodes.find((n) => n.id === source);
    };

    const getTargetNode = (target: string | GraphSkillNode): GraphSkillNode | undefined => {
      if (typeof target === 'object' && target !== null) return target as GraphSkillNode;
      return initialGraphData.nodes.find((n) => n.id === target);
    };

    const createForceGraph = ForceGraph3D as unknown as () => (
      element: HTMLElement
    ) => ForceGraph3DInstance<GraphSkillNode, GraphSkillLink>;

    const graph = createForceGraph()(containerRef.current)
      .graphData(initialGraphData)
      .backgroundColor("#050814")
      .showNavInfo(false)
      .nodeThreeObject(renderCustomNode as (node: GraphSkillNode) => THREE.Object3D)
      .linkWidth((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0.5 : 2;
      })
      .linkColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? `${sourceNode.color}66` : "rgba(255,255,255,0.2)"; 
      })
      .linkDirectionalParticles((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0 : 3;
      })
      .linkDirectionalParticleWidth(1.5)
      .linkDirectionalParticleSpeed(0.005)
      .d3Force("link", null) // deshabilitamos link force de d3 por completo ya que seteamos fx/fy/fz
      .d3Force("charge", null) 
      .d3Force("center", null);

    // Apply Background Image
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/images/bg_space.jpg', (texture) => {
      graph.scene().background = texture;
    });

    // Link labels (CABLEADO)
    graph.linkThreeObjectExtend(true);
    graph.linkThreeObject((link: any) => {
      if (link.name && link.name !== 'core_competency' && link.name !== 'evaluates_with') {
        const sprite = new SpriteText(link.name);
        sprite.color = 'rgba(255,255,255,0.7)';
        sprite.textHeight = 3;
        return sprite;
      }
      return new THREE.Object3D();
    });
    graph.linkPositionUpdate((sprite: any, { start, end }) => {
      if (sprite && sprite.position) {
        Object.assign(sprite.position, {
          x: start.x + (end.x - start.x) / 2,
          y: start.y + (end.y - start.y) / 2,
          z: start.z + (end.z - start.z) / 2
        });
      }
    });

    graph.onNodeClick((node: any) => {
      selectNode(node);
    });

    graphRef.current = graph;

    const handleResize = () => {
      if(containerRef.current) {
        graph.width(containerRef.current.clientWidth);
        graph.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    
    // Initial camera position
    setTimeout(() => {
      graph.cameraPosition({ x: 0, y: 0, z: 800 }, { x: 0, y: 0, z: 0 }, 2000);
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      if(graphRef.current) {
        graphRef.current._destructor();
      }
    };
  }, []);

  // Fila 3: Efecto de Rotación (CABLEADO)
  useEffect(() => {
    let animId: number;
    let angle = 0;
    const rotate = () => {
      if (rotationOn && graphRef.current) {
        const camPos = graphRef.current.cameraPosition();
        if (camPos) {
          const radius = Math.hypot(camPos.x, camPos.z);
          const newAngle = Math.atan2(camPos.z, camPos.x) + (0.001 * rotationSpeed);
          graphRef.current.cameraPosition({
            x: radius * Math.cos(newAngle),
            z: radius * Math.sin(newAngle),
            y: camPos.y
          });
        }
      }
      animId = requestAnimationFrame(rotate);
    };
    rotate();
    return () => cancelAnimationFrame(animId);
  }, [rotationOn, rotationSpeed]);

  // Fila 3: Efecto de expansión (CABLEADO)
  useEffect(() => {
    if (!graphRef.current) return;
    const graphData = graphRef.current.graphData();
    const radius = isExpanded ? 700 : 300;
    const orbit = isExpanded ? 90 : 45;
    
    const mainNodes = graphData.nodes.filter(n => !n.isSub && n.id !== 'center');
    mainNodes.forEach((node, i) => {
      const phi = Math.acos(1 - 2 * (i + 0.5) / mainNodes.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      node.fx = radius * Math.cos(theta) * Math.sin(phi);
      node.fy = radius * Math.sin(theta) * Math.sin(phi);
      node.fz = radius * Math.cos(phi);
      
      const subNodes = graphData.nodes.filter(n => n.isSub && n.id.split('_')[0] === node.id);
      subNodes.forEach((sub, j) => {
        const subTheta = (j / subNodes.length) * 2 * Math.PI;
        sub.fx = (node.fx as number) + orbit * Math.cos(subTheta);
        sub.fy = (node.fy as number) + orbit * Math.sin(subTheta);
        sub.fz = (node.fz as number) + orbit * Math.cos(subTheta) * 0.5;
      });
    });
    
    const centerNode = graphData.nodes.find(n => n.id === 'center');
    if (centerNode) {
      centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0;
    }
    
    graphRef.current.d3ReheatSimulation();
  }, [isExpanded]);

  // Fila 5: Efecto Context Filter (CABLEADO)
  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.nodeVisibility((node: any) => {
      let g = node.group;
      if (node.isSub) {
        const parentId = node.id.split('_')[0];
        const parent = gData.nodes.find(n => n.id === parentId);
        if (parent) g = parent.group;
      }
      if (contextFilter === 'all') return true;
      if (contextFilter === 'g1') return g === 1;
      if (contextFilter === 'g2') return g === 2;
      if (contextFilter === 'g3') return g === 3;
      if (contextFilter === 'g4') return g === 4;
      if (contextFilter === 'g5') return g === 5;
      return true;
    });
    graphRef.current.linkVisibility((link: any) => {
      const sId = typeof link.source === 'object' ? link.source.id : link.source;
      const tId = typeof link.target === 'object' ? link.target.id : link.target;
      const sNode = gData.nodes.find(n => n.id === sId);
      const tNode = gData.nodes.find(n => n.id === tId);
      if (!sNode || !tNode) return false;
      let sg = sNode.group;
      let tg = tNode.group;
      if (sNode.isSub) { const p = gData.nodes.find(n => n.id === sId.split('_')[0]); if (p) sg = p.group; }
      if (tNode.isSub) { const p = gData.nodes.find(n => n.id === tId.split('_')[0]); if (p) tg = p.group; }
      if (contextFilter === 'all') return true;
      if (contextFilter === 'g1') return (sg === 1 && tg === 1);
      if (contextFilter === 'g2') return (sg === 2 && tg === 2);
      if (contextFilter === 'g3') return (sg === 3 && tg === 3);
      if (contextFilter === 'g4') return (sg === 4 && tg === 4);
      if (contextFilter === 'g5') return (sg === 5 && tg === 5);
      return true;
    });
  }, [contextFilter]);

  return (
    <div className="flex-1 relative flex flex-col bg-black overflow-hidden h-[calc(100vh-80px)] min-h-[700px]">
      
      {/* Graph Toolbar Overlay */}
      <div className="absolute top-0 left-0 right-[340px] p-6 z-10 flex flex-col gap-4 pointer-events-none">
          <div className="pointer-events-auto shrink-0 flex flex-col gap-4">
              
              {/* Fila 1: Título y Subtítulo */}
              <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                      <Database className="text-cyan-400 w-5 h-5" /> FLOW ARCHITECT AI - LAB
                  </h1>
                  <p className="text-xs text-gray-400">Explora, conecta y domina el conocimiento. Todo en un solo lugar.</p>
              </div>

              <div className="flex gap-4 items-center">
                  {/* Fila 2: Progreso Global */}
                  <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
                    <Target className="text-green-400 w-4 h-4" />
                    <span className="text-xs font-semibold text-gray-200">Progreso Global:</span>
                    <span className="text-sm font-bold text-green-400">{globalScore}%</span>
                  </div>

                  {/* Fila 3: Controles de Animación y Modo */}
                  <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-700/50 rounded-full px-4 py-2 backdrop-blur-sm">
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
                      <button 
                        onClick={() => setRotationOn(!rotationOn)}
                        className={`p-1.5 rounded-full transition-colors ${rotationOn ? 'bg-cyan-900/40 text-cyan-400' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                        title="Rotación automática"
                      >
                        <Play size={14} className={rotationOn ? 'animate-pulse' : ''} />
                      </button>
                      <input 
                        type="range" min="0" max="5" step="0.5" 
                        value={rotationSpeed} 
                        onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                        className="w-20 accent-cyan-500"
                        title="Velocidad de rotación"
                      />
                    </div>
                    <div className="pl-1">
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Expandir/Contraer grafo para mejor legibilidad"
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border transition-all ${isExpanded ? 'bg-blue-900/40 border-blue-500/50 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                      >
                        <Crosshair size={14} />
                        {isExpanded ? 'MODO DENSO' : 'MODO EXPANDIDO'}
                      </button>
                    </div>
                  </div>
              </div>

              {/* Fila 4: Barra de Filtros */}
              <div className="flex gap-6 text-xs font-medium pb-2 mt-2 border-b border-gray-800/60 w-fit pr-8">
                  {['Habilidades', 'Competencias', 'Relaciones', 'Progreso', 'Aprendizaje'].map(filter => (
                    <span 
                      key={filter}
                      onClick={() => { 
                        setActiveTopFilter(filter); 
                        if (filter === 'Habilidades') setActiveTab('info');
                        if (filter === 'Competencias') setActiveTab('competencias');
                        if (filter === 'Relaciones') setActiveTab('info');
                        if (filter === 'Progreso') setActiveTab('progreso');
                        if (filter === 'Aprendizaje') setActiveTab('sistema');
                      }}
                      className={activeTopFilter === filter ? "green-text-active cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"}
                    >
                      {filter}
                    </span>
                  ))}
              </div>

              {/* Fila 5: Selector de Contexto */}
              <div className="mt-1">
                  <select 
                    value={contextFilter} 
                    onChange={(e) => setContextFilter(e.target.value)}
                    className="bg-gray-900/50 text-cyan-400 border border-gray-700 rounded px-2 py-1 outline-none cursor-pointer font-medium hover:border-cyan-500/50 transition-colors text-xs"
                  >
                      <option value="all" className="bg-[#161b22] text-white">Visualización Global (Todo)</option>
                      <option value="g1" className="bg-[#161b22] text-white">Nodos de Fundamentos (G1)</option>
                      <option value="g2" className="bg-[#161b22] text-white">Nodos de Construcción (G2)</option>
                      <option value="g3" className="bg-[#161b22] text-white">Nodos de Operación (G3)</option>
                      <option value="g4" className="bg-[#161b22] text-white">Nodos de Arquitectura (G4)</option>
                      <option value="g5" className="bg-[#161b22] text-white">Nodos Expertos (G5)</option>
                  </select>
              </div>
          </div>
      </div>

      {/* The 3D Graph Canvas */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0"></div>

      {/* Right Sidebar */}
      <aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl pointer-events-auto">
          
          <div className="flex-none bg-black z-10 border-b border-gray-800">
            <div className="p-4 flex justify-between items-center">
                <h2 className="text-base font-bold text-white">
                  {activeTab === 'info' && 'Detalles de habilidad'}
                  {activeTab === 'competencias' && 'Competencias por habilidad'}
                  {activeTab === 'sistema' && 'Sistema de aprendizaje'}
                  {activeTab === 'progreso' && 'Estado de tu progreso'}
                </h2>
                {selectedNode && activeTab === 'info' && (
                  <button 
                    onClick={() => selectNode(null)} 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-900"
                    title="Cerrar detalles"
                  >
                    <X size={18} />
                  </button>
                )}
            </div>
            
            <div className="flex px-4 gap-4 text-xs font-semibold text-gray-500 border-b border-gray-800">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`pb-2 transition-colors ${activeTab === 'info' ? 'blue-pill-tab-active border-b-2 border-blue-500' : 'hover:text-gray-300'}`}
                >
                  INFO
                </button>
                <button 
                  onClick={() => setActiveTab('competencias')}
                  className={`pb-2 transition-colors ${activeTab === 'competencias' ? 'blue-pill-tab-active border-b-2 border-blue-500' : 'hover:text-gray-300'}`}
                >
                  COMPETENCIAS
                </button>
            </div>
          </div>

          {!selectedNode ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <Crosshair size={32} className="mb-4 opacity-20" />
                <p className="text-sm">Selecciona un nodo en el espacio 3D para ver su topología.</p>
            </div>
          ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6 relative">
                    {nodeHistory.length > 0 && (
                      <button 
                        onClick={handleBack}
                        className="absolute top-2 left-4 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <ChevronRight size={12} className="rotate-180" /> Volver
                      </button>
                    )}
                    
                    <div className="pt-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-lg border" style={{ backgroundColor: `${selectedNode.color}22`, borderColor: selectedNode.color, color: selectedNode.color }}>
                                {selectedNode.icon || '⚙️'}
                            </div>
                            <h2 className="text-xl font-bold text-white leading-tight">{selectedNode.name}</h2>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">{selectedNode.desc}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 font-mono">
                                ID: {selectedNode.id}
                            </span>
                            <span className="px-2 py-1 bg-blue-900/30 border border-blue-800/50 rounded text-xs text-blue-300">
                                G{selectedNode.group}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Topología (Padres/Hijos)</h3>
                            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                                {(() => {
                                  const relatedNodes = selectedNode.isSub
                                    ? gData.nodes.filter(n => !n.isSub && n.group === selectedNode.group)
                                    : gData.nodes.filter(n => n.isSub && n.id.split('_')[0] === selectedNode.id);
                                  
                                  if (relatedNodes.length === 0) return <span className="text-gray-500 text-sm">No hay topología directa.</span>;

                                  return (
                                    <ul className="space-y-2">
                                      {relatedNodes.map((n, i) => (
                                        <li key={i} onClick={() => selectNode(n)} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer group">
                                          <Circle size={8} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                          <span className="truncate">{n.name}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                })()}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Relaciones Semánticas (Puentes)</h3>
                            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                              {(() => {
                                const relatedLinks = gData.links.filter(l => {
                                  const sId = typeof l.source === 'object' && l.source !== null ? (l.source as GraphSkillNode).id : l.source;
                                  const tId = typeof l.target === 'object' && l.target !== null ? (l.target as GraphSkillNode).id : l.target;
                                  return sId === selectedNode.id || tId === selectedNode.id;
                                });
                                
                                if (relatedLinks.length === 0) return <span className="text-gray-500 text-sm">No hay puentes semánticos.</span>;
                                
                                return (
                                  <ul className="space-y-3">
                                    {relatedLinks.map((l, i) => {
                                      const sId = typeof l.source === 'object' && l.source !== null ? (l.source as GraphSkillNode).id : (l.source as string);
                                      const tId = typeof l.target === 'object' && l.target !== null ? (l.target as GraphSkillNode).id : (l.target as string);
                                      const isSource = sId === selectedNode.id;
                                      const otherId = isSource ? tId : sId;
                                      const otherNode = gData.nodes.find(n => n.id === otherId);
                                      
                                      return (
                                        <li key={i} className="flex flex-col gap-1 text-sm bg-black/40 p-2 rounded border border-gray-800/50">
                                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                                            <Route size={12} className={isSource ? "text-green-500" : "text-amber-500"} />
                                            <span>{isSource ? 'Hacia:' : 'Desde:'}</span>
                                            <span className="font-mono text-[10px] bg-gray-800 px-1 rounded">{l.name}</span>
                                          </div>
                                          <div onClick={() => selectNode(otherNode || null)} className="text-gray-200 hover:text-cyan-300 cursor-pointer pl-5 transition-colors font-medium">
                                            {otherNode ? otherNode.name : otherId}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                );
                              })()}
                            </div>
                        </div>

                    </div>
                </div>
          )}
      </aside>
    </div>
  );
}
"""

content = header + new_component

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
