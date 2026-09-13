import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';
import ReactMarkdown from 'react-markdown';
import { Star, Cpu, MagnifyingGlass, CheckCircle, Compass, Hammer, Brain, Gear, Rocket, Database, TerminalWindow, Lightning, LockKey, CaretRight, Sparkle, Check, Copy } from '@phosphor-icons/react';
import { logicTaskManager, LogicTaskState } from '../lib/logicTaskManager';
import { sendToBuilderBridge } from '../lib/builderBridge';
import { useNavigate } from 'react-router-dom';
import { SystemEvolutionPanel } from '../components/architecture/SystemEvolutionPanel';

interface PromptDoc {
  key: string;
  used_at: string;
  text: string;
  explanation?: string;
}

interface FlowStep {
  step: number;
  id: string;
  name: string;
  page: string;
  what: string;
  prompts: PromptDoc[];
}

interface ArchitectureData {
  app: string;
  engine: { name: string; cloud: string; local: string; rule: string };
  flow: FlowStep[];
  apps: FlowStep[];
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  master_prompts: <Star size={22} weight="fill" className="text-yellow-500" />,
  engine: <Cpu size={22} weight="light" />,
  inspector: <MagnifyingGlass size={22} weight="light" />,
  results: <CheckCircle size={22} weight="light" />,
  atlas: <Compass size={22} weight="light" />,
  builder: <Hammer size={22} weight="light" />,
  orchestrator: <Brain size={22} weight="light" />,
  compiler: <Gear size={22} weight="light" />,
  runtime: <Rocket size={22} weight="light" />,
  nexus: <Database size={22} weight="light" />,
  coding: <TerminalWindow size={22} weight="light" />,
  automatizacion: <Lightning size={22} weight="light" />,
  vault: <LockKey size={22} weight="light" />,
};

