import { useTTSStore } from '../../lib/ttsStore';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash, CheckSquare, Square, Lightning, Crosshair, RocketLaunch, Checks, TrendUp, PaintBrush, Database, Globe, TerminalWindow, File, UploadSimple, CodeBlock, HardDrives, Scan, Network, AppWindow, Layout, ClockCounterClockwise, Microphone, Graph } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL } from '../../lib/api';
import { CanvasTabs } from '../../pages/AgentOSStudio';

const SwarmOrchestrationPanel: React.FC = () => {
  const {
    activityLogs, addActivityLog,
    zone2ActiveTab, setZone2ActiveTab,
    phase1Interview, dynamicChecklist,
    phase1Complete, phase2Complete, phase3Complete,
    phase2Content, phase3Content, triageSummary, quantumPhase
  } = useStudioStore();

  const { historyItems, loadHistoryItem, deleteHistoryItem, currentHistoryId } = useHistoryStore();

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isEditingObjective, setIsEditingObjective] = React.useState(false);
  const [editedObjective, setEditedObjective] = React.useState(triageSummary || '');
  const [activeModel, setActiveModel] = React.useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [explainProgress, setExplainProgress] = React.useState<number | null>(null);
  const [explainText, setExplainText] = React.useState<string | null>(null);
  const [isRegeneratingObjective, setIsRegeneratingObjective] = React.useState(false);
  const [isModifyingPhase2, setIsModifyingPhase2] = React.useState(false);
  const [isPromptChecked, setIsPromptChecked] = React.useState(false);

  React.useEffect(() => {
    const handleModelChange = () => setActiveModel(localStorage.getItem('aurelios_model') || 'free.ai/auto');
    window.addEventListener('aurelios_model_changed', handleModelChange);
    return () => window.removeEventListener('aurelios_model_changed', handleModelChange);
  }, []);

  React.useEffect(() => {
    // Auto-corrección si el objetivo guardado se contaminó con mensajes de error
    if (triageSummary && (triageSummary.includes('verifica tu conexión') || triageSummary.includes('Failed to fetch') || triageSummary.includes('[ERROR]'))) {
      const fixedObjective = "Crear un flujo para automatizar la creación de contenido para LinkedIn.";
      useStudioStore.getState().setTriageSummary(fixedObjective);
      setEditedObjective(fixedObjective);
    } else {
      setEditedObjective(triageSummary || '');
    }
  }, [triageSummary]);

  const generateExplanation = async () => {
    if (!phase3Content || !triageSummary) return;
    setExplainProgress(0);
    setExplainText(null);
    try {
      const modelName = activeModel.includes('hermes') ? 'hermes3:8b' : 'qwen2.5:3b';
      const cleanBlueprint = phase3Content.replace(/```/g, '').substring(0, 2000);
      const prompt = `Actúa como AureliOS, el Arquitecto del Sistema. 
OBJETIVO DEL USUARIO: "${triageSummary}"
BLUEPRINT DE AGENTES:
${cleanBlueprint}

Analizando el Blueprint anterior, redacta un discurso robusto, cohesivo, profundo y entendible (2 a 3 párrafos fluidos, sin usar listas ni viñetas) explicando de manera detallada cómo este enjambre de agentes que has diseñado logrará cumplir el objetivo del usuario. Habla con confianza técnica y directa. Cero clichés.`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: true
        })
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullText = '';
      let tokensCount = 0;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split('\n').filter(Boolean);
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              fullText += data.response;
              tokensCount++;
              setExplainProgress(Math.min(100, Math.round((tokensCount / 250) * 100)));
            } catch (e) {}
          }
        }
      }
      setExplainText(fullText);
      setExplainProgress(100);
    } catch (e) {
      console.error(e);
      setExplainProgress(null);
    }
  };

  React.useEffect(() => {
    if (phase3Complete && explainProgress === null && !explainText) {
      generateExplanation();
    }
  }, [phase3Complete, phase3Content]);

  const handleExplainFlow = () => {
    if (!explainText) return;
    const tts = useTTSStore.getState();
    if (tts.isActive && tts.currentSection === 'AureliOS Explicación') {
      tts.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      tts.play(explainText, 'AureliOS Explicación');
      setTimeout(() => setIsSpeaking(false), 5000); // Fallback UI state
    }
  };

  const handleRegenerateObjective = async () => {
    if (!triageSummary || isRegeneratingObjective) return;
    setIsRegeneratingObjective(true);
    try {
      const modelName = activeModel.includes('hermes') ? 'hermes3:8b' : 'qwen2.5:3b';
      const prompt = `Actúa como AureliOS, Arquitecto de Sistemas. 
Tienes el siguiente objetivo de usuario: "${triageSummary}"
Reescribe y mejora este objetivo de manera profesional, clara y directa en una sola oración concisa. Debe ser accionable y técnico, ideal para dárselo a un enjambre de agentes de IA. Solo responde con el objetivo mejorado, sin preámbulos, sin comillas y sin explicaciones adicionales.`;
      
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false
        })
      });
      const data = await res.json();
      const newObj = data.response.trim().replace(/^"|"$/g, '');
      
      useStudioStore.getState().setTriageSummary(newObj);
      setEditedObjective(newObj);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegeneratingObjective(false);
    }
  };

  const handleSaveObjective = () => {
    useStudioStore.getState().setTriageSummary(editedObjective);
    setIsEditingObjective(false);
  };

  const activeAgentLog = activityLogs.filter(log => log.status === 'PENDING').pop();
  const activeAgentName = activeAgentLog ? activeAgentLog.source : null;

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
                    } else if (data.type === 'UPDATE_CHECKLIST' && data.payload) {
            useStudioStore.getState().updateChecklistTask(data.payload.taskId, data.payload.status);
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
      case 'FREECHAT': return <Brain size={16} weight="duotone" className="text-cyan-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };



  return (
    <div className="w-full h-full flex bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      
      {/* ZONE 2: Results Panel */}
      <div className="flex-1 min-w-0 h-full flex flex-col bg-[var(--surface-canvas)]">
        {false ? null : (
          <>
            {/* Sandwich Menu */}
            <div className="flex items-center h-16 px-4 gap-2 border-b border-[var(--stroke-subtle)] shrink-0 bg-[var(--surface-canvas)]">
          <button 
            onClick={() => setZone2ActiveTab('okr')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'okr' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            <Target size={16} /> OKR's &amp; Checklist
          </button>
          
          <button 
              onClick={() => setZone2ActiveTab('infinityboard')}
              className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'infinityboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
            >
              <Graph size={16} /> Logos
            </button>
            <button 
              onClick={() => setZone2ActiveTab('blueprint')}
              className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'blueprint' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
            >
              <File size={16} /> Blueprint
            </button>
            <button 
            onClick={() => setZone2ActiveTab('history')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'history' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-[var(--text-primary)]'}`}
          >
            <ClockCounterClockwise size={16} /> Historial
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
                useTTSStore.getState().play(text, 'Resultados de Fase');
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
          {/* ── OKR & Checklist ── */}
          <div className={zone2ActiveTab === 'okr' ? 'flex-1 flex flex-col p-8 md:p-10 relative overflow-hidden' : 'hidden'}>
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Crosshair size={300} weight="thin" />
            </div>

            <div className="max-w-4xl mx-auto w-full h-full flex flex-col animate-fade-in relative z-10 gap-8">
              
              {/* Header Progress (Fixed at top) */}
              <div className="shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-3">
                    <Target size={28} style={{ color: 'var(--theme-border)' }} weight="duotone" />
                    Radar de Arquitectura
                  </h2>
                  <div className="text-right">
                    <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--theme-border)', opacity: 0.7 }}>Progreso Global</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--theme-border)' }}>
                      {dynamicChecklist.length > 0 ? Math.round((dynamicChecklist.filter(t => t.status === 'completed').length / dynamicChecklist.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--stroke-subtle)' }}>
                  <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${dynamicChecklist.length > 0 ? Math.round((dynamicChecklist.filter(t => t.status === 'completed').length / dynamicChecklist.length) * 100) : 0}%`,
                      background: 'var(--theme-border)',
                      boxShadow: '0 0 8px var(--theme-border)'
                    }}
                  />
                </div>
              </div>

              {/* Objetivo Principal (Takes remaining vertical space and scrolls internally) */}
              <div className="flex-1 min-h-0 flex flex-col relative">
                <div className="absolute -left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50 rounded-full" />
                <h3 className="shrink-0 text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendUp size={16} /> Vector de Intención
                </h3>
                
                {triageSummary ? (
                  <div className="flex-1 min-h-0 flex flex-col p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative group">
                    <div className="flex-1 min-h-0 flex items-start gap-5 overflow-hidden">
                      <div className="shrink-0 p-4 bg-emerald-500/10 rounded-2xl">
                        <Checks size={28} className="text-emerald-400" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0 h-full flex flex-col">
                        {isEditingObjective ? (
                          <div className="flex-1 flex flex-col gap-3">
                            <textarea
                              value={editedObjective}
                              onChange={(e) => setEditedObjective(e.target.value)}
                              className="flex-1 w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none custom-scrollbar"
                            />
                            <div className="shrink-0 flex justify-end gap-2">
                              <button onClick={() => { setIsEditingObjective(false); setEditedObjective(triageSummary); }} className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200">Cancelar</button>
                              <button onClick={handleSaveObjective} className="px-4 py-2 text-xs rounded-lg bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400">Guardar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0 flex flex-col">
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                              <div className="markdown-body text-[15px] leading-relaxed text-emerald-100 user-answer-block">
                                <ReactMarkdown>{triageSummary}</ReactMarkdown>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center justify-between mt-4 border-t border-emerald-500/10 pt-4">
                              <button 
                                onClick={() => setIsEditingObjective(!isEditingObjective)}
                                className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors flex items-center justify-center"
                                title="Editar Objetivo"
                              >
                                <PaintBrush size={16} />
                              </button>
                              <div className="flex items-center gap-2">
                                {phase3Complete && (
                                  <>
                                    <button 
                                      onClick={handleExplainFlow}
                                      disabled={explainProgress !== null && explainProgress < 100}
                                      className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                                        (explainProgress !== null && explainProgress < 100)
                                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-wait'
                                          : isSpeaking 
                                            ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' 
                                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                                      }`}
                                      title="Explicar cómo lograr el objetivo usando el Blueprint"
                                    >
                                      {isSpeaking ? <Square size={16} weight="fill" /> : <SpeakerHigh size={16} />}
                                      {(explainProgress !== null && explainProgress < 100) 
                                        ? `Creando ${explainProgress}%` 
                                        : isSpeaking ? "Detener" : "Explicar"}
                                    </button>
                                    
                                    <button
                                      onClick={handleRegenerateObjective}
                                      disabled={isRegeneratingObjective}
                                      className={`px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-all ${
                                        isRegeneratingObjective
                                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 animate-pulse'
                                          : 'bg-zinc-800/50 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 border border-transparent'
                                      }`}
                                      title="Regenerar y mejorar el objetivo"
                                    >
                                      <Lightning size={14} />
                                      {isRegeneratingObjective ? "Regenerando..." : "Regenerar"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                ) : (
                  <div className="flex-1 p-10 rounded-3xl border border-dashed border-zinc-700/50 bg-zinc-900/20 flex flex-col items-center justify-center text-center gap-5">
                    <div className="w-20 h-20 rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center relative">
                      {phase1Interview ? (
                        <>
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                          <TrendUp size={32} className="text-blue-400 animate-pulse" weight="duotone" />
                        </>
                      ) : (
                        <Brain size={32} className="text-zinc-600" weight="duotone" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-zinc-300 font-medium text-lg mb-2">
                        {phase1Interview ? "El Enjambre 1 está perfilando tu idea..." : "A la espera de un objetivo"}
                      </h4>
                      <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
                        {phase1Interview 
                          ? "Responde las preguntas en el chat para que AureliOS extraiga el Requerimiento Principal."
                          : "Escribe en el chat qué quieres construir. AureliOS despertará al Enjambre 1 para entrevistarte."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timeline Stepper (Fixed at bottom) */}
              <div className="shrink-0 pt-2 border-t border-[var(--stroke-subtle)]">
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ListChecks size={16} /> Secuencia de Orquestación
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dynamicChecklist?.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                        task.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5' : 
                        task.status === 'in_progress' ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 
                        task.status === 'failed' ? 'border-red-500/50 bg-red-500/10' :
                        'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 
                          task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 
                          task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {task.status === 'completed' ? <CheckCircle size={16} weight="bold" /> : 
                           task.status === 'in_progress' ? <Brain size={16} weight="duotone" /> : 
                           <ListChecks size={16} weight="bold" />}
                        </div>
                        <h4 className={`text-sm font-semibold leading-tight ${
                          task.status === 'completed' ? 'text-emerald-400' : 
                          task.status === 'in_progress' ? 'text-blue-400' : 
                          task.status === 'failed' ? 'text-red-400' :
                          'text-zinc-400'
                        }`}>
                          {task.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

                    {/* 📜 Blueprint Tab */}
          <div className={zone2ActiveTab === 'blueprint' ? 'flex-1 flex flex-col h-full bg-[var(--surface-canvas)] relative overflow-hidden' : 'hidden'}>
            <div className="shrink-0 pt-8 pb-4 px-8 border-b border-[var(--stroke-subtle)] bg-zinc-900/30">
               <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                 <File size={24} className="text-amber-400" /> Códice Técnico (Blueprint)
               </h2>
               <p className="text-sm text-zinc-400 mt-1">El documento sagrado de arquitectura generado por AureliOS.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
              {phase3Content ? (
                <div className="text-[14px] leading-relaxed markdown-body animate-fade-in text-[var(--text-primary)] max-w-4xl mx-auto">
                  <ReactMarkdown>{phase3Content}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center gap-4">
                  <File size={48} weight="duotone" className="opacity-20" />
                  <p className="text-sm max-w-md">El Códice está en blanco. AureliOS escribirá aquí la arquitectura detallada (Blueprint) una vez que el Logos haya sido definido.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Historial de Chats (Ocupa toda la vista de Zone 2) ── */}
          <div className={zone2ActiveTab === 'history' ? 'flex-1 flex flex-col h-full bg-[var(--surface-canvas)] relative overflow-hidden' : 'hidden'}>
            <div className="shrink-0 pt-8 pb-4 px-8 border-b border-[var(--stroke-subtle)] bg-zinc-900/30">
               <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                 <ClockCounterClockwise size={24} className="text-emerald-400" /> Historial de Chats
               </h2>
               <p className="text-sm text-zinc-400 mt-1">Recupera un punto de restauración anterior. El sistema hidratará el espacio de trabajo.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {historyItems.map((item) => (
                  <div key={item.id} className="p-5 rounded-xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex flex-col gap-3 relative group">
                    <div className="flex justify-between items-start">
                       <h3 className="text-sm font-bold text-white leading-snug break-words pr-6">{item.flowName}</h3>
                       <button onClick={() => deleteHistoryItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4">
                         <Trash size={16} />
                       </button>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{item.theme}</p>
                    <div className="flex flex-wrap gap-1 mt-auto pt-2">
                      {item.detectedAgents.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{a}</span>
                      ))}
                      {item.detectedAgents.length > 3 && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">+{item.detectedAgents.length - 3}</span>}
                    </div>
                    <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                      <span className="text-[10px] text-zinc-500">{new Date(item.updatedAt).toLocaleString()}</span>
                      <button 
                        onClick={() => {
                          loadHistoryItem(item.id, (snapshot) => {
                             useStudioStore.setState({
                               ...snapshot
                             });
                             useStudioStore.getState().setZone2ActiveTab('okr');
                          });
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        Restaurar <CheckCircle size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
                {historyItems.length === 0 && (
                  <div className="col-span-full py-20 text-center text-zinc-500 flex flex-col items-center gap-3">
                    <ClockCounterClockwise size={48} weight="duotone" className="opacity-20" />
                    <p className="text-sm">No hay historial guardado todavía.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
          </>
        )}
      </div>
      
      
            {/* InfinityBoard Tab */}
            <div className={zone2ActiveTab === 'infinityboard' ? 'flex-1 flex flex-col h-full bg-[#030712] relative overflow-hidden' : 'hidden'}>
               <CanvasTabs />
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




export { SwarmOrchestrationPanel };

