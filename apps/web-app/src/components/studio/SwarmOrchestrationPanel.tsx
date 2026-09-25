import { useTTSStore } from '../../lib/ttsStore';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash, CheckSquare, Square, Lightning, Crosshair, RocketLaunch, Checks, TrendUp, PaintBrush, Database, Globe, TerminalWindow, File, UploadSimple, CodeBlock, HardDrives, Scan, Network, AppWindow } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL } from '../../lib/api';

const SwarmOrchestrationPanel: React.FC = () => {
  const {
    activityLogs, addActivityLog,
    zone2ActiveTab, setZone2ActiveTab,
    phase1Interview,
    phase1Complete, phase2Complete, phase3Complete,
    phase2Content, phase3Content, triageSummary, isFreeChat
  } = useStudioStore();

  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isEditingObjective, setIsEditingObjective] = React.useState(false);
  const [editedObjective, setEditedObjective] = React.useState(triageSummary || '');
  const [activeModel, setActiveModel] = React.useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [explainProgress, setExplainProgress] = React.useState<number | null>(null);
  const [explainText, setExplainText] = React.useState<string | null>(null);
  const [isRegeneratingObjective, setIsRegeneratingObjective] = React.useState(false);

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
      
      {/* ZONE 1: Activity Log */}
      {!isFreeChat && (
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
                  <span className={`leading-relaxed text-[var(--text-primary)]`}>{log.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZONE 2: Results Panel */}
      <div className={`${isFreeChat ? 'flex-1' : 'flex-[2]'} min-w-0 h-full flex flex-col bg-[var(--surface-canvas)]`}>
        {isFreeChat ? null : (
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
          <div className={zone2ActiveTab === 'okr' ? 'flex-1 overflow-y-auto p-10 custom-scrollbar block relative' : 'hidden'}>
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
              <Crosshair size={300} weight="thin" />
            </div>

            <div className="max-w-3xl mx-auto space-y-20 animate-fade-in relative z-10 pb-12">
              
              {/* Header Progress */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-3">
                    <Target size={28} style={{ color: 'var(--theme-border)' }} weight="duotone" />
                    Radar de Arquitectura
                  </h2>
                  <div className="text-right">
                    <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--theme-border)', opacity: 0.7 }}>Progreso Global</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--theme-border)' }}>
                      {phase3Complete ? '100%' : phase2Complete ? '75%' : phase1Complete ? '50%' : phase1Interview ? '25%' : '0%'}
                    </div>
                  </div>
                </div>
                {/* Progress Bar — usa el color del tema activo */}
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

              {/* Objetivo Principal */}
              <div className="relative">
                <div className="absolute -left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500/0 via-emerald-500 to-emerald-500/0 opacity-50 rounded-full" />
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendUp size={16} /> Vector de Intención
                </h3>
                
                {phase1Complete && triageSummary ? (
                  <div className="p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.05)] relative group">
                    <div className="flex items-start gap-5">
                      <div className="shrink-0 p-4 bg-emerald-500/10 rounded-2xl">
                        <Checks size={28} className="text-emerald-400" weight="duotone" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        {isEditingObjective ? (
                          <div className="flex flex-col gap-3">
                            <textarea
                              value={editedObjective}
                              onChange={(e) => setEditedObjective(e.target.value)}
                              className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[120px]"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setIsEditingObjective(false); setEditedObjective(triageSummary); }} className="px-4 py-2 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200">Cancelar</button>
                              <button onClick={handleSaveObjective} className="px-4 py-2 text-xs rounded-lg bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400">Guardar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="markdown-body text-[15px] leading-relaxed text-emerald-100 user-answer-block">
                              <ReactMarkdown>{triageSummary}</ReactMarkdown>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
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
                              <button 
                                onClick={() => setIsEditingObjective(!isEditingObjective)}
                                className="p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center self-end mt-1"
                                title="Editar Objetivo"
                              >
                                <PaintBrush size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>


                ) : (
                  <div className="p-10 rounded-3xl border border-dashed border-zinc-700/50 bg-zinc-900/20 flex flex-col items-center justify-center text-center gap-5">
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
                          ? "Responde las preguntas en la pestaña Triage para que AureliOS extraiga el Requerimiento Principal."
                          : "Escribe en el chat qué quieres construir. AureliOS despertará al Enjambre 1 para entrevistarte."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timeline Stepper */}
              <div>
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <ListChecks size={16} /> Secuencia de Orquestación
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Step 1 — click → pestaña Fase 1 */}
                  <div 
                    onClick={() => setZone2ActiveTab('phase1')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    phase1Complete ? 'border-emerald-500/30 bg-emerald-500/5' : 
                    phase1Interview ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 
                    'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        phase1Complete ? 'bg-emerald-500/20 text-emerald-400' : 
                        phase1Interview ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        <Brain size={20} weight="duotone" />
                      </div>
                      <h4 className={`text-base font-semibold ${phase1Complete ? 'text-emerald-400' : phase1Interview ? 'text-blue-400' : 'text-zinc-400'}`}>
                        Fase 1: Triage Inicial
                      </h4>
                    </div>
                    <p className="text-[15px] text-zinc-500 pl-14 leading-relaxed">
                      El equipo Radar realiza una entrevista socrática adaptativa para destilar tu idea cruda en un contrato sólido.
                    </p>
                  </div>

                  {/* Step 2 — click → pestaña Fase 2 */}
                  <div 
                    onClick={() => setZone2ActiveTab('phase2')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    phase2Complete ? 'border-emerald-500/30 bg-emerald-500/5' : 
                    (phase1Complete && !phase2Complete) ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 
                    'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        phase2Complete ? 'bg-emerald-500/20 text-emerald-400' : 
                        (phase1Complete && !phase2Complete) ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        <Robot size={20} weight="duotone" />
                      </div>
                      <h4 className={`text-base font-semibold ${phase2Complete ? 'text-emerald-400' : (phase1Complete && !phase2Complete) ? 'text-purple-400' : 'text-zinc-400'}`}>
                        Fase 2: Extracción Técnica
                      </h4>
                    </div>
                    <p className="text-[15px] text-zinc-500 pl-14 leading-relaxed">
                      El Enjambre Clandestino analiza riesgos, arquitecturas posibles y extrae los requisitos técnicos precisos.
                    </p>
                  </div>

                  {/* Step 3 — click → pestaña Fase 3 */}
                  <div 
                    onClick={() => setZone2ActiveTab('phase3')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                    phase3Complete ? 'border-emerald-500/30 bg-emerald-500/5' : 
                    (phase2Complete && !phase3Complete) ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 
                    'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        phase3Complete ? 'bg-emerald-500/20 text-emerald-400' : 
                        (phase2Complete && !phase3Complete) ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        <Lightning size={20} weight="duotone" />
                      </div>
                      <h4 className={`text-base font-semibold ${phase3Complete ? 'text-emerald-400' : (phase2Complete && !phase3Complete) ? 'text-amber-400' : 'text-zinc-400'}`}>
                        Fase 3: Blueprint MD
                      </h4>
                    </div>
                    <p className="text-[15px] text-zinc-500 pl-14 leading-relaxed">
                      Se consolida toda la información en un Blueprint Maestro (Markdown) listo para que los ingenieros generen el código.
                    </p>
                  </div>

                  {/* Step 4 — click → InfinityBoard con flujo centrado */}
                  <div 
                    onClick={() => {
                      if (phase3Complete) {
                        // Navegar a InfinityBoard y emitir evento para centrar el canvas
                        window.dispatchEvent(new CustomEvent('agentos:navigate', { detail: { view: 'infinityboard', fitView: true } }));
                      }
                    }}
                    className={`p-6 rounded-2xl border transition-all ${phase3Complete ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-not-allowed'} ${
                    phase3Complete ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 
                    'border-zinc-800/50 bg-zinc-900/30 opacity-60'
                  }`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        phase3Complete ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        <RocketLaunch size={20} weight="duotone" />
                      </div>
                      <h4 className={`text-base font-semibold ${phase3Complete ? 'text-cyan-400' : 'text-zinc-400'}`}>
                        Ensamblaje (Match & Fuse)
                      </h4>
                    </div>
                    <p className="text-[15px] text-zinc-500 pl-14 leading-relaxed">
                      El blueprint es transferido a Antigravity OS para el auto-desarrollo.
                    </p>
                  </div>

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
                  <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <h2 className="text-xl text-[var(--text-primary)] font-semibold flex items-center gap-2">
                      <Brain size={24} weight="duotone" className="text-blue-400" /> Entrevista de Triage
                    </h2>
                    {(() => {
                      const ansCount = phase1Interview ? phase1Interview.split('===USER_ANSWER_START===').length - 1 : 0;
                      // Con 0 respuestas: 85%, 1 respuesta: 40%, 2 respuestas: 15%, etc.
                      let missingPercent = 85;
                      if (ansCount === 1) missingPercent = 40;
                      if (ansCount === 2) missingPercent = 15;
                      if (ansCount > 2) missingPercent = Math.max(5, 15 - (ansCount - 2) * 5); // Nunca baja de 5% hasta que apruebe
                      
                      return missingPercent > 0 ? (
                        <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono font-medium flex items-center gap-1.5 animate-pulse">
                          <span>Falta</span>
                          <span>-{missingPercent}%</span>
                        </div>
                      ) : null;
                    })()}
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
                            const prompt = `Actúa como el usuario experto o product owner. Responde a la siguiente entrevista de Triage de manera clara, creativa y directa, inventando los requerimientos lógicos que falten para que el proyecto sea viable.\n\nREGLAS ESTRICTAS:\n1. Responde OBLIGATORIAMENTE en ESPAÑOL.\n2. PROHIBIDO usar formato Markdown (nada de asteriscos, negritas, viñetas, hashes o caracteres especiales).\n3. Debes estructurar tu respuesta de forma numerada: coloca el número de la pregunta original seguido de tu respuesta (Ejemplo: "1. Mi objetivo es... 2. El público objetivo...").\n\nENTREVISTA A RESPONDER:\n${phase1Interview}`;
                            
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
                            // FIXED: El backend necesita "--- [Respuesta" o "Respuestas del usuario:" para detectar que es la segunda pasada y poder aprobar.
                            trigger("--- [Respuesta del usuario] ---\n" + val);
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
            {/* ── Banner fijo inferior: Fase 1 aprobada ── */}
            {phase1Complete && (
              <div className="shrink-0 flex items-center justify-between px-8 py-3 border-t" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
                  <CheckCircle size={16} weight="fill" />
                  <span>Fase 1: Triage aprobada</span>
                </div>
                <button
                  onClick={() => useStudioStore.getState().setZone2ActiveTab('phase2')}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  Ir a Fase 2: Extracción →
                </button>
              </div>
            )}
          </div>

          {/* ── Fase 2: Extracción ── */}
          <div className={zone2ActiveTab === 'phase2' ? 'flex flex-col h-full' : 'hidden'}>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4 px-4">
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
            {/* ── Banner fijo inferior: Fase 2 aprobada ── */}
            {phase2Complete && (
              <div className="shrink-0 flex items-center justify-between px-8 py-3 border-t" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' }}>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-mono">
                  <CheckCircle size={16} weight="fill" />
                  <span>Fase 2: Extracción aprobada</span>
                </div>
                <button
                  onClick={() => useStudioStore.getState().setZone2ActiveTab('phase3')}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  Ir a Fase 3: Blueprint →
                </button>
              </div>
            )}
          </div>

          {/* ── Fase 3: Blueprint ── */}
          <div className={zone2ActiveTab === 'phase3' ? 'flex flex-col h-full' : 'hidden'}>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4 px-4">
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
            {/* ── Banner fijo inferior: Fase 3 completada ── */}
            {phase3Complete && (
              <div className="shrink-0 flex items-center justify-between px-8 py-3 border-t" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }}>
                <div className="flex items-center gap-2 text-amber-400 text-sm font-mono">
                  <CheckCircle size={16} weight="fill" />
                  <span>Fase 3: Blueprint completado — Arquitectura lista</span>
                </div>
                <button
                  onClick={() => useStudioStore.getState().setZone2ActiveTab('okr')}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
                >
                  Ver OKRs y Checklist →
                </button>
              </div>
            )}
          </div>

        </div>
          </>
        )}
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

