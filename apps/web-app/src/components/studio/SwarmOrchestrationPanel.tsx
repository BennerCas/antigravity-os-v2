import { useTTSStore } from '../../lib/ttsStore';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash, CheckSquare, Square, Lightning, Crosshair, RocketLaunch, Checks, TrendUp, PaintBrush, Database, Globe, TerminalWindow, File, UploadSimple, CodeBlock, HardDrives, Scan, Network, AppWindow, Layout, ClockCounterClockwise, Microphone, Graph } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL, API_URL } from '../../lib/api';
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

  const handleGuardarSwarm = async () => {
    const name = window.prompt("Ingrese el nombre del Swarm:");
    if (!name) return;

    try {
      const state = useStudioStore.getState();
      const payload = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name: name,
        description: "Generado en Phase 3",
        nodes: state.flowNodes || [],
        edges: state.flowEdges || []
      };

      const res = await fetch(`${API_URL}/studio/registries/swarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Swarm guardado correctamente.");
      } else {
        alert("Error al guardar el Swarm.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al guardar el Swarm.");
    }
  };

  const handleCargarSwarm = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/registries/swarms`);
      if (!res.ok) {
        alert("Error al obtener los Swarms.");
        return;
      }
      const data = await res.json();
      
      const swarms = Array.isArray(data) ? data : data.data || [];
      if (swarms.length === 0) {
        alert("No hay Swarms guardados.");
        return;
      }
      
      const swarmNames = swarms.map((s: any, i: number) => `${i + 1}. ${s.name}`).join('\\n');
      const selection = window.prompt(`Seleccione el número del Swarm a cargar:\\n${swarmNames}`);
      if (!selection) return;

      const idx = parseInt(selection) - 1;
      const selectedSwarm = swarms[idx];
      if (selectedSwarm) {
        useStudioStore.getState().setFlow(selectedSwarm.nodes || [], selectedSwarm.edges || []);
        alert("Swarm cargado correctamente.");
      } else {
        alert("Selección inválida.");
      }
    } catch (e) {
      console.error(e);
      alert("Error al cargar el Swarm.");
    }
  };

  return (
    <div className="w-full h-full flex bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      
      {/* InfinityBoard Tab (Logos) */}
      <div className="flex-1 flex flex-col h-full bg-[#030712] relative overflow-hidden">
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

