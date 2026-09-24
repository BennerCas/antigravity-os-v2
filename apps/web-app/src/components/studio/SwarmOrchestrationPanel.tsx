import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash, CheckSquare, Square } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL } from '../../lib/api';

export const SwarmOrchestrationPanel: React.FC = () => {
  const {
    activityLogs, addActivityLog,
    zone2ActiveTab, setZone2ActiveTab,
    phase1Interview,
    phase1Complete, phase2Complete, phase3Complete,
    phase2Content, phase3Content, triageSummary
  } = useStudioStore();

  const [activeModel, setActiveModel] = React.useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');

  const activeAgentLog = activityLogs.filter(log => log.status === 'PENDING').pop();
  const activeAgentName = activeAgentLog ? activeAgentLog.source : null;
  React.useEffect(() => {
    const handleModelChange = () => setActiveModel(localStorage.getItem('aurelios_model') || 'free.ai/auto');
    window.addEventListener('aurelios_model_changed', handleModelChange);
    return () => window.removeEventListener('aurelios_model_changed', handleModelChange);
  }, []);

  React.useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(WS_STUDIO_ACTIVITY_URL);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ACTIVITY_LOG' && data.log) {
            addActivityLog(data.log);
          } else if (data.type === 'STATE_UPDATE' && data.tab) {
            setZone2ActiveTab(data.tab);
          }
        } catch (e) {
          console.error("Error parsing WS message", e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [addActivityLog, setZone2ActiveTab]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'REJECTED': return <XCircle size={16} className="text-red-400" />;
      case 'PENDING': return <Clock size={16} className="text-amber-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  /** Render a checklist item with dynamic state */
  const ChecklistItem = ({
    done, inProgress, label,
  }: { done: boolean; inProgress: boolean; label: string }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-canvas)]/40">
      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
        done        ? 'border-emerald-400 bg-emerald-500/20' :
        inProgress  ? 'border-amber-400  bg-amber-500/20'   :
                      'border-zinc-600   bg-[var(--surface-card)]'
      }`}>
        {done       && <CheckSquare size={12} className="text-emerald-400" weight="fill" />}
        {inProgress && <Clock       size={12} className="text-amber-400" />}
        {!done && !inProgress && <Square size={12} className="text-zinc-600" />}
      </div>
      <span className={`text-sm font-medium ${
        done        ? 'text-emerald-400 line-through opacity-70' :
        inProgress  ? 'text-amber-400' :
                      'text-zinc-500'
      }`}>
        {label}
      </span>
      {done && <CheckCircle size={14} className="text-emerald-400 ml-auto shrink-0" weight="fill" />}
    </div>
  );

  return (
    <div className="w-full h-full flex bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      
      {/* ZONE 1: Activity Log */}
      <div className="flex-1 min-w-0 h-full border-r border-[var(--stroke-subtle)] flex flex-col bg-[var(--surface-canvas)]">
        <div className="flex items-center h-16 px-4 border-b border-[var(--stroke-subtle)] shrink-0">
          <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <Robot size={16} weight="duotone" className="text-cyan-400" /> Activity Log
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
          {activityLogs.map(log => (
            <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-[var(--stroke-subtle)]/50">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="font-bold text-[var(--text-primary)]">[{log.source}]</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">{getStatusIcon(log.status)}</div>
                <span className="leading-relaxed text-[var(--text-primary)]">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE 2: Results Panel */}
      <div className="flex-[2] min-w-0 h-full flex flex-col bg-[var(--surface-canvas)]">
        
        {/* Sandwich Menu */}
        <div className="flex items-center h-16 px-4 gap-2 border-b border-[var(--stroke-subtle)] shrink-0 bg-[var(--surface-canvas)]">
          <button 
            onClick={() => setZone2ActiveTab('okr')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'okr' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            <Target size={16} /> OKR's &amp; Checklist
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase1')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            {phase1Complete ? <CheckCircle size={14} className="text-emerald-400" weight="fill" /> : null}
            Fase 1: Triage
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase2')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase2' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            {phase2Complete ? <CheckCircle size={14} className="text-emerald-400" weight="fill" /> : null}
            Fase 2: Extracción
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase3')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase3' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            {phase3Complete ? <CheckCircle size={14} className="text-emerald-400" weight="fill" /> : null}
            Fase 3: Blueprint
          </button>

          {/* Actions — pushed to the right */}
          <div className="ml-auto flex items-center gap-3 shrink-0">

            
            {/* TTS: leer el contenido visible */}
            <button
              title="Leer contenido en voz alta"
              onClick={() => {
                const contentEl = document.getElementById('zone2-content');
                const text = contentEl?.innerText || '';
                if (!text.trim()) return;
                window.speechSynthesis.cancel();
                const utt = new SpeechSynthesisUtterance(text);
                const voices = window.speechSynthesis.getVoices();
                const esVoice = voices.find(v => v.lang.startsWith('es'));
                if (esVoice) utt.voice = esVoice;
                utt.rate = 1.1;
                window.speechSynthesis.speak(utt);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              <SpeakerHigh size={16} />
            </button>
            {/* Limpiar Zone 2 */}
            <button
              title="Limpiar Espacio 2"
              onClick={() => {
                useStudioStore.getState().setPhase1Interview(null);
                useStudioStore.getState().setZone2ActiveTab('okr');
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div id="zone2-content" className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* ── OKR & Checklist ── */}
          <div className={zone2ActiveTab === 'okr' ? 'flex-1 overflow-y-auto p-8 custom-scrollbar block' : 'hidden'}>
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-light text-[var(--text-primary)] mb-2">Objetivo Principal</h2>
                <div className="p-4 rounded-xl border border-[var(--stroke-subtle)] bg-[var(--surface-card)]/50 text-[var(--text-primary)]">
                  {phase1Complete && triageSummary ? (
                    <div className="markdown-body text-sm text-emerald-400">
                      <ReactMarkdown>{triageSummary}</ReactMarkdown>
                    </div>
                  ) : phase1Complete ? (
                    'Requerimiento capturado. Procesando arquitectura...'
                  ) : (
                    'Esperando definición de intención por parte del usuario...'
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-light text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <ListChecks size={24} className="text-cyan-400" /> Checklist de Enjambres
                </h2>
                <div className="space-y-3">
                  <ChecklistItem
                    done={phase1Complete}
                    inProgress={!!phase1Interview && !phase1Complete}
                    label="Fase 1: Entrevista de Triage"
                  />
                  <ChecklistItem
                    done={phase2Complete}
                    inProgress={phase1Complete && !phase2Complete}
                    label="Fase 2: Cuestionario Técnico resuelto"
                  />
                  <ChecklistItem
                    done={phase3Complete}
                    inProgress={phase2Complete && !phase3Complete}
                    label="Fase 3: Arquitectura y Nodos validados"
                  />
                  <ChecklistItem
                    done={phase3Complete}
                    inProgress={false}
                    label="Aprobación Final y Ensamblaje (Match & Fuse)"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Fase 1: Triage ── */}
          <div className={zone2ActiveTab === 'phase1' ? 'flex-1 flex flex-col w-full h-full relative' : 'hidden'}>
            {phase1Interview ? (
              <>
                {/* Header fijo */}
                <div className="shrink-0 pt-8 pb-4 px-8 w-full">
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                      <Brain size={24} weight="duotone" className="text-blue-400" /> Entrevista de Triage
                    </h2>
                  </div>
                </div>

                {/* Contenido scrolleable (Sección 2) con scroll invisible (scrollbar-none) */}
                <div className="flex-1 overflow-y-auto px-8 pb-4 scrollbar-none custom-scrollbar-hide">
                  <div className="max-w-3xl mx-auto p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-[var(--text-primary)] text-sm leading-relaxed markdown-body animate-fade-in">
                    {phase1Interview.split('===USER_ANSWER_START===').map((chunk1, i) => {
                      if (i === 0) return <ReactMarkdown key={i}>{chunk1}</ReactMarkdown>;
                      const parts = chunk1.split('===USER_ANSWER_END===');
                      return (
                        <React.Fragment key={i}>
                          <div className="user-answer-block font-medium my-4 pl-4 border-l-2 border-emerald-400/50 bg-emerald-400/5 p-3 rounded-r-lg">
                            <ReactMarkdown>{parts[0]}</ReactMarkdown>
                          </div>
                          {parts[1] && <ReactMarkdown>{parts[1]}</ReactMarkdown>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Footer fijo (Sección 3) con fondo negro */}
                <div className="shrink-0 bg-black border-t border-white/5 py-6 px-8">
                  <div className="max-w-3xl mx-auto flex flex-col gap-4 animate-fade-in">
                    <textarea 
                      id="phase1-input"
                      className="w-full h-24 p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 resize-none scrollbar-none custom-scrollbar-hide"
                      placeholder="Responde a las preguntas de AureliOS aquí para avanzar a la Extracción..."
                    />
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={async () => {
                          if (!phase1Interview) return;
                          const textarea = document.getElementById('phase1-input') as HTMLTextAreaElement;
                          const prevValue = textarea.value;
                          textarea.value = "Generando respuestas con GenAI... por favor espera.";
                          textarea.disabled = true;
                          
                          try {
                            const prompt = `Actúa como el usuario experto o product owner. Responde a la siguiente entrevista de Triage de manera clara, creativa y directa, inventando los requerimientos lógicos que falten para que el proyecto sea viable.\n\nREGLAS ESTRICTAS:\n1. Responde OBLIGATORIAMENTE en ESPAÑOL.\n2. PROHIBIDO usar formato Markdown (nada de asteriscos, negritas, viñetas, hashes o caracteres especiales).\n3. Escribe en texto plano continuo, como una persona real escribiendo en un chat.\n\nENTREVISTA A RESPONDER:\n${phase1Interview}`;
                            
                            const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1';
                            const modelToUse = localStorage.getItem('aurelios_model') || 'free.ai/auto';
                            const res = await fetch(`${API_URL}/studio/chat`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message: prompt, model: modelToUse })
                            });
                            
                            const data = await res.json();
                            if (res.ok) {
                              textarea.value = data.response;
                            } else {
                              textarea.value = "Error al generar respuestas: " + (data.detail || "Error desconocido");
                              setTimeout(() => { textarea.value = prevValue; }, 3000);
                            }
                          } catch (e: any) {
                            textarea.value = "Error de red al conectar con GenAI.";
                            setTimeout(() => { textarea.value = prevValue; }, 3000);
                          } finally {
                            textarea.disabled = false;
                          }
                        }}
                        className="px-6 py-2.5 bg-purple-600/10 border border-purple-500/30 hover:bg-purple-600/20 text-purple-300 rounded-lg font-bold transition-colors flex items-center gap-2"
                      >
                        <Robot size={20} weight="duotone" />
                        GenAI
                      </button>
                      <button 
                        onClick={() => {
                          const val = (document.getElementById('phase1-input') as HTMLTextAreaElement).value;
                          if (!val.trim() || val.includes("Generando respuestas con GenAI")) return;
                          const trigger = useStudioStore.getState().triggerChatSend;
                          if (trigger) {
                            const current = useStudioStore.getState().phase1Interview || '';
                            useStudioStore.getState().setPhase1Interview(current + `\n\n---\n**💡 Tus respuestas enviadas:**\n\n===USER_ANSWER_START===\n${val}\n===USER_ANSWER_END===\n\n---\n*AureliOS está analizando tus respuestas...*`);
                            (document.getElementById('phase1-input') as HTMLTextAreaElement).value = '';
                            trigger(val);
                          }
                        }}
                        className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold transition-colors"
                      >
                        Enviar Respuestas
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : phase1Complete ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black h-full">
                <CheckCircle size={56} className="mx-auto text-emerald-400 mb-6" weight="duotone" />
                <h2 className="text-2xl text-emerald-400 font-bold mb-2">Fase 1 completada</h2>
                <p className="text-base text-zinc-400 mt-2 mb-8 text-center max-w-md">
                  El Enjambre Radar ha perfilado la idea con éxito. El contrato de intención está listo.
                </p>
                <button 
                  onClick={() => useStudioStore.getState().setZone2ActiveTab('phase2')}
                  className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-xl font-bold transition-colors text-lg"
                >
                  Pasar a la Fase 2
                </button>
              </div>
            ) : activeAgentName ? (
              <div className="flex-1 flex flex-col justify-center items-center p-8">
                <div className="text-center animate-pulse">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div className="relative w-full h-full bg-[var(--surface-canvas)] border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      <Robot size={32} className="text-blue-400 animate-pulse" weight="duotone" />
                    </div>
                  </div>
                  <h2 className="text-2xl text-blue-400 font-bold tracking-wide">{activeAgentName}</h2>
                  <p className="text-sm text-blue-400/70 mt-2 font-mono uppercase tracking-widest animate-pulse">Analizando intención...</p>
                </div>
              </div>
              ) : (
              <div className="flex-1 flex flex-col justify-center items-center p-8 h-full">
                <div className="text-center pt-20">
                  <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
                  <h2 className="text-xl text-zinc-500 font-light">Fase 1 inactiva</h2>
                  <p className="text-sm text-zinc-600">AureliOS está esperando tu petición en el chat para desplegar al Enjambre 1.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Fase 2: Extracción ── */}
          <div className={zone2ActiveTab === 'phase2' ? 'block' : 'hidden'}>
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4">
              {phase2Content ? (
                <div className="text-left space-y-4">
                  <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                    {phase2Complete
                      ? <CheckCircle size={24} weight="duotone" className="text-emerald-400" />
                      : <Clock size={24} weight="duotone" className="text-amber-400" />}
                    {phase2Complete ? 'Contrato I/O — Arquitectura Aprobada' : 'Enjambre Inquisidor — En progreso'}
                  </h2>
                  <div className={`p-5 rounded-xl border text-[var(--text-primary)] text-sm leading-relaxed markdown-body ${
                    phase2Complete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-purple-500/30 bg-purple-500/5'
                  }`}>
                    <ReactMarkdown>{phase2Content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-20">
                  <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
                  <h2 className="text-xl text-zinc-500 font-light">Fase 2 inactiva</h2>
                  <p className="text-sm text-zinc-600">Requiere la aprobación de la Fase 1 para generar el Cuestionario Avanzado.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Fase 3: Blueprint ── */}
          <div className={zone2ActiveTab === 'phase3' ? 'block' : 'hidden'}>
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4">
              {phase3Content ? (
                <div className="text-left space-y-4">
                  <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                    <CheckCircle size={24} weight="duotone" className="text-emerald-400" />
                    Blueprint — Arquitectura Final
                  </h2>
                  <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-[var(--text-primary)] text-sm leading-relaxed markdown-body">
                    <ReactMarkdown>{phase3Content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-20">
                  <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
                  <h2 className="text-xl text-zinc-500 font-light">Fase 3 inactiva</h2>
                  <p className="text-sm text-zinc-600">Requiere el Contrato I/O del Enjambre 1 para diseñar la Arquitectura (Nodos y Animaciones).</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .markdown-body p:not(:last-child) { margin-bottom: 0.75rem; }
        .user-answer-block, .user-answer-block * { color: #34d399 !important; }
        .markdown-body ul { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-body ol { list-style-type: decimal; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-body li { margin-bottom: 0.25rem; }
        .markdown-body h1,.markdown-body h2,.markdown-body h3 { font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-body strong { font-weight: 700; }
        .markdown-body code { background: rgba(0,0,0,0.2); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; }
        .markdown-body pre { background: rgba(0,0,0,0.25); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.75rem; }
      `}} />
    </div>
  );
};