export default function Architecture() {
  const navigate = useNavigate();
  const [data, setData] = useState<ArchitectureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeStepId, setActiveStepId] = useState<string | null>(() => {
    return localStorage.getItem('arch_active_step_id') || null;
  });
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [panelTab, setPanelTab] = useState<'content' | 'logic'>(() => {
    return (localStorage.getItem('arch_panel_tab') as 'content' | 'logic') || 'content';
  });
  const [mainTab, setMainTab] = useState<'map' | 'evolution'>(() => {
    return (localStorage.getItem('arch_main_view') as 'map' | 'evolution') || 'map';
  });
  const [currentLogicTask, setCurrentLogicTask] = useState<LogicTaskState | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optTimeLeft, setOptTimeLeft] = useState('');
  const [optimizedPrompts, setOptimizedPrompts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('arch_single_optimized');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [promptSearchTerm, setPromptSearchTerm] = useState('');
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [isBatchOptimizing, setIsBatchOptimizing] = useState(false);

  useEffect(() => {
    localStorage.setItem('arch_single_optimized', JSON.stringify(optimizedPrompts));
  }, [optimizedPrompts]);

  useEffect(() => {
    localStorage.setItem('arch_main_view', mainTab);
  }, [mainTab]);

  useEffect(() => {
    fetch(`${API_URL}/architecture`)
      .then((r) => r.json())
      .then((archData: ArchitectureData) => {
        setData(archData);
        // Restaurar paso y prompt seleccionado si estaban guardados
        const savedStep = localStorage.getItem('arch_active_step_id') || (archData.flow.length > 0 ? archData.flow[0].id : null);
        if (savedStep) {
          setActiveStepId(savedStep);
          const allModules = [...archData.flow, ...(archData.apps || [])];
          const mod = allModules.find(m => m.id === savedStep);
          const savedPromptKey = localStorage.getItem('arch_selected_prompt_key');
          if (savedPromptKey) {
            const foundPrompt = mod?.prompts.find(p => p.key === savedPromptKey);
            if (foundPrompt) {
              setSelectedPrompt(foundPrompt);
            } else if (mod && mod.prompts.length > 0) {
              setSelectedPrompt(mod.prompts[0]);
            }
          } else if (mod && mod.prompts.length > 0) {
            setSelectedPrompt(mod.prompts[0]);
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  // Suscribirse reactivamente al singleton de tareas de lógica según el prompt activo
  useEffect(() => {
    if (!selectedPrompt) {
      setCurrentLogicTask(null);
      return;
    }
    const key = `arch_${selectedPrompt.key}`;
    const unsubscribe = logicTaskManager.subscribe(key, (taskState) => {
      setCurrentLogicTask({ ...taskState });
    });
    return () => unsubscribe();
  }, [selectedPrompt?.key]);

  // Guardar estado en localStorage
  useEffect(() => {
    if (activeStepId) {
      localStorage.setItem('arch_active_step_id', activeStepId);
    }
  }, [activeStepId]);

  useEffect(() => {
    if (selectedPrompt?.key) {
      localStorage.setItem('arch_selected_prompt_key', selectedPrompt.key);
    } else {
      localStorage.removeItem('arch_selected_prompt_key');
    }
  }, [selectedPrompt?.key]);

  useEffect(() => {
    localStorage.setItem('arch_panel_tab', panelTab);
  }, [panelTab]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleLogic = () => {
    if (!selectedPrompt) return;
    setPanelTab('logic');
    const key = `arch_${selectedPrompt.key}`;
    logicTaskManager.startTask(key, selectedPrompt.text, selectedPrompt.key);
  };

  const handleOptimizeSingle = async () => {
    if (!selectedPrompt || isOptimizing) return;
    setIsOptimizing(true);
    setOptProgress(0);
    setOptTimeLeft('12s restantes...');
    
    // Simular progreso para UX usando Date.now() para evitar problemas de throttling o closure
    const totalMs = 12000;
    const startTime = Date.now();
    const progressTimer = window.setInterval(() => {
      const currentElapsed = Date.now() - startTime;
      const pct = Math.min(99, Math.round((currentElapsed / totalMs) * 100));
      
      setOptProgress(prev => {
        // Asegurar que siempre suba y no se quede pegado
        return Math.max(prev, pct);
      });
      
      const left = Math.max(0, Math.ceil((totalMs - currentElapsed) / 1000));
      setOptTimeLeft(`${left}s restantes...`);
    }, 150);

    // Buscar si es agent o prompt
    let category = 'prompt';
    let moduleName = 'Core';
    if (data) {
      const allModules = [...data.flow, ...(data.apps || [])];
      for (const mod of allModules) {
        if (mod.prompts.find(p => p.key === selectedPrompt.key)) {
          moduleName = mod.name;
          const k = selectedPrompt.key;
          if (k.includes('agent') || k.includes('executor') || k.includes('engine') || k.includes('architect') || ['builder', 'orchestrator', 'runtime'].includes(mod.id)) {
            category = 'agent';
          }
          break;
        }
      }
    }

    try {
      const res = await fetch(`${API_URL}/architecture/evolve-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: [{
            key: selectedPrompt.key,
            moduleName,
            category,
            text: selectedPrompt.text,
            explanation: selectedPrompt.explanation || ''
          }],
          batch_index: 0,
          total_batches: 1
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.results && json.results[0]) {
           const result = json.results[0];
           setOptimizedPrompts(prev => ({ ...prev, [selectedPrompt.key]: result.content }));
           // Sync with Evolution tab AND Consolidate permanently
           try {
             const existing = JSON.parse(localStorage.getItem('system_evolution_overrides') || '{}');
             existing[selectedPrompt.key] = { content: result.content, rationale: result.rationale || 'Optimización singular manual' };
             localStorage.setItem('system_evolution_overrides', JSON.stringify(existing));
             
             // Consolidate in backend instantly
             await fetch(`${API_URL}/architecture/consolidate`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 overrides: existing,
                 notes: `Optimización singular automática para: ${selectedPrompt.key}`,
                 author: 'Usuario',
                 version: '3.0.0'
               })
             });
           } catch (e) {
             console.error("Error consolidando en backend", e);
           }
        }
      } else {
        alert("Error optimizando el prompt.");
      }
    } catch (e) {
      alert("Error de conexión al optimizar.");
    } finally {
      window.clearInterval(progressTimer);
      setOptProgress(100);
      setTimeout(() => {
        setIsOptimizing(false);
      }, 500);
    }
  };

  const handleBatchOptimize = async () => {
    if (selectedForBatch.length === 0) return;
    setIsBatchOptimizing(true);
    const promptsToOptimize: any[] = [];
    const allModules = [...(data?.flow || []), ...(data?.apps || [])];
    for (const mod of allModules) {
       for (const p of mod.prompts) {
           if (selectedForBatch.includes(p.key)) {
               promptsToOptimize.push({
                   key: p.key,
                   moduleName: mod.name,
                   category: (p.key.includes('agent') || p.key.includes('executor') || p.key.includes('engine') || p.key.includes('architect') || ['builder', 'orchestrator', 'runtime'].includes(mod.id)) ? 'agent' : 'prompt',
                   text: p.text,
                   explanation: p.explanation || ''
               });
           }
       }
    }
    
    try {
        const res = await fetch(`${API_URL}/architecture/evolve-batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompts: promptsToOptimize,
                batch_index: 0,
                total_batches: 1
            })
        });
        if (res.ok) {
            const json = await res.json();
            if (json.results && json.results.length > 0) {
               const newOptimized = {...optimizedPrompts};
               const existing = JSON.parse(localStorage.getItem('system_evolution_overrides') || '{}');
               
               for (const result of json.results) {
                   newOptimized[result.prompt_key] = result.content;
                   existing[result.prompt_key] = { content: result.content, rationale: result.rationale || 'Optimización por lote' };
               }
               setOptimizedPrompts(newOptimized);
               localStorage.setItem('system_evolution_overrides', JSON.stringify(existing));
               
               await fetch(`${API_URL}/architecture/consolidate`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({
                       overrides: existing,
                       notes: `Optimización por lote de ${json.results.length} prompts`,
                       author: 'Usuario',
                       version: '3.0.0'
                   })
               });
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsBatchOptimizing(false);
        setSelectedForBatch([]);
    }
  };

  if (error) {
    return <div className="p-10 text-red-400">Error cargando arquitectura: {error}</div>;
  }

  if (!data) {
    return (
      <div className="p-10 text-[#8A8A8A] flex items-center gap-3">
        <span className="animate-spin">⚙️</span> Cargando mapa de arquitectura...
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden p-6 w-full flex flex-col bg-[var(--surface-canvas)]">
      <header className="mb-4 flex-shrink-0 flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Arquitectura del Sistema</h1>
          <p className="text-[#A0A0A0] text-sm">
            Mapa vivo del flujo completo de {data.app}. Los master prompts mostrados son los que el backend
            usa <strong className="text-[#7B9C7F]">en este momento</strong>.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Pestañas Principales: Mapa vs Evolución */}
          <div className="flex items-center bg-[#000000] border border-[#2A2A2A] rounded-xl p-1.5 text-base">
            <button
              onClick={() => setMainTab('map')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                mainTab === 'map'
                  ? 'selected-green shadow-[0_0_10px_rgba(23,74,31,0.5)]'
                  : 'text-[#8A8A8A] hover:text-white border border-[#2A2A2A] bg-[#000000]'
              }`}
            >
              <Compass size={18} className={mainTab === 'map' ? 'text-[#7B9C7F]' : ''} />
              Mapa del Sistema
            </button>
            <button
              onClick={() => setMainTab('evolution')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                mainTab === 'evolution'
                  ? 'selected-green shadow-[0_0_10px_rgba(23,74,31,0.5)]'
                  : 'text-[#8A8A8A] hover:text-white border border-[#2A2A2A] bg-[#000000]'
              }`}
            >
              <Sparkle size={18} className={mainTab === 'evolution' ? 'text-[#7B9C7F]' : ''} />
              Evolución & Auto-Mejora (131)
            </button>
          </div>

          {/* Motor Híbrido Compacto */}
          <div className="flex gap-4 items-center bg-[#000000] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs">
            <div className="flex items-center gap-1 font-bold text-white">
              <Cpu size={16} className="text-[#7B9C7F]" /> {data.engine.name}
            </div>
            <div className="border-l border-[#2A2A2A] pl-4">
              <span className="text-[#7B9C7F] font-bold uppercase tracking-wide text-[9px] block">Nube</span>
              <code className="text-[#FFFFFF]">{data.engine.cloud}</code>
            </div>
            <div className="border-l border-[#2A2A2A] pl-4">
              <span className="text-[#8A8A8A] font-bold uppercase tracking-wide text-[9px] block">Local</span>
              <code className="text-[#FFFFFF]">{data.engine.local}</code>
            </div>
          </div>
        </div>
      </header>

      {/* Vista 1: Consola de Evolución & Auto-Mejora Sistémica */}
      {mainTab === 'evolution' ? (
        <SystemEvolutionPanel data={data} />
      ) : (
      /* Master-Detail-Subdetail Layout */
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Column 1: Navigation (Modules) */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
           <div className="mb-1 pl-2">
              <h3 className="text-xs font-bold text-[#7B9C7F] uppercase tracking-widest">Core Engine</h3>
           </div>
           
           {data.flow.map(step => {
              const isActive = activeStepId === step.id;
              return (
                 <button 
                    key={step.id}
                    onClick={() => { 
                      setActiveStepId(step.id); 
                      if (!isActive) setSelectedPrompt(null);
                    }}
                    className={`w-full flex items-center gap-3 p-4 text-left outline-none transition-all duration-300 ${isActive ? 'nav-item-active shadow-[0_0_10px_rgba(23,74,31,0.5)]' : 'nav-item-inactive'}`}
                 >
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full font-mono font-bold text-sm transition-colors ${isActive ? 'bg-[#0A1C0D] border border-[#174A1F] text-[#7B9C7F]' : 'bg-[#000000] border border-[#2A2A2A] text-[#8A8A8A]'}`}>
                      {step.step}
                    </span>
                    <span className={isActive ? "text-[#7B9C7F]" : "text-[#8A8A8A]"}>{STEP_ICONS[step.id]}</span>
                    <h2 className={`text-base font-bold tracking-wide ${isActive ? 'text-[#7B9C7F]' : 'text-[#8A8A8A]'}`}>{step.name}</h2>
                    <CaretRight size={16} className={`ml-auto transition-transform duration-300 ${isActive ? 'text-[#7B9C7F]' : 'text-[#2A2A2A] opacity-0'}`} />
                 </button>
              )
           })}

           {data.apps && data.apps.length > 0 && (
              <>
                 <div className="mt-4 mb-2 pl-2">
                    <h3 className="text-xs font-bold text-[#7B9C7F] uppercase tracking-widest">OS Apps</h3>
                 </div>
                 {data.apps.map(app => {
                    const isActive = activeStepId === app.id;
                    return (
                       <button 
                          key={app.id}
                          onClick={() => { 
                            setActiveStepId(app.id); 
                            if (!isActive) setSelectedPrompt(null);
                          }}
                          className={`w-full flex items-center gap-3 p-4 text-left outline-none transition-all duration-300 ${isActive ? 'nav-item-active shadow-[0_0_10px_rgba(23,74,31,0.5)]' : 'nav-item-inactive'}`}
                       >
                          <span className={isActive ? "text-[#7B9C7F]" : "text-[#8A8A8A]"}>{STEP_ICONS[app.id]}</span>
                          <h2 className={`text-base font-bold tracking-wide ${isActive ? 'text-[#7B9C7F]' : 'text-[#8A8A8A]'}`}>{app.name}</h2>
                          <CaretRight size={16} className={`ml-auto transition-transform duration-300 ${isActive ? 'text-[#7B9C7F]' : 'text-[#2A2A2A] opacity-0'}`} />
                       </button>
                    )
                 })}
              </>
           )}
        </div>

        {/* Column 2: Module Details & Prompts List */}
        <div className="w-[380px] flex-shrink-0 bg-[#000000] border border-[#2A2A2A] rounded-2xl flex flex-col overflow-hidden relative shadow-lg">
           {(() => {
              const activeModule = data.flow.find(s => s.id === activeStepId) || data.apps?.find(a => a.id === activeStepId);
              
              if (!activeModule) {
                 return (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#2A2A2A] p-6 text-center">
                       <Compass size={48} weight="light" className="mb-4 opacity-20" />
                       <p className="text-sm font-medium">Selecciona un módulo de la izquierda para ver sus detalles y agentes.</p>
                    </div>
                 );
              }
              
              return (
                 <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-[#2A2A2A] bg-[#000000]">
                       <h2 className={`text-xl font-bold mb-3 text-[#7B9C7F]`}>{activeModule.name}</h2>
                       <p className="text-base text-[#FFFFFF] leading-relaxed">{activeModule.what}</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                       <div className="flex items-center justify-between mb-3 pl-2">
                         <div className="text-xs uppercase tracking-widest text-[#8A8A8A] font-bold">
                           Master Prompts ({activeModule.prompts.length})
                         </div>
                       </div>
                       
                       <div className="mb-4">
                         <input 
                           type="text"
                           placeholder="Buscar por nombre o uso..."
                           value={promptSearchTerm}
                           onChange={(e) => setPromptSearchTerm(e.target.value)}
                           className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#7B9C7F] transition-colors"
                         />
                       </div>

                       {selectedForBatch.length > 0 && (
                         <div className="mb-4 p-3 bg-[#0A1C0D] border border-[#174A1F] rounded-lg flex flex-col gap-2">
                           <div className="text-sm font-bold text-[#7B9C7F]">
                             {selectedForBatch.length} prompts seleccionados
                           </div>
                           <div className="flex flex-wrap gap-2">
                             <button
                               onClick={() => setSelectedForBatch([])}
                               className="px-2 py-1 text-xs bg-[#000000] text-gray-300 border border-[#2A2A2A] rounded hover:bg-gray-800"
                             >
                               Limpiar
                             </button>
                             <button
                               onClick={handleBatchOptimize}
                               disabled={isBatchOptimizing}
                               className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500 font-bold flex items-center gap-1 disabled:opacity-50"
                             >
                               {isBatchOptimizing ? <Gear className="animate-spin" /> : '✨'}
                               {isBatchOptimizing ? 'Optimizando...' : 'Optimizar Lote'}
                             </button>
                             <button
                               onClick={() => {
                                 const modulePromptKeys = activeModule.prompts.map(p => p.key);
                                 const toAdd = modulePromptKeys.filter(k => !selectedForBatch.includes(k));
                                 if (toAdd.length > 0) {
                                   setSelectedForBatch(prev => [...prev, ...toAdd]);
                                 }
                               }}
                               className="px-2 py-1 text-xs bg-[#000000] text-[#7B9C7F] border border-[#174A1F] rounded hover:bg-[#0A1C0D]"
                             >
                               Seleccionar Todos
                             </button>
                           </div>
                         </div>
                       )}

                       <div className="flex flex-col gap-2">
                          {activeModule.prompts.filter(p => p.key.toLowerCase().includes(promptSearchTerm.toLowerCase()) || (p.used_at && p.used_at.toLowerCase().includes(promptSearchTerm.toLowerCase()))).map(p => {
                             const isSelected = selectedPrompt?.key === p.key;
                              
                              return (
                                 <button 
                                      key={p.key}
                                      onClick={() => setSelectedPrompt(p)}
                                      className={`w-full flex flex-col items-start gap-1.5 p-3 text-left transition-all outline-none hover:brightness-110 font-bold shadow-sm rounded-lg ${isSelected ? 'nav-item-active shadow-[0_0_10px_rgba(23,74,31,0.5)] border border-[#174A1F]' : 'nav-item-inactive border border-transparent'}`}
                                   >
                                      <div className="w-full flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                          <input 
                                            type="checkbox"
                                            checked={selectedForBatch.includes(p.key)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedForBatch(prev => [...prev, p.key]);
                                              } else {
                                                setSelectedForBatch(prev => prev.filter(k => k !== p.key));
                                              }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
                                          />
                                          <code className={`text-sm font-mono truncate ${isSelected ? 'text-[#7B9C7F]' : 'text-gray-200'}`}>{p.key}</code>
                                        </div>
                                        <CaretRight size={14} style={{ opacity: isSelected ? 1 : 0.3, color: isSelected ? '#7B9C7F' : '#ffffff' }} className="flex-shrink-0" />
                                      </div>
                                      {p.used_at && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-sans tracking-wide ml-6 ${isSelected ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50' : 'bg-gray-900/50 text-gray-400 border-gray-800'}`}>
                                          {p.used_at}
                                        </span>
                                      )}
                                  </button>
                             )
                          })}
                       </div>
                    </div>
                 </div>
              );
           })()}
        </div>

        {/* Column 3: Prompt Viewer */}
        <div className="flex-1 min-w-0 bg-[#000000] border border-[#2A2A2A] rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">
           {selectedPrompt ? (
              <>
                  <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A] bg-[#000000]">
                     <div className="flex items-center gap-3">
                        <code className="text-emerald-300 text-sm font-mono font-bold bg-emerald-950/50 px-2 py-1 rounded border border-emerald-900/50">{selectedPrompt.key}</code>
                        <span className="text-[#A0A0A0] text-sm font-mono hidden xl:inline-block">{selectedPrompt.used_at}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <span className="text-xs text-[#8A8A8A] font-mono hidden sm:inline-block">{selectedPrompt.text.length} caracteres</span>
                        
                        {/* Botón Enviar a Builder */}
                        <button
                          onClick={() => {
                            sendToBuilderBridge(navigate, {
                              prompt: {
                                title: selectedPrompt.key,
                                content: selectedPrompt.text,
                                role: selectedPrompt.used_at || 'Core Architecture',
                                framework: 'auto',
                                llm_model: 'hermes3:8b',
                                temperature: 0.7,
                                key: selectedPrompt.key
                              },
                              promptKey: selectedPrompt.key
                            });
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700/50 transition-colors shadow-sm cursor-pointer"
                          title="Enviar este prompt al Builder para orquestación y canvas"
                        >
                          🛠️ Builder
                        </button>

                        {/* Botón Optimizar */}
                        <button 
                          onClick={handleOptimizeSingle} 
                          disabled={isOptimizing}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 transition-colors shadow-sm disabled:opacity-50"
                          title="Optimizar estructuralmente con el mismo motor de Evolución"
                        >
                          {isOptimizing ? '✨ Optimizando...' : '✨ Optimizar'}
                        </button>

                        {/* Botón Lógica al costado de Copiar */}
                        {panelTab === 'content' ? (
                          <button 
                            onClick={handleLogic} 
                            disabled={currentLogicTask?.isRunning}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700/50 transition-colors shadow-sm disabled:opacity-50"
                          >
                            {currentLogicTask?.isRunning ? '🧠 Analizando...' : '🧠 Lógica'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setPanelTab('content')} 
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600 transition-colors shadow-sm"
                          >
                            ⬅️ Volver
                          </button>
                        )}

                        <button
                           onClick={() => handleCopy(panelTab === 'logic' && currentLogicTask?.result ? currentLogicTask.result : (optimizedPrompts[selectedPrompt.key] || selectedPrompt.text))}
                           className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 transition-colors"
                        >
                           {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                           {copied ? 'Copiado' : 'Copiar'}
                        </button>
                     </div>
                  </div>
                  
                  {/* Barra de progreso de optimización si está corriendo */}
                  {isOptimizing && (
                    <div className="px-6 pt-3 pb-1 bg-emerald-950/80 border-b border-emerald-800 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-emerald-400 font-medium">
                        <span className="flex items-center gap-1.5 animate-pulse">✨ Evolucionando con el motor AI...</span>
                        <span>{optProgress}% ({optTimeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-[#2A2A2A]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${optProgress}%`, backgroundColor: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Barra de progreso interactiva si está corriendo */}
                  {currentLogicTask?.isRunning && (
                    <div className="px-6 pt-3 pb-1 bg-gray-950/80 border-b border-gray-800 flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-blue-400 font-medium">
                        <span className="flex items-center gap-1.5 animate-pulse">🧠 Analizando lógica interna...</span>
                        <span>{currentLogicTask.progress}% ({currentLogicTask.timeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-[#2A2A2A]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${currentLogicTask.progress}%`, backgroundColor: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {optimizedPrompts[selectedPrompt.key] && (
                    <div className="px-6 py-2 bg-emerald-950/30 border-b border-emerald-900/50 flex justify-between items-center text-xs text-emerald-400">
                      <span>✨ Versión optimizada (Guardada y consolidada automáticamente en el sistema).</span>
                      <button onClick={async () => {
                        setOptimizedPrompts(p => { const newP = {...p}; delete newP[selectedPrompt.key]; return newP; });
                        try {
                          const existing = JSON.parse(localStorage.getItem('system_evolution_overrides') || '{}');
                          delete existing[selectedPrompt.key];
                          localStorage.setItem('system_evolution_overrides', JSON.stringify(existing));
                          
                          await fetch(`${API_URL}/architecture/consolidate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              overrides: existing,
                              notes: `Restauración de prompt original para: ${selectedPrompt.key}`,
                              author: 'Usuario',
                              version: '3.0.0'
                            })
                          });
                        } catch (e) {}
                      }} className="underline hover:text-emerald-300">Restaurar Original</button>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
                     <div className="flex-1 p-6">
                        {panelTab === 'content' ? (
                           <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-[#0A0A0A] to-[#050505] border border-[#2A2A2A] shadow-2xl">
                             <div className="flex items-center gap-2 px-4 py-3 bg-[#111] border-b border-[#2A2A2A]">
                               <div className="flex gap-1.5">
                                 <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                 <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                 <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                               </div>
                               <div className="ml-3 flex items-center gap-2 text-xs text-[#8A8A8A] font-mono uppercase tracking-widest font-semibold">
                                 <TerminalWindow size={15} className="text-[#7B9C7F]" />
                                 <span>{selectedPrompt.key}.ai</span>
                               </div>
                             </div>
                             <div className="p-5 overflow-x-auto">
                               <pre className="text-sm text-[#D4D4D4] whitespace-pre-wrap font-mono leading-relaxed selection:bg-[#7B9C7F]/30 selection:text-white">
                                  {optimizedPrompts[selectedPrompt.key] || selectedPrompt.text}
                               </pre>
                             </div>
                           </div>
                        ) : (
                           <div className="p-6 rounded-xl border border-gray-800 leading-relaxed prose prose-invert max-w-none shadow-inner bg-gray-900/80 text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400">
                              <ReactMarkdown>
                                 {currentLogicTask?.result || (currentLogicTask?.isRunning ? '🧠 Generando análisis profundo de la lógica del prompt en segundo plano...' : 'No hay datos de lógica disponibles. Haz clic en "🧠 Lógica" para generarlos.')}
                              </ReactMarkdown>
                           </div>
                        )}
                     </div>
                  </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#2A2A2A] bg-[#000000]">
                 <Brain size={64} weight="light" className="mb-6 opacity-20" />
                 <p className="text-sm font-medium">Selecciona un Master Prompt para inspeccionar su código fuente.</p>
              </div>
           )}
        </div>

      </div>
      )}
    </div>
  );
}
