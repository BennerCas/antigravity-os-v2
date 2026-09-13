import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. We need to find the start and end of the Graph Toolbar Overlay
start_marker = '{/* Graph Toolbar Overlay */}'
end_marker = '{/* The 3D Graph Canvas */}'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_overlay = """{/* Graph Toolbar Overlay */}
      <div className="absolute top-0 left-0 right-[340px] p-6 z-10 flex flex-col gap-4 pointer-events-none">
          <div className="pointer-events-auto shrink-0 flex flex-col gap-4">
              
              {/* Fila 1: Título y Subtítulo */}
              <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                      <Database className="text-cyan-400 w-5 h-5" /> FLOW ARCHITECT AI - LAB
                  </h1>
                  <p className="text-xs text-gray-400">Explora, conecta y domina el conocimiento. Todo en un solo lugar.</p>
              </div>

              {/* Fila 2: Píldora de Progreso Global */}
              <div className="flex items-center">
                  <div 
                    onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                    className="flex items-center gap-2 text-xs bg-[#161b22] hover:bg-[#1f242c] border border-gray-800 hover:border-cyan-700/50 rounded-full px-4 py-1.5 cursor-pointer transition shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  >
                      <span className="text-gray-400">Tu progreso global</span>
                      <Circle className="text-green-500 w-4 h-4 fill-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] rounded-full" />
                      <span className="text-green-500 font-bold">{globalScore}%</span>
                  </div>
              </div>

              {/* Fila 3: Controles de Animación y Modo */}
              <div className="flex items-center gap-4 bg-[#0d1117]/90 border border-gray-800 rounded-xl px-4 py-2.5 backdrop-blur-md self-start shadow-lg">
                  <button
                    onClick={() => setRotationOn(prev => !prev)}
                    title={rotationOn ? "Detener rotación" : "Activar rotación"}
                    className={lex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }
                  >
                    <span className={w-2 h-2 rounded-full } />
                    {rotationOn ? 'ROTACIÓN ON' : 'ROTACIÓN OFF'}
                  </button>
                  
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-gray-500 text-[10px]">LENTO</span>
                    <input
                      type="range" min="0.1" max="2.0" step="0.05"
                      value={rotationSpeed}
                      onChange={e => setRotationSpeed(parseFloat(e.target.value))}
                      className="w-24 accent-cyan-400 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
                      title="Velocidad de rotación"
                    />
                    <span className="text-gray-500 text-[10px]">RÁPIDO</span>
                  </div>

                  <div className="border-l border-gray-700 pl-4">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      title="Expandir/Contraer grafo para mejor legibilidad"
                      className={lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }
                    >
                      <Crosshair size={14} />
                      {isExpanded ? 'MODO DENSO' : 'MODO EXPANDIDO'}
                    </button>
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
              <div className="flex items-center gap-3 text-xs mt-1 bg-[#0d1117]/80 px-4 py-2 rounded-lg border border-gray-800 self-start backdrop-blur-sm">
                  <span className="text-gray-400 font-semibold">Contexto del Grafo:</span>
                  <select 
                    value={contextFilter} 
                    onChange={(e) => setContextFilter(e.target.value)}
                    className="bg-gray-900/50 text-cyan-400 border border-gray-700 rounded px-2 py-1 outline-none cursor-pointer font-medium hover:border-cyan-500/50 transition-colors"
                  >
                      <option value="all" className="bg-[#161b22] text-white">Visualización Global (Todo)</option>
                      <option value="g1" className="bg-[#161b22] text-white">Nodos de Fundamentos (G1)</option>
                      <option value="g2" className="bg-[#161b22] text-white">Nodos de Construcción (G2)</option>
                      <option value="g3" className="bg-[#161b22] text-white">Nodos de Operación (G3)</option>
                  </select>
              </div>
          </div>
      </div>

      """

content = content[:start_idx] + new_overlay + content[end_idx:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
