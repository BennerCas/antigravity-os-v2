import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';
import { Brain, Compass, Hammer, Rocket, Gear, Database, Cpu, CaretRight, Copy, Check, SpeakerHigh, TerminalWindow, Lightning, LockKey } from '@phosphor-icons/react';

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
  const [data, setData] = useState<ArchitectureData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/architecture`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    if (data && data.flow.length > 0 && !activeStepId) {
      setActiveStepId(data.flow[0].id);
    }
  }, [data, activeStepId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleSpeech = (text: string) => {
    if (!window.speechSynthesis) return;
    
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    
    // Normalize text (remove markdown symbols if any, though explanation is plain text)
    const normalizedText = text.replace(/[*_#`]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'es-ES'; // Force Spanish
    
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  
  // Stop speech if unmounted or prompt changes
  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [selectedPrompt]);

  if (error) {
    return <div className="p-10 text-red-400">Error cargando arquitectura: {error}</div>;
  }

  if (!data) {
    return (
      <div className="p-10 text-zinc-400 flex items-center gap-3">
        <span className="animate-spin">⚙️</span> Cargando mapa de arquitectura...
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden p-6 w-full flex flex-col bg-[var(--surface-canvas)]">
      <header className="mb-4 flex-shrink-0 flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Arquitectura del Sistema</h1>
          <p className="text-zinc-400 text-xs">
            Mapa vivo del flujo completo de {data.app}. Los master prompts mostrados son los que el backend
            usa <strong className="text-emerald-400">en este momento</strong>.
          </p>
        </div>
        
        {/* Motor Híbrido Compacto */}
        <div className="flex gap-4 items-center bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-xs">
          <div className="flex items-center gap-1 font-bold text-white">
            <Cpu size={16} className="text-emerald-400" /> {data.engine.name}
          </div>
          <div className="border-l border-zinc-700 pl-4">
            <span className="text-sky-400 font-bold uppercase tracking-wide text-[9px] block">Nube</span>
            <code className="text-zinc-200">{data.engine.cloud}</code>
          </div>
          <div className="border-l border-zinc-700 pl-4">
            <span className="text-amber-400 font-bold uppercase tracking-wide text-[9px] block">Local</span>
            <code className="text-zinc-200">{data.engine.local}</code>
          </div>
        </div>
      </header>

      {/* Master-Detail-Subdetail Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Column 1: Navigation (Modules) */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
           <div className="mb-1 pl-2">
              <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Core Engine</h3>
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
                    className={`w-full flex items-center gap-3 p-4 text-left outline-none border rounded-xl transition-all duration-300 ${isActive ? 'bg-zinc-900/80 border-emerald-500/30 shadow-lg' : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'}`}
                 >
                    <span className={`flex items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-sm transition-colors ${isActive ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-300' : 'bg-zinc-800 border border-zinc-700 text-zinc-400'}`}>
                      {step.step}
                    </span>
                    <span className={isActive ? "text-emerald-400" : "text-zinc-500"}>{STEP_ICONS[step.id]}</span>
                    <h2 className={`text-sm font-bold tracking-wide ${isActive ? 'text-white' : 'text-zinc-400'}`}>{step.name}</h2>
                    <CaretRight size={16} className={`ml-auto transition-transform duration-300 ${isActive ? 'text-emerald-400' : 'text-zinc-600 opacity-0'}`} />
                 </button>
              )
           })}

           {data.apps && data.apps.length > 0 && (
              <>
                 <div className="mt-4 mb-2 pl-2">
                    <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">OS Apps</h3>
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
                          className={`w-full flex items-center gap-3 p-4 text-left outline-none border rounded-xl transition-all duration-300 ${isActive ? 'bg-sky-900/30 border-sky-500/30 shadow-lg' : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'}`}
                       >
                          <span className={isActive ? "text-sky-400" : "text-zinc-500"}>{STEP_ICONS[app.id]}</span>
                          <h2 className={`text-sm font-bold tracking-wide ${isActive ? 'text-white' : 'text-zinc-400'}`}>{app.name}</h2>
                          <CaretRight size={16} className={`ml-auto transition-transform duration-300 ${isActive ? 'text-sky-400' : 'text-zinc-600 opacity-0'}`} />
                       </button>
                    )
                 })}
              </>
           )}
        </div>

        {/* Column 2: Module Details & Prompts List */}
        <div className="w-[380px] flex-shrink-0 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden relative shadow-lg">
           {(() => {
              const activeModule = data.flow.find(s => s.id === activeStepId) || data.apps?.find(a => a.id === activeStepId);
              const isApp = data.apps?.some(a => a.id === activeStepId);
              
              if (!activeModule) {
                 return (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-6 text-center">
                       <Compass size={48} weight="light" className="mb-4 opacity-20" />
                       <p className="text-sm font-medium">Selecciona un módulo de la izquierda para ver sus detalles y agentes.</p>
                    </div>
                 );
              }
              
              return (
                 <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/30">
                       <h2 className={`text-lg font-bold mb-3 ${isApp ? 'text-sky-300' : 'text-emerald-300'}`}>{activeModule.name}</h2>
                       <p className="text-sm text-zinc-300 leading-relaxed">{activeModule.what}</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                       <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3 pl-2">
                         Master Prompts ({activeModule.prompts.length})
                       </div>
                       <div className="flex flex-col gap-2">
                          {activeModule.prompts.map(p => {
                             const isSelected = selectedPrompt?.key === p.key;
                             const colorTheme = isApp ? 
                               { bg: '#38bdf8', text: '#082f49', border: '#7dd3fc' } : 
                               { bg: '#10b981', text: '#022c22', border: '#34d399' };
                             
                             return (
                                <button 
                                   key={p.key}
                                   onClick={() => setSelectedPrompt(p)}
                                   style={{ 
                                      backgroundColor: isSelected ? colorTheme.bg : 'rgba(39, 39, 42, 0.5)',
                                      color: isSelected ? colorTheme.text : '#ffffff',
                                      borderColor: isSelected ? colorTheme.border : '#3f3f46'
                                   }}
                                   className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all outline-none border hover:brightness-110 font-bold shadow-sm"
                                >
                                   <code className="text-sm font-mono truncate flex-1">{p.key}</code>
                                   <CaretRight size={14} style={{ opacity: isSelected ? 1 : 0.3, color: isSelected ? colorTheme.text : '#ffffff' }} />
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
        <div className="flex-1 min-w-0 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">
           {selectedPrompt ? (
              <>
                 <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                       <code className="text-emerald-300 text-sm font-mono font-bold bg-emerald-950/50 px-2 py-1 rounded border border-emerald-900/50">{selectedPrompt.key}</code>
                       <span className="text-zinc-500 text-xs font-mono hidden xl:inline-block">{selectedPrompt.used_at}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs text-zinc-500 font-mono hidden sm:inline-block">{selectedPrompt.text.length} caracteres</span>
                       <button
                          onClick={() => handleCopy(selectedPrompt.text)}
                          className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 transition-colors"
                       >
                          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          {copied ? 'Copiado' : 'Copiar'}
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
                    <div className="flex-1 p-6">
                       <pre className="text-base md:text-lg text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed drop-shadow-sm">
                          {selectedPrompt.text}
                       </pre>
                    </div>
                    
                    {/* Explicación Inferior */}
                    {selectedPrompt.explanation && (
                       <div className="p-6 bg-zinc-900/90 border-t border-zinc-800 flex items-start gap-4">
                          <button
                             onClick={() => handleSpeech(selectedPrompt.explanation!)}
                             className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                               speaking ? 'bg-sky-500 text-white animate-pulse' : 'bg-zinc-800 text-sky-400 hover:bg-zinc-700'
                             }`}
                             title={speaking ? "Detener" : "Escuchar explicación"}
                          >
                             <SpeakerHigh size={20} weight={speaking ? "fill" : "regular"} />
                          </button>
                          <div>
                             <h3 className="text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">Explicación del Prompt</h3>
                             <p className="text-zinc-300 text-sm leading-relaxed font-sans">
                               {selectedPrompt.explanation}
                             </p>
                          </div>
                       </div>
                    )}
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/30">
                 <Brain size={64} weight="light" className="mb-6 opacity-20" />
                 <p className="text-sm font-medium">Selecciona un Master Prompt para inspeccionar su código fuente.</p>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}
