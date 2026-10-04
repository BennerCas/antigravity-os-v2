import { useTTSStore } from '../../lib/ttsStore';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useStudioStore } from '../../stores/useStudioStore';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, Target, Brain, Robot, SpeakerHigh, Trash, CheckSquare, Square, Lightning, Crosshair, RocketLaunch, Checks, TrendUp, PaintBrush, Database, Globe, TerminalWindow, File, UploadSimple, CodeBlock, HardDrives, Scan, Network, AppWindow, Layout, ClockCounterClockwise, Microphone, Graph } from '@phosphor-icons/react';
import { WS_STUDIO_ACTIVITY_URL, API_URL } from '../../lib/api';
import { DEFAULT_AURELIOS_MODEL, normalizeAureliosModel, resolvePreferredLocalModel } from '../../lib/modelDefaults';
import { CanvasTabs } from '../../pages/AgentOSStudio';

interface SwarmRunArtifact {
  name: string;
  content: string;
}

interface SwarmRunStep {
  index: number;
  node_name: string;
  contract_status: 'PASS' | 'FAIL';
}

interface SwarmRun {
  id: string;
  objective: string;
  status: string;
  score?: number;
  updated_at?: string;
  artifacts?: SwarmRunArtifact[];
  steps?: SwarmRunStep[];
}

