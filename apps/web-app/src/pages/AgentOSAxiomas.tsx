import React, { useState } from 'react';
import { Target, Crosshair, TrendUp, Checks, PaintBrush, Lightning, CheckCircle, SlidersHorizontal, Database, UploadSimple, ShieldCheck, Thermometer, Brain, Trash, FileText, Link, GithubLogo, ToggleLeft, ToggleRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { useStudioStore } from '../stores/useStudioStore';

export default function AgentOSAxiomas() {
  const { 
    phase1Interview, phase1Complete, phase2Complete, phase3Complete, triageSummary, 
    quantumFriction, setQuantumFriction, 
    quantumTemperature, setQuantumTemperature,
    quantumProfile, setQuantumProfile,
    quantumCoT, setQuantumCoT,
    atlasArtifacts, addAtlasArtifact, removeAtlasArtifact, toggleAtlasArtifact 
  } = useStudioStore();
  
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editedObjective, setEditedObjective] = useState('');
  
  const [atlasFileObj, setAtlasFileObj] = useState<File | null>(null);
  const [artifactName, setArtifactName] = useState('');
  const [artifactType, setArtifactType] = useState<'file' | 'url' | 'github'>('file');
  const [artifactStrategy, setArtifactStrategy] = useState<'rag' | 'full'>('full');
  const [artifactNamespace, setArtifactNamespace] = useState('');

  const handleAddArtifact = () => {
    if (!artifactName.trim()) return;
    addAtlasArtifact({
      name: artifactName,
      type: artifactType,
      strategy: artifactStrategy,
      namespace: artifactNamespace || 'global',
      active: true
    });
    setArtifactName('');
    setArtifactNamespace('');
    setAtlasFileObj(null);
  };

  const handleSaveObjective = () => {
    setIsEditingObjective(false);
  };
  
  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 relative overflow-hidden h-full bg-[#030712]">
      {/* Background elements */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Crosshair size={300} weight="thin" />
      </div>

      <div className="w-full h-full flex flex-col animate-fade-in relative z-10 gap-6">
        
        {/* Header Progress */}
        <div className="shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-3">
              <Target size={28} style={{ color: 'var(--theme-border)' }} weight="duotone" />
              Centro de Mando (Axiomas)
            </h2>
            <div className="text-right">
              <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--theme-border)', opacity: 0.7 }}>Progreso Global</div>
              <div className="text-xl font-bold" style={{ color: 'var(--theme-border)' }}>
                {phase3Complete ? '100%' : phase2Complete ? '75%' : phase1Complete ? '50%' : phase1Interview ? '25%' : '0%'}
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--stroke-subtle)' }}>
            <div 
              className="h-full transition-all duration-1000 ease-out"
              style={{ 
                width: phase3Complete ? '100%' : phase2Complete ? '75%' : phase1Complete ? '50%' : phase1Interview ? '25%' : '0%',
                background: 'var(--theme-border)',
                boxShadow: '0 0 8px var(--theme-border)'
              }}
            />
          </div>
        </div>

        {/* Vector de Intención */}
        <div className="flex flex-col relative">
          <h3 className="shrink-0 text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendUp size={16} /> Vector de Intención
          </h3>
          
          {phase1Complete && triageSummary ? (
            <div className="flex flex-col p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <div className="flex items-start gap-5">
                <div className="shrink-0 p-4 bg-emerald-500/10 rounded-2xl">
                  <Checks size={28} className="text-emerald-400" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  {isEditingObjective ? (
                    <div className="flex flex-col gap-3">
                      <textarea 
                        value={editedObjective}
                        onChange={(e) => setEditedObjective(e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setIsEditingObjective(false); setEditedObjective(triageSummary); }} className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200">Cancelar</button>
                        <button onClick={handleSaveObjective} className="px-4 py-2 text-xs rounded-lg bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-relaxed text-zinc-300 font-medium">{triageSummary}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 border-t border-emerald-500/10 pt-4">
                <button onClick={() => setIsEditingObjective(!isEditingObjective)} className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors" title="Editar Objetivo">
                  <PaintBrush size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-10 border border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20">
              <div className="text-center max-w-sm px-6">
                <Target size={40} className="mx-auto text-zinc-700 mb-4" weight="thin" />
                <p className="text-sm font-medium text-zinc-500 mb-2">Esperando Intención Cero</p>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Inicia la conversación en The AureliOS para definir el vector principal del proyecto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Módulos de Control Base */}
        {/* Módulos de Control Base */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4 flex-1 min-h-0">
          
          {/* 1. QUANTUM ENGINE PANEL */}
          <div className="flex flex-col p-6 rounded-3xl border border-blue-500/20 bg-[#0a0f1a] relative overflow-y-auto custom-scrollbar group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
              <Brain size={120} weight="duotone" />
            </div>
            
            <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-blue-400 flex items-center gap-2">
                  <Lightning size={22} weight="duotone" /> Quantum Engine
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Regula la heurística y entropía del enjambre de agentes.</p>
              </div>
              <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-mono text-blue-300 uppercase tracking-wider">
                Motor Activo
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl mb-6 relative z-10 shrink-0">
              <p className="text-xs text-blue-200 font-semibold mb-2 flex items-center gap-2"><Target size={14}/> Instrucciones de Uso Correcto:</p>
              <ul className="text-[11px] text-zinc-400 space-y-2 list-disc pl-4">
                <li><strong className="text-blue-300">Perfil Estricto:</strong> Ideal para refactorización pura o auditoría rígida. <strong className="text-blue-300">Red Team:</strong> Útil para buscar vulnerabilidades.</li>
                <li><strong className="text-blue-300">Fricción (Caos):</strong> Aumentar por encima de 50% forzará al sistema a generar debates internos en AureliOS, oponiéndose a tus ideas. Úsalo si buscas validación crítica.</li>
                <li><strong className="text-blue-300">Temperatura:</strong> Mantenla en 0.7 para código seguro. Súbela a 1.2+ solo si estás en una sesión de Brainstorming creativo sin reglas estrictas.</li>
                <li><strong className="text-blue-300">Reflexión (CoT):</strong> Actívalo siempre en tareas matemáticas o de lógica compleja para forzar al LLM a pensar antes de escupir JSONs.</li>
              </ul>
            </div>

            <div className="space-y-6 relative z-10 shrink-0">
              {/* Presets */}
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-2">Perfil Cognitivo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'strict', label: 'Estricto', icon: <Target size={16} /> },
                    { id: 'balanced', label: 'Laminar', icon: <Checks size={16} /> },
                    { id: 'brainstorm', label: 'Creativo', icon: <PaintBrush size={16} /> },
                    { id: 'devil_advocate', label: 'Red Team', icon: <Crosshair size={16} /> }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setQuantumProfile(p.id as any)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all ${quantumProfile === p.id ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'}`}
                    >
                      {p.icon}
                      <span className="text-[10px] mt-1 font-semibold">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Friction Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    <span>Fricción Analítica</span>
                    <span className="text-blue-400">{quantumFriction}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={quantumFriction} onChange={(e) => setQuantumFriction(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                  />
                </div>

                {/* Temperature Slider */}
                <div>
                  <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    <span><Thermometer size={12} className="inline mr-1"/> Temperatura (Creatividad)</span>
                    <span className="text-orange-400">{quantumTemperature.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1" value={quantumTemperature} onChange={(e) => setQuantumTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                  />
                </div>
              </div>

              {/* Chain of thought toggle */}
              <div className="pt-2 border-t border-blue-500/10 flex justify-between items-center pb-2">
                <div>
                  <p className="text-xs font-bold text-zinc-200">Reflexión Profunda (Chain-of-Thought)</p>
                  <p className="text-[10px] text-zinc-500">Obliga al enjambre a "pensar" y planear visiblemente.</p>
                </div>
                <button onClick={() => setQuantumCoT(!quantumCoT)} className="text-blue-400 hover:text-blue-300 transition-colors">
                  {quantumCoT ? <ToggleRight size={32} weight="fill" /> : <ToggleLeft size={32} className="text-zinc-600" />}
                </button>
              </div>
            </div>
          </div>

          {/* 2. ATLAS FORGE PIPELINE */}
          <div className="flex flex-col p-6 rounded-3xl border border-amber-500/20 bg-[#141005] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
              <Database size={120} weight="duotone" />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <Database size={22} weight="duotone" /> Atlas Forge Pipeline
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Centro de inyección de conocimiento persistente.</p>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl mb-6 relative z-10 shrink-0">
              <p className="text-xs text-amber-200 font-semibold mb-2 flex items-center gap-2"><CheckCircle size={14}/> Instrucciones de Uso Correcto:</p>
              <ul className="text-[11px] text-zinc-400 space-y-2 list-disc pl-4">
                <li><strong className="text-amber-300">Namespace:</strong> Obligatorio. Agrupa tus documentos lógicamente (ej. <code className="bg-black/50 px-1 rounded">global</code>, <code className="bg-black/50 px-1 rounded">auth-module</code>). El modelo filtrará su contexto basándose en el Namespace activo en AureliOS.</li>
                <li><strong className="text-amber-300">Estrategia "Full Context":</strong> Inyecta el texto completo directamente en el System Prompt. Usa esto <strong className="underline">solo</strong> para archivos base de reglas (ej. GEMINI.md, AUDITORIA.md).</li>
                <li><strong className="text-amber-300">Estrategia "RAG Search":</strong> Carga el documento en la base de datos vectorial local. Usa esto para repositorios grandes, manuales de API o código legacy gigante. El agente lo buscará dinámicamente cuando lo necesite.</li>
                <li><strong className="text-amber-300">Botón 👁️ (Ocultar):</strong> Permite apagar temporalmente un documento maestro sin borrarlo, ideal para probar cómo actúa el sistema sin esa regla.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 relative z-10 flex-1 min-h-0">
              
              {/* Add form */}
              <div className="flex flex-col gap-3 p-4 bg-black/40 rounded-2xl border border-amber-500/10 shrink-0">
                <div className="flex gap-2">
                  <input type="text" placeholder="Nombre (ej. Reglas Globales)" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50" value={artifactName} onChange={e => setArtifactName(e.target.value)} />
                  <input type="text" placeholder="Namespace" className="w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50" value={artifactNamespace} onChange={e => setArtifactNamespace(e.target.value)} />
                </div>
                
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {[
                      { id: 'file', icon: <FileText size={14} /> },
                      { id: 'url', icon: <Link size={14} /> },
                      { id: 'github', icon: <GithubLogo size={14} /> }
                    ].map(t => (
                       <button key={t.id} onClick={() => setArtifactType(t.id as any)} className={`p-1.5 rounded-md transition-colors ${artifactType === t.id ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{t.icon}</button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className={`cursor-pointer ${artifactStrategy === 'full' ? 'text-amber-400 font-bold' : 'text-zinc-500'}`} onClick={() => setArtifactStrategy('full')}>Full Context</span>
                    <span className="text-zinc-700">|</span>
                    <span className={`cursor-pointer ${artifactStrategy === 'rag' ? 'text-amber-400 font-bold' : 'text-zinc-500'}`} onClick={() => setArtifactStrategy('rag')}>RAG</span>
                  </div>

                  <button onClick={handleAddArtifact} disabled={!artifactName.trim()} className="px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Inyectar
                  </button>
                </div>
              </div>

              {/* Artifacts List */}
              <div className="flex-1 bg-black/20 rounded-2xl border border-amber-500/10 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-amber-500/10 flex justify-between items-center bg-black/40 shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Memoria Inyectada</span>
                  <span className="text-[10px] font-bold text-amber-500/50">{atlasArtifacts.length} Artefactos</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {atlasArtifacts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 opacity-50 py-6">
                      <Database size={32} weight="duotone" />
                      <span className="text-[10px]">No hay contexto inyectado.</span>
                    </div>
                  ) : (
                    atlasArtifacts.map(art => (
                      <div key={art.id} className={`flex items-center justify-between p-2 rounded-lg border transition-colors shrink-0 ${art.active ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5 opacity-60'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          {art.type === 'file' ? <FileText size={16} className={`shrink-0 ${art.active ? 'text-amber-400' : 'text-zinc-500'}`} /> : art.type === 'url' ? <Link size={16} className={`shrink-0 ${art.active ? 'text-blue-400' : 'text-zinc-500'}`} /> : <GithubLogo size={16} className={`shrink-0 ${art.active ? 'text-purple-400' : 'text-zinc-500'}`} />}
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs font-bold truncate ${art.active ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>{art.name}</span>
                            <div className="flex gap-2 text-[9px] font-mono mt-0.5">
                              <span className="text-zinc-500 truncate">[{art.namespace}]</span>
                              <span className={art.strategy === 'full' ? 'text-amber-500/80 shrink-0' : 'text-emerald-500/80 shrink-0'}>{art.strategy.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <button onClick={() => toggleAtlasArtifact(art.id)} className="text-zinc-400 hover:text-white transition-colors">
                            {art.active ? <Eye size={16} /> : <EyeSlash size={16} />}
                          </button>
                          <button onClick={() => removeAtlasArtifact(art.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

