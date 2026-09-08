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
          <p className="text-[#8A8A8A] text-xs">
            Mapa vivo del flujo completo de {data.app}. Los master prompts mostrados son los que el backend
            usa <strong className="text-[#7B9C7F]">en este momento</strong>.
          </p>
        </div>
        
        {/* Motor Híbrido Compacto */}
        <div className="flex gap-4 items-center bg-[#151515] border border-[#2A2A2A] rounded-xl px-4 py-3 text-xs">
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
      </header>

      {/* Master-Detail-Subdetail Layout */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Column 1: Navigation (Modules) */}
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
           <div className="mb-1 pl-2">
              <h3 className="text-[10px] font-bold text-[#7B9C7F] uppercase tracking-widest">Core Engine</h3>
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
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full font-mono font-bold text-sm transition-colors ${isActive ? 'bg-[#0A1C0D] border border-[#174A1F] text-[#7B9C7F]' : 'bg-[#151515] border border-[#2A2A2A] text-[#8A8A8A]'}`}>
                      {step.step}
                    </span>
                    <span className={isActive ? "text-[#7B9C7F]" : "text-[#8A8A8A]"}>{STEP_ICONS[step.id]}</span>
                    <h2 className={`text-sm font-bold tracking-wide ${isActive ? 'text-[#7B9C7F]' : 'text-[#8A8A8A]'}`}>{step.name}</h2>
                    <CaretRight size={16} className={`ml-auto transition-transform duration-300 ${isActive ? 'text-[#7B9C7F]' : 'text-[#2A2A2A] opacity-0'}`} />
                 </button>
              )
           })}

           {data.apps && data.apps.length > 0 && (
              <>
                 <div className="mt-4 mb-2 pl-2">
                    <h3 className="text-[10px] font-bold text-[#7B9C7F] uppercase tracking-widest">OS Apps</h3>
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
                          <h2 className={`text-sm font-bold tracking-wide ${isActive ? 'text-[#7B9C7F]' : 'text-[#8A8A8A]'}`}>{app.name}</h2>
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
                       <h2 className={`text-lg font-bold mb-3 text-[#7B9C7F]`}>{activeModule.name}</h2>
                       <p className="text-sm text-[#FFFFFF] leading-relaxed">{activeModule.what}</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                       <div className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-bold mb-3 pl-2">
                         Master Prompts ({activeModule.prompts.length})
                       </div>
                       <div className="flex flex-col gap-2">
                          {activeModule.prompts.map(p => {
                             const isSelected = selectedPrompt?.key === p.key;
                              
                              return (
                                 <button 
                                      key={p.key}
                                      onClick={() => setSelectedPrompt(p)}
                                      className={`w-full flex items-center gap-3 p-3 text-left transition-all outline-none hover:brightness-110 font-bold shadow-sm ${isSelected ? 'nav-item-active shadow-[0_0_10px_rgba(23,74,31,0.5)]' : 'nav-item-inactive'}`}
                                   >
                                      <code className="text-sm font-mono truncate flex-1">{p.key}</code>
                                      <CaretRight size={14} style={{ opacity: isSelected ? 1 : 0.3, color: isSelected ? '#7B9C7F' : '#ffffff' }} />
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
                       <span className="text-[#8A8A8A] text-xs font-mono hidden xl:inline-block">{selectedPrompt.used_at}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs text-[#8A8A8A] font-mono hidden sm:inline-block">{selectedPrompt.text.length} caracteres</span>
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
                       <pre className="text-base md:text-lg text-[#FFFFFF] whitespace-pre-wrap font-mono leading-relaxed drop-shadow-sm">
                          {selectedPrompt.text}
                       </pre>
                    </div>
                    
                    {/* Explicación Inferior */}
                    {selectedPrompt.explanation && (
                       <div className="p-6 bg-[#0A1C0D] border-t border-[#174A1F] flex items-start gap-4">
                          <button
                             onClick={() => handleSpeech(selectedPrompt.explanation!)}
                             className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                               speaking ? 'bg-[#0A1C0D] text-[#7B9C7F] animate-pulse' : 'bg-[#151515] text-[#8A8A8A] hover:bg-zinc-700'
                             }`}
                             title={speaking ? "Detener" : "Escuchar explicación"}
                          >
                             <SpeakerHigh size={20} weight={speaking ? "fill" : "regular"} />
                          </button>
                          <div>
                             <h3 className="text-[#7B9C7F] text-xs font-bold uppercase tracking-wider mb-1">Explicación del Prompt</h3>
                             <p className="text-[#FFFFFF] text-sm leading-relaxed font-sans">
                               {selectedPrompt.explanation}
                             </p>
                          </div>
                       </div>
                    )}
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
    </div>
  );
}
