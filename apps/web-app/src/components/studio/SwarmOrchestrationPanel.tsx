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
    phase2Content, phase3Content,
  } = useStudioStore();

  React.useEffect(() => {
    const ws = new WebSocket(WS_STUDIO_ACTIVITY_URL);

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

    return () => {
      ws.close();
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
          <div className="ml-auto flex items-center gap-1 shrink-0">
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
        <div id="zone2-content" className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* ── OKR & Checklist ── */}
          {zone2ActiveTab === 'okr' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-light text-[var(--text-primary)] mb-2">Objetivo Principal</h2>
                <div className="p-4 rounded-xl border border-[var(--stroke-subtle)] bg-[var(--surface-card)]/50 text-[var(--text-primary)]">
                  {phase1Complete
                    ? 'Requerimiento capturado. Procesando arquitectura...'
                    : 'Esperando definición de intención por parte del usuario...'}
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
          )}

          {/* ── Fase 1: Triage ── */}
          {zone2ActiveTab === 'phase1' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4">
              {phase1Interview ? (
                <div className="text-left space-y-4">
                  <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                    <Brain size={24} weight="duotone" className="text-blue-400" /> Entrevista de Triage
                  </h2>
                  <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-[var(--text-primary)] text-sm leading-relaxed markdown-body">
                    <ReactMarkdown>{phase1Interview}</ReactMarkdown>
                  </div>
                  <div className="mt-4">
                    <textarea 
                      id="phase1-input"
                      className="w-full h-32 p-4 bg-[var(--surface-canvas)] border border-[var(--stroke-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Responde a las preguntas de AureliOS aquí para avanzar a la Extracción..."
                    />
                    <button 
                      onClick={() => {
                        const val = (document.getElementById('phase1-input') as HTMLTextAreaElement).value;
                        if (!val.trim()) return;
                        const trigger = useStudioStore.getState().triggerChatSend;
                        if (trigger) {
                          useStudioStore.getState().setPhase1Interview(null);
                          trigger(val);
                        }
                      }}
                      className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors ml-auto block"
                    >
                      Enviar Respuestas
                    </button>
                  </div>
                </div>
              ) : phase1Complete ? (
                <div className="text-center pt-20">
                  <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" weight="duotone" />
                  <h2 className="text-xl text-emerald-400 font-light">Fase 1 completada</h2>
                  <p className="text-sm text-zinc-500 mt-2">El Enjambre Radar aprobó tu intención. Continúa en Fase 2.</p>
                </div>
              ) : (
                <div className="text-center pt-20">
                  <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
                  <h2 className="text-xl text-zinc-500 font-light">Fase 1 inactiva</h2>
                  <p className="text-sm text-zinc-600">AureliOS está esperando tu petición en el chat para desplegar al Enjambre 1.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Fase 2: Extracción ── */}
          {zone2ActiveTab === 'phase2' && (
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
          )}

          {/* ── Fase 3: Blueprint ── */}
          {zone2ActiveTab === 'phase3' && (
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
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .markdown-body p:not(:last-child) { margin-bottom: 0.75rem; }
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