interface SpecialistPack {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface SpecialistPackTemplate {
  pack: SpecialistPack;
  nodes: any[];
  edges: any[];
  agentCards: any[];
}

interface RoomPreset {
  id: string;
  name: string;
  description: string;
  participants: Array<{ id: string; name: string; role: string }>;
}

interface RoomRunTurn {
  turn: number;
  speaker: string;
  role: string;
  message: string;
}

interface RoomRun {
  id: string;
  preset_id: string;
  preset_name?: string;
  objective: string;
  status: string;
  updated_at?: string;
  turns?: number;
  transcript?: RoomRunTurn[];
  artifacts?: SwarmRunArtifact[];
}

interface CharacterProfile {
  id: string;
  name: string;
  essence?: string;
  speaking_style?: string;
}

const RoomRunPreview: React.FC<{ runId: string }> = ({ runId }) => {
  const [roomRun, setRoomRun] = React.useState<RoomRun | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/studio/rooms/runs/${runId}`);
        if (!res.ok) return;
        const data = await res.json();
        setRoomRun(data.run || null);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [runId]);

  if (!roomRun) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
      <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-bold">Transcripto activo</div>
      <div className="text-sm text-white/85 font-semibold">{roomRun.preset_name || roomRun.preset_id}</div>
      <div className="max-h-[144px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {(roomRun.transcript || []).slice(-6).map((entry, index) => (
          <div key={`${runId}_${index}`} className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-violet-300 font-bold">{entry.speaker}</div>
            <div className="text-[11px] text-white/70 mt-1 leading-relaxed">{entry.message}</div>
          </div>
        ))}
      </div>
      {(roomRun.artifacts || []).length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => useStudioStore.getState().setActiveArtifact({ name: roomRun.artifacts![0].name, content: roomRun.artifacts![0].content })}
            className="px-2 py-1 rounded-lg border border-amber-400/20 bg-amber-500/10 text-amber-300 text-xs hover:bg-amber-500/20"
          >
            Abrir transcripto
          </button>
        </div>
      )}
    </div>
  );
};

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
  const [activeModel, setActiveModel] = React.useState(() => normalizeAureliosModel(localStorage.getItem('aurelios_model') || DEFAULT_AURELIOS_MODEL));
  const [explainProgress, setExplainProgress] = React.useState<number | null>(null);
  const [explainText, setExplainText] = React.useState<string | null>(null);
  const [isRegeneratingObjective, setIsRegeneratingObjective] = React.useState(false);
  const [isModifyingPhase2, setIsModifyingPhase2] = React.useState(false);
  const [isPromptChecked, setIsPromptChecked] = React.useState(false);
  const [swarmRuns, setSwarmRuns] = React.useState<SwarmRun[]>([]);
  const [isRunningSwarm, setIsRunningSwarm] = React.useState(false);
  const [runtimeObjective, setRuntimeObjective] = React.useState(triageSummary || '');
  const [selectedRunId, setSelectedRunId] = React.useState<string | null>(null);
  const [specialistPacks, setSpecialistPacks] = React.useState<SpecialistPack[]>([]);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = React.useState(false);
  const [roomPresets, setRoomPresets] = React.useState<RoomPreset[]>([]);
  const [roomRuns, setRoomRuns] = React.useState<RoomRun[]>([]);
  const [selectedRoomRunId, setSelectedRoomRunId] = React.useState<string | null>(null);
  const [selectedRoomPresetId, setSelectedRoomPresetId] = React.useState<string>('podcast-product-war-room');
  const [isRunningRoom, setIsRunningRoom] = React.useState(false);
  const [characterProfiles, setCharacterProfiles] = React.useState<CharacterProfile[]>([]);
  const [isCloningCharacter, setIsCloningCharacter] = React.useState(false);

  React.useEffect(() => {
    const handleModelChange = () => setActiveModel(normalizeAureliosModel(localStorage.getItem('aurelios_model') || DEFAULT_AURELIOS_MODEL));
    window.addEventListener('aurelios_model_changed', handleModelChange);
    return () => window.removeEventListener('aurelios_model_changed', handleModelChange);
  }, []);

  React.useEffect(() => {
    setRuntimeObjective(triageSummary || '');
  }, [triageSummary]);

  React.useEffect(() => {
    refreshSwarmRuns();
    loadSpecialistPacks();
    loadRoomPresets();
    loadRoomRuns();
    loadCharacterProfiles();
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
      const modelName = resolvePreferredLocalModel(activeModel);
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
      const modelName = resolvePreferredLocalModel(activeModel);
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

  const refreshSwarmRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/swarm/runs`);
      if (!res.ok) return;
      const data = await res.json();
      setSwarmRuns(data.runs || []);
      if ((data.runs || []).length > 0) {
        setSelectedRunId((prev) => prev || data.runs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };


  const loadSpecialistPacks = async () => {
    setIsLoadingSpecialists(true);
    try {
      const res = await fetch(`${API_URL}/agents/specialists`);
      if (!res.ok) return;
      const data = await res.json();
      setSpecialistPacks(data.packs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSpecialists(false);
    }
  };


  const loadRoomPresets = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/rooms/presets`);
      if (!res.ok) return;
      const data = await res.json();
      setRoomPresets(data.presets || []);
      if (data.presets?.[0]?.id) {
        setSelectedRoomPresetId((prev) => prev || data.presets[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRoomRuns = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/rooms/runs`);
      if (!res.ok) return;
      const data = await res.json();
      setRoomRuns(data.runs || []);
      if ((data.runs || []).length > 0) {
        setSelectedRoomRunId((prev) => prev || data.runs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadCharacterProfiles = async () => {
    try {
      const res = await fetch(`${API_URL}/studio/characters`);
      if (!res.ok) return;
      const data = await res.json();
      setCharacterProfiles(data.profiles || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSpecialistPack = async (packId: string) => {
    try {
      const res = await fetch(`${API_URL}/agents/specialists/${packId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SpecialistPackTemplate & { status: string } = await res.json();
      const store = useStudioStore.getState();
      store.setFlow(data.nodes || [], data.edges || []);
      const existing = store.agentCards || [];
      const merged = [...(data.agentCards || [])];
      for (const card of existing) {
        if (!merged.some((candidate) => candidate.id === card.id)) {
          merged.push(card);
        }
      }
      store.setAgentCards(merged);
      if (!runtimeObjective.trim()) {
        setRuntimeObjective(`Ejecutar ${data.pack.name} sobre el objetivo actual con trazabilidad contractual.`);
      }
      addActivityLog({ source: 'Specialist Pack', message: `Pack cargado: ${data.pack.name}`, status: 'INFO' });
    } catch (e) {
      console.error(e);
      alert('No se pudo cargar el pack especialista.');
    }
  };

  const handleRecommendSpecialists = async () => {
    if (!runtimeObjective.trim()) {
      alert('Define un objetivo para recomendar especialistas.');
      return;
    }
    setIsLoadingSpecialists(true);
    try {
      const res = await fetch(`${API_URL}/agents/specialists/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: runtimeObjective.trim(), limit: 4 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSpecialistPacks((data.recommendations || []).map((item: any) => item.pack));
      if (data.recommendations?.[0]?.pack?.id) {
        addActivityLog({ source: 'Specialist Recommender', message: `Pack sugerido: ${data.recommendations[0].pack.name}`, status: 'INFO' });
      }
    } catch (e) {
      console.error(e);
      alert('No se pudieron recomendar especialistas.');
    } finally {
      setIsLoadingSpecialists(false);
    }
  };

  const handleRunRoom = async () => {
    if (!runtimeObjective.trim()) {
      alert('Define un objetivo antes de simular la room.');
      return;
    }
    setIsRunningRoom(true);
    try {
      const modelName = resolvePreferredLocalModel(activeModel);
      const res = await fetch(`${API_URL}/studio/rooms/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_id: selectedRoomPresetId,
          objective: runtimeObjective.trim(),
          turns: 2,
          model: `ollama/${modelName}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await loadRoomRuns();
      if (data?.run?.id) setSelectedRoomRunId(data.run.id);
      if (data?.run?.artifacts?.length) {
        useStudioStore.getState().setActiveArtifact(data.run.artifacts[0]);
      }
      addActivityLog({ source: 'Room Runtime', message: `Room completada: ${data?.run?.preset_name || selectedRoomPresetId}`, status: 'INFO' });
    } catch (e) {
      console.error(e);
      alert('No se pudo simular la room local.');
    } finally {
      setIsRunningRoom(false);
    }
  };

  const handleCloneCharacter = async () => {
    if (!runtimeObjective.trim()) {
      alert('Define un brief para clonar el personaje.');
      return;
    }
    const name = window.prompt('Nombre del personaje a clonar:', 'Nova');
    if (!name) return;
    const archetype = window.prompt('Arquetipo base del personaje:', 'Host futurista');
    setIsCloningCharacter(true);
    try {
      const res = await fetch(`${API_URL}/studio/characters/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, archetype, source_prompt: runtimeObjective.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await loadCharacterProfiles();
      addActivityLog({ source: 'Character Lab', message: `Perfil clonado: ${data?.profile?.name || name}`, status: 'INFO' });
    } catch (e) {
      console.error(e);
      alert('No se pudo clonar el personaje.');
    } finally {
      setIsCloningCharacter(false);
    }
  };

  const handleExecuteSwarm = async () => {
    const { flowNodes, flowEdges, setActiveArtifact } = useStudioStore.getState();
    if (!runtimeObjective.trim()) {
      alert('Define un objetivo antes de ejecutar el swarm.');
      return;
    }
    if (!flowNodes.length) {
      alert('No hay nodos en el InfinityBoard para ejecutar.');
      return;
    }
    setIsRunningSwarm(true);
    try {
      const modelName = resolvePreferredLocalModel(activeModel);
      const res = await fetch(`${API_URL}/studio/swarm/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: runtimeObjective.trim(),
          nodes: flowNodes,
          edges: flowEdges,
          model: `ollama/${modelName}`,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data?.run?.artifacts?.length) {
        setActiveArtifact(data.run.artifacts[0]);
      }
      addActivityLog({ source: 'Swarm Runtime', message: `Run completado: ${data?.run?.score ?? 0}%`, status: 'INFO' });
      await refreshSwarmRuns();
      if (data?.run?.id) setSelectedRunId(data.run.id);
    } catch (e) {
      console.error(e);
      alert('Error ejecutando el swarm runtime.');
    } finally {
      setIsRunningSwarm(false);
    }
  };

  const selectedRun = swarmRuns.find(run => run.id === selectedRunId) || null;

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
          } else if (data.type === 'SWARM_RUN_EVENT' && data.payload) {
            refreshSwarmRuns();
          } else if (data.type === 'ROOM_RUN_EVENT' && data.payload) {
            loadRoomRuns();
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

         <div className="absolute top-4 right-4 z-20 w-[360px] max-w-[calc(100%-2rem)] bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
           <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
             <div>
               <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-bold">Swarm Runtime</div>
               <div className="text-sm text-white/90 font-semibold">Ejecución visible del board</div>
             </div>
             <div className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/60">{activeModel}</div>
           </div>

           <div className="p-4 space-y-3">
             <textarea
               value={runtimeObjective}
               onChange={(e) => setRuntimeObjective(e.target.value)}
               placeholder="Objetivo operativo del swarm"
               className="w-full min-h-[84px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400 resize-y"
             />

             <div className="grid grid-cols-5 gap-2">
               <button onClick={handleExecuteSwarm} disabled={isRunningSwarm} className="col-span-2 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 disabled:opacity-40">
                 {isRunningSwarm ? 'Ejecutando...' : 'Ejecutar'}
               </button>
               <button onClick={handleRecommendSpecialists} disabled={isLoadingSpecialists} className="px-3 py-2 rounded-xl bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-200 text-xs font-bold hover:bg-fuchsia-500/25 disabled:opacity-40">Sugerir</button>
               <button onClick={handleGuardarSwarm} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10">Guardar</button>
               <button onClick={handleCargarSwarm} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10">Cargar</button>
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold">Equipos Pro</div>
                 <button onClick={loadSpecialistPacks} className="text-[11px] text-white/60 hover:text-white">Ver catálogo</button>
               </div>
               <div className="max-h-[188px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                 {specialistPacks.length === 0 ? (
                   <div className="text-xs text-white/40 border border-dashed border-white/10 rounded-xl px-3 py-4">{isLoadingSpecialists ? 'Cargando catálogo especialista...' : 'Aún no hay packs cargados.'}</div>
                 ) : specialistPacks.slice(0, 4).map((pack) => (
                   <div key={pack.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                     <div className="flex items-start justify-between gap-3">
                       <div className="min-w-0">
                         <div className="text-sm font-semibold text-white/90 truncate">{pack.name}</div>
                         <div className="text-[10px] uppercase tracking-[0.16em] text-fuchsia-300/80 mt-1">{pack.category}</div>
                       </div>
                       <button onClick={() => handleLoadSpecialistPack(pack.id)} className="shrink-0 px-2 py-1 rounded-lg bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-200 text-[10px] font-bold hover:bg-fuchsia-500/25">Cargar</button>
                     </div>
                     <div className="mt-2 text-[11px] text-white/55 leading-relaxed">{pack.description}</div>
                   </div>
                 ))}
               </div>
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold">Rooms & Personajes</div>
                 <div className="flex gap-2">
                   <button onClick={handleCloneCharacter} disabled={isCloningCharacter} className="text-[11px] px-2 py-1 rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 disabled:opacity-40">{isCloningCharacter ? 'Clonando...' : 'Clonar personaje'}</button>
                   <button onClick={handleRunRoom} disabled={isRunningRoom || !selectedRoomPresetId} className="text-[11px] px-2 py-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-40">{isRunningRoom ? 'Simulando...' : 'Simular room'}</button>
                 </div>
               </div>

               <div className="grid grid-cols-1 gap-2">
                 <select value={selectedRoomPresetId} onChange={(e) => setSelectedRoomPresetId(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400">
                   {roomPresets.map((preset) => (
                     <option key={preset.id} value={preset.id} className="bg-slate-900">{preset.name}</option>
                   ))}
                 </select>

                 {roomPresets.length > 0 && (
                   <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                     <div className="text-sm font-semibold text-white/90">{roomPresets.find((preset) => preset.id === selectedRoomPresetId)?.name}</div>
                     <div className="mt-1 text-[11px] text-white/55 leading-relaxed">{roomPresets.find((preset) => preset.id === selectedRoomPresetId)?.description}</div>
                     <div className="mt-2 flex flex-wrap gap-2">
                       {(roomPresets.find((preset) => preset.id === selectedRoomPresetId)?.participants || []).map((participant) => (
                         <span key={participant.id} className="px-2 py-1 rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-200 text-[10px]">{participant.name}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 <div className="max-h-[132px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                   {roomRuns.length === 0 ? (
                     <div className="text-xs text-white/40 border border-dashed border-white/10 rounded-xl px-3 py-4">Aún no hay simulaciones de room persistidas.</div>
                   ) : roomRuns.slice(0, 4).map((run) => (
                     <button key={run.id} onClick={() => setSelectedRoomRunId(run.id)} className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${selectedRoomRunId === run.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}>
                       <div className="flex items-center justify-between gap-3">
                         <div className="text-sm font-semibold text-white/90 truncate">{run.objective}</div>
                         <div className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-white/60">{run.status}</div>
                       </div>
                       <div className="mt-2 text-[11px] text-white/45">{run.preset_name || run.preset_id}</div>
                     </button>
                   ))}
                 </div>

                 {selectedRoomRunId && roomRuns.some((run) => run.id === selectedRoomRunId) && (
                   <RoomRunPreview runId={selectedRoomRunId} />
                 )}

                 <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                   <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2">Characters</div>
                   <div className="flex flex-wrap gap-2">
                     {characterProfiles.length === 0 ? <span className="text-[11px] text-white/40">Sin perfiles clonados todavía.</span> : characterProfiles.slice(0, 6).map((profile) => (
                       <span key={profile.id} title={profile.essence || profile.speaking_style || ''} className="px-2 py-1 rounded-lg border border-violet-400/20 bg-violet-500/10 text-violet-200 text-[10px]">{profile.name}</span>
                     ))}
                   </div>
                 </div>
               </div>
             </div>

             <div className="flex items-center justify-between">
               <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold">Runs recientes</div>
               <button onClick={refreshSwarmRuns} className="text-[11px] text-white/60 hover:text-white">Refrescar</button>
             </div>

             <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {swarmRuns.length === 0 ? (
                 <div className="text-xs text-white/40 border border-dashed border-white/10 rounded-xl px-3 py-4">Aún no hay runs persistidos. Ejecuta el board para crear trazabilidad real.</div>
               ) : swarmRuns.slice(0, 8).map((run) => (
                 <button
                   key={run.id}
                   onClick={() => setSelectedRunId(run.id)}
                   className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${selectedRunId === run.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
                 >
                   <div className="flex items-center justify-between gap-3">
                     <div className="text-sm font-semibold text-white/90 truncate">{run.objective}</div>
                     <div className={`text-[10px] px-2 py-1 rounded-full ${run.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300' : run.status === 'completed_with_warnings' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/60'}`}>{run.status}</div>
                   </div>
                   <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
                     <span>score: {run.score ?? 0}%</span>
                     <span>{run.artifacts?.length || 0} artefactos</span>
                   </div>
                 </button>
               ))}
             </div>

             {selectedRun && (
               <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                 <div className="text-xs uppercase tracking-[0.18em] text-white/40 font-bold">Detalle activo</div>
                 <div className="text-sm text-white/85 font-semibold">{selectedRun.objective}</div>
                 <div className="text-xs text-white/50">{selectedRun.steps?.length || 0} nodos · score {selectedRun.score ?? 0}%</div>
                 <div className="space-y-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                   {(selectedRun.steps || []).map((step) => (
                     <div key={`${selectedRun.id}_${step.index}`} className="flex items-center justify-between text-xs text-white/70">
                       <span className="truncate mr-2">{step.index}. {step.node_name}</span>
                       <span className={step.contract_status === 'PASS' ? 'text-emerald-300' : 'text-amber-300'}>{step.contract_status}</span>
                     </div>
                   ))}
                 </div>
                 {(selectedRun.artifacts || []).length > 0 && (
                   <div className="pt-2 border-t border-white/10">
                     <div className="text-[11px] text-white/40 mb-2 uppercase tracking-[0.18em] font-bold">Artefactos</div>
                     <div className="flex flex-wrap gap-2">
                       {(selectedRun.artifacts || []).map((artifact, idx) => (
                         <button
                           key={`${selectedRun.id}_artifact_${idx}`}
                           onClick={() => useStudioStore.getState().setActiveArtifact({ name: artifact.name, content: artifact.content })}
                           className="px-2 py-1 rounded-lg border border-amber-400/20 bg-amber-500/10 text-amber-300 text-xs hover:bg-amber-500/20"
                         >
                           {artifact.name}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )}
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




export { SwarmOrchestrationPanel };

