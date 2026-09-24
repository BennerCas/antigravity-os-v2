import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL } from '../../lib/api';

export const SwarmOrchestrationPanel: React.FC = () => {
  const { activityLogs, addActivityLog, zone2ActiveTab, setZone2ActiveTab, phase1Interview } = useStudioStore();

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
            <Target size={16} /> OKR's & Checklist
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase1')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            Fase 1: Triage
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase2')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase2' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            Fase 2: Extracción
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase3')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase3' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
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

        {/* Content Area (Invisible Scroll) */}
        <div id="zone2-content" className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {zone2ActiveTab === 'okr' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-light text-[var(--text-primary)] mb-2">Objetivo Principal</h2>
                <div className="p-4 rounded-xl border border-[var(--stroke-subtle)] bg-[var(--surface-card)]/50 text-[var(--text-primary)]">
                  Esperando definición de intención por parte del usuario...
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-light text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <ListChecks size={24} className="text-cyan-400" /> Checklist de Enjambres
                </h2>
                <div className="space-y-3">
                  {/* Fase 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-canvas)]/40">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${phase1Interview ? 'border-amber-400 bg-amber-500/20' : 'border-zinc-600 bg-[var(--surface-card)]'}`}>
                      {phase1Interview && <Clock size={12} className="text-amber-400" />}
                    </div>
                    <span className={`text-sm font-medium ${phase1Interview ? 'text-amber-400' : 'text-zinc-400'}`}>
                      Fase 1: Entrevista de Triage {phase1Interview ? '— En progreso' : 'completada'}
                    </span>
                  </div>
                  {/* Fase 2 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-canvas)]/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-[var(--surface-card)] shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Fase 2: Cuestionario Técnico resuelto</span>
                  </div>
                  {/* Fase 3 */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-canvas)]/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-[var(--surface-card)] shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Fase 3: Arquitectura y Nodos validados</span>
                  </div>
                  {/* Aprobación Final */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-canvas)]/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-[var(--surface-card)] shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Aprobación Final y Ensamblaje (Match & Fuse)</span>
                  </div>
                </div>
              </div>
            </div>
          )}


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
              ) : (
                <div className="text-center pt-20">
                  <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
                  <h2 className="text-xl text-zinc-500 font-light">Fase 1 inactiva</h2>
                  <p className="text-sm text-zinc-600">AureliOS está esperando tu petición en el chat para desplegar al Enjambre 1.</p>
                </div>
              )}
            </div>
          )}

          {zone2ActiveTab === 'phase2' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center pt-20">
              <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
              <h2 className="text-xl text-zinc-500 font-light">Fase 2 inactiva</h2>
              <p className="text-sm text-zinc-600">Requiere la aprobación de la Fase 1 para generar el Cuestionario Avanzado.</p>
            </div>
          )}

          {zone2ActiveTab === 'phase3' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center pt-20">
              <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
              <h2 className="text-xl text-zinc-500 font-light">Fase 3 inactiva</h2>
              <p className="text-sm text-zinc-600">Requiere el Contrato I/O del Enjambre 1 para diseñar la Arquitectura (Nodos y Animaciones).</p>
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
      `}} />
    </div>
  );
};
