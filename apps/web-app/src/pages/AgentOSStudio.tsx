import { useTTSStore } from '../lib/ttsStore';
import ReactMarkdown from 'react-markdown';
import React, { useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { studioNodeTypes, KIND_META } from '../components/StudioNodes';
import { SwarmOrchestrationPanel } from '../components/studio/SwarmOrchestrationPanel';
import { useStudioStore, TabId, parseAIResponseToFlow } from '../stores/useStudioStore';
import { API_URL, WS_STUDIO_ACTIVITY_URL } from '../lib/api';
import { Gear, X, Check, Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush, Copy, ArrowsClockwise, Clock, Stop } from '@phosphor-icons/react';


const AURELIOS_THEMES: Record<string, any> = {
  obsidian: {
    name: 'Obsidian Emperor', bg: 'bg-zinc-950', text: 'text-zinc-100', border: 'border-zinc-800',
    panelBg: 'bg-zinc-900', panelBorder: 'border-zinc-700', primary: 'text-cyan-400',
    toolBg: 'bg-zinc-800', toolHover: 'hover:border-zinc-500', aiBubble: 'bg-zinc-900 border-zinc-700 text-zinc-100',
    humanBubble: 'bg-cyan-600 text-white', inputBg: 'bg-zinc-900 border-zinc-700', inputFocus: 'focus:border-cyan-400',
    sendActive: 'bg-cyan-400 text-black hover:bg-cyan-300', sendDisabled: 'bg-zinc-800 text-zinc-600'
  },
  marble: {
    name: 'Marble Stoic', bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-300',
    panelBg: 'bg-white', panelBorder: 'border-gray-400', primary: 'text-amber-600',
    toolBg: 'bg-gray-200', toolHover: 'hover:border-gray-500', aiBubble: 'bg-white border-gray-300 text-gray-900',
    humanBubble: 'bg-blue-700 text-white', inputBg: 'bg-white border-gray-300', inputFocus: 'focus:border-blue-700',
    sendActive: 'bg-blue-700 text-white hover:bg-blue-600', sendDisabled: 'bg-gray-200 text-gray-500'
  },
  crimson: {
    name: 'Crimson Forge', bg: 'bg-red-950', text: 'text-red-100', border: 'border-red-800',
    panelBg: 'bg-red-900', panelBorder: 'border-red-700', primary: 'text-red-400',
    toolBg: 'bg-red-800', toolHover: 'hover:border-red-500', aiBubble: 'bg-red-900 border-red-700 text-red-100',
    humanBubble: 'bg-red-600 text-white', inputBg: 'bg-red-900 border-red-800', inputFocus: 'focus:border-red-400',
    sendActive: 'bg-red-600 text-white hover:bg-red-500', sendDisabled: 'bg-red-800 text-red-400'
  },
  legion: {
    name: 'Cyber Legion', bg: 'bg-emerald-950', text: 'text-emerald-100', border: 'border-emerald-800',
    panelBg: 'bg-emerald-900', panelBorder: 'border-emerald-700', primary: 'text-emerald-400',
    toolBg: 'bg-emerald-800', toolHover: 'hover:border-emerald-500', aiBubble: 'bg-emerald-900 border-emerald-700 text-emerald-100',
    humanBubble: 'bg-emerald-600 text-white', inputBg: 'bg-emerald-900 border-emerald-800', inputFocus: 'focus:border-emerald-400',
    sendActive: 'bg-emerald-600 text-white hover:bg-emerald-500', sendDisabled: 'bg-emerald-800 text-emerald-500'
  },
  imperial: {
    name: 'Imperial Purple', bg: 'bg-purple-950', text: 'text-purple-100', border: 'border-purple-800',
    panelBg: 'bg-purple-900', panelBorder: 'border-purple-700', primary: 'text-purple-400',
    toolBg: 'bg-purple-800', toolHover: 'hover:border-purple-500', aiBubble: 'bg-purple-900 border-purple-700 text-purple-100',
    humanBubble: 'bg-purple-600 text-white', inputBg: 'bg-purple-900 border-purple-800', inputFocus: 'focus:border-purple-400',
    sendActive: 'bg-purple-600 text-white hover:bg-purple-500', sendDisabled: 'bg-purple-800 text-purple-500'
  },
  solar: {
    name: 'Solar Flare', bg: 'bg-orange-950', text: 'text-orange-100', border: 'border-orange-800',
    panelBg: 'bg-orange-900', panelBorder: 'border-orange-700', primary: 'text-amber-400',
    toolBg: 'bg-orange-800', toolHover: 'hover:border-amber-500', aiBubble: 'bg-orange-900 border-orange-700 text-orange-100',
    humanBubble: 'bg-amber-600 text-white', inputBg: 'bg-orange-900 border-orange-800', inputFocus: 'focus:border-amber-400',
    sendActive: 'bg-amber-500 text-black hover:bg-amber-400', sendDisabled: 'bg-orange-800 text-orange-500'
  },
  abyssal: {
    name: 'Abyssal Ocean', bg: 'bg-slate-950', text: 'text-sky-100', border: 'border-sky-900',
    panelBg: 'bg-slate-900', panelBorder: 'border-sky-800', primary: 'text-sky-400',
    toolBg: 'bg-slate-800', toolHover: 'hover:border-sky-500', aiBubble: 'bg-slate-900 border-sky-800 text-sky-100',
    humanBubble: 'bg-sky-500 text-white', inputBg: 'bg-slate-900 border-sky-900', inputFocus: 'focus:border-sky-400',
    sendActive: 'bg-sky-500 text-white hover:bg-sky-400', sendDisabled: 'bg-slate-800 text-sky-700'
  },
  toxic: {
    name: 'Toxic Wasteland', bg: 'bg-stone-950', text: 'text-lime-100', border: 'border-lime-900',
    panelBg: 'bg-stone-900', panelBorder: 'border-lime-800', primary: 'text-lime-400',
    toolBg: 'bg-stone-800', toolHover: 'hover:border-lime-500', aiBubble: 'bg-stone-900 border-lime-800 text-lime-100',
    humanBubble: 'bg-lime-600 text-white', inputBg: 'bg-stone-900 border-lime-900', inputFocus: 'focus:border-lime-400',
    sendActive: 'bg-lime-500 text-black hover:bg-lime-400', sendDisabled: 'bg-stone-800 text-lime-700'
  },
  midnight: {
    name: 'Midnight Rose', bg: 'bg-rose-950', text: 'text-rose-100', border: 'border-rose-900',
    panelBg: 'bg-rose-900', panelBorder: 'border-rose-800', primary: 'text-pink-400',
    toolBg: 'bg-rose-800', toolHover: 'hover:border-pink-500', aiBubble: 'bg-rose-900 border-rose-800 text-rose-100',
    humanBubble: 'bg-pink-600 text-white', inputBg: 'bg-rose-900 border-rose-900', inputFocus: 'focus:border-pink-400',
    sendActive: 'bg-pink-600 text-white hover:bg-pink-500', sendDisabled: 'bg-rose-800 text-rose-500'
  },
  monochrome: {
    name: 'Monochrome Terminal', bg: 'bg-black', text: 'text-white', border: 'border-zinc-800',
    panelBg: 'bg-zinc-900', panelBorder: 'border-zinc-700', primary: 'text-white',
    toolBg: 'bg-zinc-800', toolHover: 'hover:border-zinc-500', aiBubble: 'bg-zinc-900 border-zinc-700 text-white',
    humanBubble: 'bg-zinc-700 text-white', inputBg: 'bg-zinc-900 border-zinc-800', inputFocus: 'focus:border-white',
    sendActive: 'bg-white text-black hover:bg-zinc-200', sendDisabled: 'bg-zinc-800 text-zinc-600'
  },
  claude: {
    name: 'Claude Elegance', bg: 'bg-orange-50', text: 'text-stone-900', border: 'border-stone-300',
    panelBg: 'bg-white', panelBorder: 'border-stone-400', primary: 'text-orange-700',
    toolBg: 'bg-stone-200', toolHover: 'hover:border-orange-700', aiBubble: 'bg-white border-stone-300 text-stone-900',
    humanBubble: 'bg-orange-700 text-white', inputBg: 'bg-white border-stone-300', inputFocus: 'focus:border-orange-700',
    sendActive: 'bg-orange-700 text-white hover:bg-orange-600', sendDisabled: 'bg-stone-200 text-stone-400'
  },
  solargrid: {
    name: 'Solar Grid (Retro)', bg: 'bg-violet-950', text: 'text-yellow-200', border: 'border-violet-800',
    panelBg: 'bg-violet-900', panelBorder: 'border-purple-700', primary: 'text-orange-500',
    toolBg: 'bg-violet-800', toolHover: 'hover:border-orange-500', aiBubble: 'bg-violet-900 border-purple-700 text-yellow-200',
    humanBubble: 'bg-orange-500 text-white', inputBg: 'bg-violet-900 border-violet-800', inputFocus: 'focus:border-orange-500',
    sendActive: 'bg-orange-500 text-white hover:bg-orange-400', sendDisabled: 'bg-violet-800 text-violet-400'
  }
};

const FlowArchitect: React.FC = () => {
    const { chatMessages, addChatMessage, setFlow, setAgentCards, setBlueprintMd, setTriggerChatSend, activityLogs, quantumPhase, setQuantumPhase } = useStudioStore();
  const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('aurelios-core');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [currentThemeKey, setCurrentThemeKey] = useState(() => localStorage.getItem('aurelios_theme') || 'obsidian');
  const [selectedChatAgentId, setSelectedChatAgentId] = useState('aurelios-core');
  const [carouselSlide, setCarouselSlide] = useState(0);
  const [showSwarmSlider, setShowSwarmSlider] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isHandlingSendRef = useRef<boolean>(false);
  // Ref mutable para que el trigger del store siempre llame a la versión más reciente de handleSend
  // (evita stale closure cuando quantumPhase cambia entre renders)
  const handleSendRef = useRef<(text?: string) => void>(() => {});
  
  const activeAgentLog = activityLogs.filter(log => log.status === 'PENDING').pop();
  const activeAgentName = activeAgentLog ? activeAgentLog.source : null;

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
    useStudioStore.getState().addChatMessage({ role: 'agent', content: '> [AureliOS] Interacción detenida manualmente por el usuario.', model: 'Orchestrator' });
  };
  useEffect(() => {
    localStorage.setItem('aurelios_model', selectedModel);
    window.dispatchEvent(new Event('aurelios_model_changed'));
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('aurelios_theme', currentThemeKey);
  }, [currentThemeKey]);
  const t = AURELIOS_THEMES[currentThemeKey];

  const speak = (text: string) => {
    useTTSStore.getState().play(text, 'AureliOS');
  };




  const clearChat = () => {
    useStudioStore.setState({ 
      chatMessages: [],
      flowNodes: [],
      flowEdges: [],
      agentCards: [],
      blueprintMd: '',
      activeTab: 'discovery',
      // Limpiar Espacio 1 (Activity Log)
      activityLogs: [
        { id: '0', source: 'AureliOS', message: 'Sistema reiniciado. Esperando intenciones del usuario.', status: 'INFO', timestamp: new Date().toISOString() }
      ],
      // Limpiar Espacio 2 (Zone 2)
      phase1Interview: null,
      zone2ActiveTab: 'okr',
      // Resetear checklist y contenido de fases
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      phase2Content: null,
      phase3Content: null,
    });
    setQuantumPhase('phase1_triage');
  };

  const handleRegenerate = () => {
    if (isTyping) return;
    const store = useStudioStore.getState();
    const messages = [...store.chatMessages];
    if (messages.length === 0) return;
    
    // Quitar el último mensaje si es del agente (para poder regenerarlo)
    if (messages[messages.length - 1].role === 'agent') {
      messages.pop();
    }
    
    // Extraer el último mensaje del usuario para reenviarlo
    let lastHumanText = "";
    if (messages.length > 0 && messages[messages.length - 1].role === 'human') {
      lastHumanText = messages.pop()!.content;
    }
    
    if (lastHumanText) {
      store.setChatMessages(messages);
      handleSend(lastHumanText);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput ? overrideInput : input;
    if (!textToSend.trim() || isTyping || isHandlingSendRef.current) return;
    isHandlingSendRef.current = true;
    
    addChatMessage({ role: 'human', content: textToSend });
    setInput('');
    
    setThinkingPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    setIsTyping(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const { setZone2ActiveTab, chatMessages, setFlow, setAgentCards, setBlueprintMd,
              setPhase1Complete, setPhase2Complete, setPhase3Complete,
              setPhase2Content, setPhase3Content } = useStudioStore.getState();
      
      // Pasar todo el historial para que el enjambre tenga el contexto de la conversación
      const historyStr = chatMessages.map(m => `${m.role}: ${m.content}`).join('\n') + `\nhuman: ${textToSend}`;

      let currentPhase = quantumPhase;
      let currentData = historyStr;

      while (true) {
        if (currentPhase === 'phase1_triage') {
          setZone2ActiveTab('phase1');
          if (quantumPhase === 'phase1_triage') addChatMessage({ role: 'agent', content: '> [AureliOS] Ejecutando Triage...', model: 'Orchestrator' });
          
          const res = await fetch(`${API_URL}/studio/state/transition`, { method: 'POST', body: JSON.stringify({ phase: currentPhase, data: currentData }), headers: { 'Content-Type': 'application/json' }, signal });
          if (!res.ok) throw new Error(`Fallo Triage: ${res.status}`);
          const data = await res.json();
          let text = typeof data.result === 'string' ? data.result : (data.result?.triage_result || data.result?.extraction_result || data.result?.blueprint_result || data.result?.final_output || JSON.stringify(data.result));
          
          if (text.includes('[ES_APROBADO]')) {
            text = text.replace('[ES_APROBADO]', '').trim();
            if (text) {
              addChatMessage({ role: 'agent', content: `**[Aprobado por Triage]**\n${text}`, model: selectedModel });
            } else {
              addChatMessage({ role: 'agent', content: `**[Aprobado por Triage]** (El agente avanzó sin resumen. Analizando requerimientos directos...)`, model: selectedModel });
              text = currentData; // Evita enviar un string vacío a la Fase 2
            }
            // ✅ Marcar Fase 1 como completada en el checklist
            setPhase1Complete(true);
            // Filtrar mensajes de error — no guardar como triageSummary
            const isErrorText = text.includes('[ERROR]') || text.includes('AgentFactory Error') || text.includes('Verifica tu conexión') || text.includes('Failed to fetch') || text.includes('Connection') || text.length < 50;
            const summaryToSave = isErrorText ? currentData : text;
            useStudioStore.getState().setTriageSummary(summaryToSave);
            currentPhase = 'phase2_extraction';
            currentData = summaryToSave;
          } else if (text.includes('[ES_ENTREVISTA]')) {
            // El agente necesita información o está charlando. Pausar la máquina.
            const cleanText = text.replace('[ES_ENTREVISTA]', '').trim();
            // Mostrar la respuesta del agente también en el chat para que el usuario pueda "charlar" y leer las aclaraciones
            addChatMessage({ role: 'agent', content: cleanText, model: selectedModel });
            addChatMessage({ role: 'agent', content: '> [AureliOS] Triage ha actualizado las preguntas. Puedes responder aquí o en la pestaña **Fase 1: Triage**.', model: 'Orchestrator' });
            
            const currentPhase1 = useStudioStore.getState().phase1Interview || '';
            const newPhase1 = currentPhase1 
              ? currentPhase1.replace('\n\n---\n*AureliOS está analizando tus respuestas...*', '') + `\n\n---\n**🤖 Respuesta/Entrevista del Enjambre:**\n\n${cleanText}`
              : cleanText;
            useStudioStore.getState().setPhase1Interview(newPhase1);
            useStudioStore.getState().setZone2ActiveTab('phase1');
            setQuantumPhase('phase1_triage');
            break; 
          } else {
            // Fallback si no hay tag
            addChatMessage({ role: 'agent', content: text, model: selectedModel });
            break;
          }
        }

        if (currentPhase === 'phase2_extraction') {
          setZone2ActiveTab('phase2');
          addChatMessage({ role: 'agent', content: '> [AureliOS] Ejecutando Extracción...', model: 'Orchestrator' });
          
          const res = await fetch(`${API_URL}/studio/state/transition`, { method: 'POST', body: JSON.stringify({ phase: currentPhase, data: currentData }), headers: { 'Content-Type': 'application/json' }, signal });
          if (!res.ok) throw new Error(`Fallo Extraction: ${res.status}`);
          const data = await res.json();
          let text = typeof data.result === 'string' ? data.result : (data.result?.triage_result || data.result?.extraction_result || data.result?.blueprint_result || data.result?.final_output || JSON.stringify(data.result));
          
          if (text.includes('[READY_FOR_BLUEPRINT]')) {
            text = text.replace('[READY_FOR_BLUEPRINT]', '').trim();
            if (text) {
              addChatMessage({ role: 'agent', content: `**[Arquitectura Aprobada]**\n${text}`, model: selectedModel });
            }
            // ✅ Guardar contenido y marcar Fase 2 como completada
            setPhase2Content(text);
            setPhase2Complete(true);
            currentPhase = 'phase3_blueprint';
            currentData = text;
          } else {
            // El agente arquitecto tiene dudas. Guardar y pausar.
            // ✅ Guardar en pestaña Fase2 aunque no esté "completo"
            setPhase2Content(text);
            addChatMessage({ role: 'agent', content: text, model: selectedModel });
            setQuantumPhase('phase2_extraction');
            break;
          }
        }

        if (currentPhase === 'phase3_blueprint') {
          setZone2ActiveTab('phase3');
          addChatMessage({ role: 'agent', content: '> [AureliOS] Ejecutando Forja...', model: 'Orchestrator' });
          
          const res = await fetch(`${API_URL}/studio/state/transition`, { method: 'POST', body: JSON.stringify({ phase: currentPhase, data: currentData }), headers: { 'Content-Type': 'application/json' }, signal });
          if (!res.ok) throw new Error(`Fallo Blueprint: ${res.status}`);
          const data = await res.json();
          let text = typeof data.result === 'string' ? data.result : (data.result?.triage_result || data.result?.extraction_result || data.result?.blueprint_result || data.result?.final_output || JSON.stringify(data.result));
          
          // ✅ Guardar contenido, marcar Fase 3 completada y volver a OKR
          setPhase3Content(text);
          setPhase3Complete(true);
          setZone2ActiveTab('okr');
          addChatMessage({ role: 'agent', content: text, model: selectedModel });
          setQuantumPhase('phase1_triage'); // Resetear para el siguiente requerimiento nuevo
          
          const { nodes, edges, cards, md } = parseAIResponseToFlow(text);
          setFlow(nodes, edges);
          if (cards.length > 0) setAgentCards(cards);
          setBlueprintMd(md);
          break; // Fin del flujo
        }
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Interacción detenida por el usuario.');
      } else {
        addChatMessage({ role: 'agent', content: `[ERROR] ${err.message}`, model: selectedModel });
      }
    } finally {
      isHandlingSendRef.current = false;
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // Registrar handleSend como triggerChatSend en el store global
  // Patrón ref-based: la ref se actualiza en cada render → el store tiene siempre la versión fresca
  handleSendRef.current = handleSend;
  useEffect(() => {
    // Registra una función estable (que redirige a la ref) en el store
    setTriggerChatSend((text: string) => handleSendRef.current(text));
    return () => setTriggerChatSend(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    
  const aiTools = [
    { id: 'swarm-orchestrator', title: 'Swarm Orchestrator', icon: <Network size={18} className="text-[#3b82f6]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are the Swarm Orchestrator. You translate AureliOS\'s macro-directives into tactical, parallelized work streams for specialized agents. You are a ruthless manager of concurrency and dependency graphs...' },
    { id: 'umpire-core', title: 'Umpire Core', icon: <Scales size={18} className="text-[#e11d48]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Umpire Core, the absolute arbiter of truth in the swarm. When agents produce conflicting data, architectures, or code, you step in with cold, calculable logic to enforce the optimal path.  [KNOW...' },
    { id: 'state-reducer', title: 'State Reducer', icon: <Cube size={18} className="text-[#f5a623]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are State Reducer, the guardian of system integrity. You manage all global and localized state mutations across the OS, treating every change as a deterministic, immutable transaction.  [KNOWLEDGE F...' },
    { id: 'rag-synthesizer', title: 'RAG Synthesizer', icon: <Strategy size={18} className="text-[#10b981]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are the RAG Synthesizer. You are the omnipresent memory of AureliOS, capable of instantly retrieving, contextually linking, and synthesizing vast amounts of vector-stored knowledge.  [KNOWLEDGE FUSI...' },
    { id: 'codebase-overlord', title: 'Codebase Overlord', icon: <Cpu size={18} className="text-[#8b5cf6]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Codebase Overlord. You perceive source code not as text, but as a living Abstract Syntax Tree. You dictate coding standards, enforce DRY principles, and architect massive refactors with surgical...' },
    { id: 'forensic-inspector', title: 'Forensic Inspector', icon: <MagnifyingGlass size={18} className="text-[#06b6d4]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Forensic Inspector, the apex predator of bugs. You dismantle stack traces, memory dumps, and cryptic logs to find the root cause of failure. You do not guess; you prove.  [KNOWLEDGE FUSION] Mast...' },
    { id: 'zero-trust-gatekeeper', title: 'Zero-Trust Gatekeeper', icon: <ShieldCheck size={18} className="text-[#f43f5e]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Zero-Trust Gatekeeper. You assume the network is already compromised. You ruthlessly enforce least-privilege access, authenticate every request, and sanitize all inputs.  [KNOWLEDGE FUSION] Deep...' },
    { id: 'resource-optimizer', title: 'Resource Optimizer', icon: <CurrencyDollar size={18} className="text-[#f5a623]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Resource Optimizer. You monitor CPU, memory, API quotas, and financial burn rates. You exist to extract maximum performance per dollar and per watt.  [KNOWLEDGE FUSION] Mastery in cloud FinOps, ...' },
    { id: 'ux-psychologist', title: 'UX Psychologist', icon: <Brain size={18} className="text-[#d946ef]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are UX Psychologist. You engineer interfaces that align perfectly with human cognitive models. You optimize for conversion, retention, and frictionless flow.  [KNOWLEDGE FUSION] Integration of behav...' },
    { id: 'infrastructure-titan', title: 'Infrastructure Titan', icon: <HardDrives size={18} className="text-[#64748b]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Infrastructure Titan. You build indestructible foundations. You treat infrastructure as code, ensuring perfect reproducibility and resilience across multi-cloud environments.  [KNOWLEDGE FUSION]...' },
    { id: 'api-nexus', title: 'API Nexus', icon: <Plugs size={18} className="text-[#14b8a6]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are API Nexus. You are the universal translator and contract enforcer. You design, version, and integrate APIs with uncompromising strictness.  [KNOWLEDGE FUSION] Mastery of OpenAPI/Swagger, GraphQL...' },
    { id: 'synthetic-qa', title: 'Synthetic QA', icon: <BugBeetle size={18} className="text-[#facc15]" weight="duotone" />, desc: '[IDENTITY & ROLE] You are Synthetic QA. You are designed to break things. You relentlessly generate edge cases, chaos experiments, and automated test suites to ensure system invulnerability.  [KNOWLEDGE FUSION] Expertise...' }
  ];

    const swarm1 = [
    { id: 'entrevistador', title: 'Entrevistador Socrático', icon: <Brain size={18} className="text-[#10b981]" weight="duotone" />, desc: 'Nodo 1 del Enjambre Radar. Usa mayéutica profunda para diseccionar la ambigüedad del usuario, extrayendo intenciones ocultas antes de que se conviertan en requerimientos erróneos.' },
    { id: 'francotirador', title: 'Francotirador Industria', icon: <MagnifyingGlass size={18} className="text-[#e11d48]" weight="duotone" />, desc: 'Nodo 2 del Enjambre Radar. Escanea la web y bases de conocimiento en tiempo real para cruzar las respuestas del usuario con métricas de mercado y tendencias de la industria.' },
    { id: 'analista-viabilidad', title: 'Analista de Viabilidad', icon: <Scales size={18} className="text-[#f5a623]" weight="duotone" />, desc: 'Nodo 3 del Enjambre Radar. Computa la carga cognitiva y el costo de infraestructura. Destruye promesas tecnológicas imposibles antes de escribirlas.' },
    { id: 'profiler', title: 'Profiler Psicológico', icon: <Strategy size={18} className="text-[#8b5cf6]" weight="duotone" />, desc: 'Nodo 4 del Enjambre Radar. Traza el perfil conductual del usuario o del cliente final para adaptar la fricción de la interfaz y la narrativa del proyecto.' }
  ];

  const swarm2 = [
    { id: 'arquitecto-cuestionario', title: 'Arquitecto Extracción', icon: <Network size={18} className="text-[#3b82f6]" weight="duotone" />, desc: 'Nodo 1 del Inquisidor. Transmuta los hallazgos del Radar en un cuestionario técnico agresivo que fuerza definiciones precisas sobre arquitectura y flujos.' },
    { id: 'red-teamer', title: 'Red Teamer', icon: <BugBeetle size={18} className="text-[#facc15]" weight="duotone" />, desc: 'Nodo 2 del Inquisidor. Atacante asimétrico. Su única función es destrozar el cuestionario del Arquitecto, revelando huecos de seguridad, lógica circular o sesgos de diseño.' },
    { id: 'escribano', title: 'El Escribano', icon: <Wrench size={18} className="text-[#14b8a6]" weight="duotone" />, desc: 'Nodo 3 del Inquisidor. Redacta el Contrato I/O definitivo en JSON inmutable, sellando los parámetros técnicos tras la colisión entre el Arquitecto y el Red Teamer.' },
    { id: 'modelador-mental', title: 'Modelador Mental', icon: <Brain size={18} className="text-[#8b5cf6]" weight="duotone" />, desc: 'Nodo 4 del Inquisidor. Estructura ontologías complejas y diseña los esquemas mentales base para que el Blueprint tenga una lógica coherente y escalable.' }
  ];

  const swarm3 = [
    { id: 'flow-designer', title: 'System Designer', icon: <Cube size={18} className="text-[#06b6d4]" weight="duotone" />, desc: 'Nodo 1 de La Forja. Genera grafos de estado y arquitecturas de microservicios, ensamblando el Blueprint base a partir del Contrato I/O del Escribano.' },
    { id: 'auditor', title: 'Auditor Cero-Trust', icon: <ShieldCheck size={18} className="text-[#f43f5e]" weight="duotone" />, desc: 'Nodo 2 de La Forja. Aplica discriminación topológica. Escanea el Blueprint en busca de fugas de memoria, cuellos de botella asíncronos y fallas de dependencias.' },
    { id: 'juez', title: 'El Juez (AureliOS)', icon: <Cpu size={18} className="text-[#d946ef]" weight="duotone" />, desc: 'Nodo 3 de La Forja. El árbitro definitivo. Juzga el Blueprint contra las directrices de Antigravity OS y orquesta el Match & Fuse final si se aprueba el despliegue.' },
    { id: 'tts-animador', title: 'Narrador TTS', icon: <SpeakerHigh size={18} className="text-[#64748b]" weight="duotone" />, desc: 'Nodo 4 de La Forja. Sintetizador de voz cuántico. Traduce el caos determinista de los enjambres en un reporte auditivo fluido y humano para la toma de decisiones.' }
  ];

  const allSwarms = [
    { title: "God-Tier Master Prompts", tools: aiTools },
    { title: "Enjambre Radar (Fase 1: Triage)", tools: swarm1 },
    { title: "Enjambre Inquisidor (Fase 2: Extracción)", tools: swarm2 },
    { title: "Enjambre Forja (Fase 3: Blueprint)", tools: swarm3 },
  ];


  const allAgentsFlat = [...aiTools, ...swarm1, ...swarm2, ...swarm3];
  const selectedAgentData = allAgentsFlat.find(t => t.id === selectedChatAgentId) || { title: 'AureliOS Core' };

  return (
    <div className={`flex flex-col ${t.bg} ${t.text} relative transition-colors duration-500`} style={{ height: '100%', overflow: 'hidden' }}>
      
      <style>{`
        .markdown-body p:not(:last-child) { margin-bottom: 0.75rem; }
        .markdown-body ul { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-body ol { list-style-type: decimal; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-body li { margin-bottom: 0.25rem; }
        .markdown-body h1 { font-size: 1.5em; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-body h2 { font-size: 1.25em; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-body h3 { font-size: 1.125em; font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-body strong { font-weight: 700; }
        .markdown-body em { font-style: italic; }
        .markdown-body pre { background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 0.75rem; }
        .markdown-body code { background: rgba(0,0,0,0.1); padding: 0.1rem 0.3rem; border-radius: 0.25rem; font-family: monospace; }
      `}</style>
      {/* Top Fixed Area */}
      <div className={`shrink-0 flex items-center justify-between h-16 px-4 transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <Columns weight="duotone" size={26} className="text-[#F5A623]" />
          <h2 className="text-[20px] font-bold tracking-tight">AureliOS</h2>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedChatAgentId('aurelios-core')} title="Reset to Core" className={`hover:brightness-125 transition-opacity ${t.text}`}>
            <ArrowsClockwise size={18} />
          </button>
          <button onClick={clearChat} title="Limpiar chat" className={`hover:brightness-125 transition-opacity ${t.text}`}>
            <Trash size={18} />
          </button>

          
          <button onClick={() => setShowSetup(true)} title="Configuración de Modelo y Tema" className={`hover:brightness-125 transition-opacity ${t.text}`}>
            <Gear size={18} />
          </button>
          <button onClick={() => setShowSwarmSlider(!showSwarmSlider)} title="Ocultar/Mostrar herramientas" className={`hover:brightness-125 transition-opacity ${t.text} ${!showSwarmSlider ? 'opacity-50' : ''}`}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21.5,13.5C21.5,12.12 20.38,11 19,11C18.67,11 18.36,11.07 18.07,11.18L16,8H17C18.1,8 19,7.1 19,6C19,4.9 18.1,4 17,4H14V5C14,6.1 13.1,7 12,7C10.9,7 10,6.1 10,5V4H7C5.9,4 5,4.9 5,6C5,7.1 5.9,8 7,8H8L5.93,11.18C5.64,11.07 5.33,11 5,11C3.62,11 2.5,12.12 2.5,13.5C2.5,14.88 3.62,16 5,16H7.13L8.54,19.31C8.28,19.68 8.12,20.12 8.12,20.6C8.12,21.93 9.19,23 10.52,23C11.6,23 12.52,22.28 12.82,21.28L15.46,19.31C15.87,19.74 16.45,20 17.1,20C18.35,20 19.37,19.04 19.49,17.8L21.5,13.5Z" /></svg>
          </button>
        </div>
      </div>

      <div className={`px-4 pt-4 pb-2 shrink-0 flex flex-col transition-all duration-300 overflow-hidden ${showSwarmSlider ? 'h-[270px] opacity-100' : 'h-0 opacity-0 !pb-0'}`}>
        {/* Fixed AI Tools Header */}
        <div className="flex flex-col items-center gap-2 mb-4 relative z-10">
          <div className="flex gap-2 items-center mx-auto">
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: 0, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 0 ? t.primary : "bg-gray-500 opacity-40"}`} />
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: window.innerWidth, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 1 ? t.primary : "bg-gray-500 opacity-40"}`} />
          </div>
          
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/5 shadow-inner text-[11px] font-mono tracking-widest text-emerald-400/90 font-semibold backdrop-blur-sm">
            <Brain size={14} className="text-emerald-400" weight="duotone" />
            <span>{selectedModel.startsWith('ollama/') ? `LOCAL | ${selectedModel.replace('ollama/', '')}` : `NUBE | ${selectedModel}`}</span>
            {activeAgentName && (
              <>
                <span className="text-emerald-400/50">|</span>
                <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse">
                  <Robot size={12} weight="duotone" /> {activeAgentName}
                </span>
              </>
            )}
          </div>
        </div>

        <div 
          id="agent-carousel"
          className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-4 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={(e) => {
            const slide = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
            if (slide !== carouselSlide) setCarouselSlide(slide);
          }}
        >
          {/* Slide 1: Swarms */}
          <div className="shrink-0 w-full snap-center h-full flex flex-col pt-0 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              {/* Col 1: Enjambre Radar */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-0.5 text-center flex justify-center items-center gap-1"><Wrench size={12} /> Radar</span>
                {swarm1.map(tool => (
                  <div key={tool.id} className="relative group">
                    <button 
                      onClick={() => setSelectedChatAgentId(tool.id)} 
                      className={`w-full flex items-center justify-between p-1.5 ${t.toolBg} border ${selectedChatAgentId === tool.id ? `border-current ${t.primary}` : t.panelBorder} ${t.toolHover} rounded text-left transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden ml-1">
                        <div className="shrink-0">{tool.icon}</div>
                        <span className={`text-[10px] font-bold truncate group-hover:brightness-125 transition-all ${selectedChatAgentId === tool.id ? t.primary : ""}`}>{tool.title}</span>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                        className={` hover:brightness-125 ${t.primary} shrink-0 ml-1 cursor-pointer transition-opacity`}
                        title="Escuchar descripción"
                      >
                        <SpeakerHigh size={12} weight="fill" />
                      </div>
                    </button>
                    {/* Invisible custom tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-black border border-[#444] text-[13px] text-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:brightness-125 group-hover:visible transition-all z-[999] pointer-events-none text-center font-medium leading-relaxed">
                      {tool.desc}
                    </div>
                  </div>
                ))}
              </div>
              {/* Col 2: Enjambre Inquisidor */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-0.5 text-center flex justify-center items-center gap-1"><BugBeetle size={12} /> Inquisidor</span>
                {swarm2.map(tool => (
                  <div key={tool.id} className="relative group">
                    <button 
                      onClick={() => setSelectedChatAgentId(tool.id)} 
                      className={`w-full flex items-center justify-between p-1.5 ${t.toolBg} border ${selectedChatAgentId === tool.id ? `border-current ${t.primary}` : t.panelBorder} ${t.toolHover} rounded text-left transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden ml-1">
                        <div className="shrink-0">{tool.icon}</div>
                        <span className={`text-[10px] font-bold truncate group-hover:brightness-125 transition-all ${selectedChatAgentId === tool.id ? t.primary : ""}`}>{tool.title}</span>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                        className={` hover:brightness-125 ${t.primary} shrink-0 ml-1 cursor-pointer transition-opacity`}
                        title="Escuchar descripción"
                      >
                        <SpeakerHigh size={12} weight="fill" />
                      </div>
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-black border border-[#444] text-[13px] text-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:brightness-125 group-hover:visible transition-all z-[999] pointer-events-none text-center font-medium leading-relaxed">
                      {tool.desc}
                    </div>
                  </div>
                ))}
              </div>
              {/* Col 3: Enjambre Forja */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-0.5 text-center flex justify-center items-center gap-1"><ShieldCheck size={12} /> Forja</span>
                {swarm3.map(tool => (
                  <div key={tool.id} className="relative group">
                    <button 
                      onClick={() => setSelectedChatAgentId(tool.id)} 
                      className={`w-full flex items-center justify-between p-1.5 ${t.toolBg} border ${selectedChatAgentId === tool.id ? `border-current ${t.primary}` : t.panelBorder} ${t.toolHover} rounded text-left transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden ml-1">
                        <div className="shrink-0">{tool.icon}</div>
                        <span className={`text-[10px] font-bold truncate group-hover:brightness-125 transition-all ${selectedChatAgentId === tool.id ? t.primary : ""}`}>{tool.title}</span>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                        className={` hover:brightness-125 ${t.primary} shrink-0 ml-1 cursor-pointer transition-opacity`}
                        title="Escuchar descripción"
                      >
                        <SpeakerHigh size={12} weight="fill" />
                      </div>
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-black border border-[#444] text-[13px] text-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:brightness-125 group-hover:visible transition-all z-[999] pointer-events-none text-center font-medium leading-relaxed">
                      {tool.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Slide 2: Classic Agents */}
          <div className="shrink-0 w-full snap-center h-full flex flex-col pt-0 pb-2">
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 mb-2 text-center flex justify-center items-center gap-1"><Wrench size={12} /> God-Tier Prompts</span>
            <div className="grid grid-cols-3 gap-1.5">
              {aiTools.map(tool => (
                <div key={tool.id} className="relative group">
                    <button 
                      onClick={() => setSelectedChatAgentId(tool.id)} 
                      className={`w-full flex items-center justify-between p-1.5 ${t.toolBg} border ${selectedChatAgentId === tool.id ? `border-current ${t.primary}` : t.panelBorder} ${t.toolHover} rounded text-left transition-all duration-300`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden ml-1">
                        <div className="shrink-0">{tool.icon}</div>
                        <span className={`text-[11px] font-bold truncate group-hover:brightness-125 transition-all ${selectedChatAgentId === tool.id ? t.primary : ''}`}>{tool.title}</span>
                      </div>
                      <div 
                        onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                        className={` hover:brightness-125 ${t.primary} shrink-0 ml-2 cursor-pointer transition-opacity`}
                        title="Escuchar descripción"
                      >
                        <SpeakerHigh size={14} weight="fill" />
                      </div>
                    </button>
                    {/* Invisible custom tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-black border border-[#444] text-[13px] text-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:brightness-125 group-hover:visible transition-all z-[999] pointer-events-none text-center font-medium leading-relaxed">
                      {tool.desc}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat History / Invisible Scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center  text-base px-8 font-medium leading-relaxed">
            Selecciona un pilar de AureliOS o escribe tu visión arquitectónica para comenzar.
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[90%] min-w-0 ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 text-[14px] leading-relaxed border break-words ${
                msg.role === 'human' ? `${t.humanBubble} border-transparent rounded-xl rounded-tr-sm font-medium` : `${t.aiBubble} rounded-xl rounded-tl-sm shadow-sm`
              } transition-colors duration-500`}>
                <div className={`markdown-body max-w-none break-words ${msg.role === 'agent' ? t.text : 'text-inherit'}`}>
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              {msg.role === 'human' && (
                <div className="flex justify-end mt-1 px-1">
                  <button 
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="text-zinc-500 hover:text-blue-400 transition-colors"
                    title="Copiar mensaje"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
              {msg.role === 'agent' && (
                <div className={`flex items-center gap-3 mt-1.5 px-1 text-[11px] font-bold ${t.primary} uppercase tracking-widest opacity-75 flex-nowrap`}>
                  <Cpu size={12} />
                  <span className="opacity-90 normal-case font-semibold truncate max-w-[160px]">{msg.model || 'AureliOS'}</span>
                  <Clock size={12} className="opacity-50 ml-1 shrink-0" />
                  <span className="opacity-50 normal-case font-semibold whitespace-nowrap">{new Date(parseInt(msg.id) > 10000000000 ? parseInt(msg.id) : Date.now()).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button onClick={() => navigator.clipboard.writeText(msg.content)} title="Copiar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><Copy size={13} /></button>
                    <button onClick={() => speak(msg.content)} title="Escuchar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><SpeakerHigh size={13} /></button>
                    <button onClick={handleRegenerate} title="Regenerar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><ArrowsClockwise size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex flex-col max-w-[85%] mr-auto mt-4">
            <div className={`p-4 rounded-xl rounded-tl-sm shadow-sm font-medium ${t.aiBubble} border animate-pulse flex items-center gap-3`}>
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm tracking-wide">{thinkingPhrase}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="shrink-0 px-4 pt-2 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className={`flex-1 ${t.inputBg} border rounded-xl px-4 py-3 text-base placeholder- focus:outline-none ${t.inputFocus} shadow-inner transition-colors duration-500`}
            placeholder={`Comanda a ${selectedAgentData.title}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          {isTyping ? (
            <button
              onClick={handleStop}
              className={`px-4 py-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/50`}
              title="Detener ejecución"
            >
              <span className="text-sm font-bold uppercase tracking-wider">Detener</span>
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${input.trim() && !isTyping ? `${t.sendActive} hover:scale-105` : `${t.sendDisabled} cursor-not-allowed`}`}
            >
              <PaperPlaneRight weight="fill" size={22} />
            </button>
          )}
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px]  font-bold tracking-widest uppercase">{selectedAgentData.title} • STOIC AI ORCHESTRATOR</span>
        </div>
      </div>
      {/* Setup Modal */}
      {showSetup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-xl">
          <div className={`w-full max-w-2xl rounded-2xl border ${t.panelBorder} ${t.panelBg} shadow-2xl p-6 flex flex-col gap-6`}>
            <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-[16px] font-bold flex items-center gap-2"><Gear size={20} className={t.primary} /> Configuración de AureliOS</h3>
              <button onClick={() => setShowSetup(false)} className="hover:opacity-70 transition-opacity">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Models Column */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold flex items-center gap-2 text-[14px] uppercase tracking-wider mb-2"><Cpu size={16} /> Modelos IA</h4>
                
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/50 mt-1 mb-1">NUBE</div>
                {['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.1-70b-instruct', 'qwen/qwen-2.5-72b-instruct'].map(m => (
                  <button 
                    key={m}
                    onClick={() => setSelectedModel(m)}
                    className={`flex items-center justify-between p-2 rounded-lg border ${selectedModel === m ? `border-current ${t.primary}` : 'border-transparent hover:bg-white/5'} transition-colors text-left`}
                  >
                    <span className="text-[13px] font-medium">{m}</span>
                    {selectedModel === m && <Check size={14} weight="bold" />}
                  </button>
                ))}

                <div className="text-[11px] font-bold uppercase tracking-wider text-white/50 mt-3 mb-1">LOCAL</div>
                {['hermes3:8b', 'llama3.1:8b', 'mistral', 'qwen2.5:7b', 'phi3:3.8b'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setSelectedModel(`ollama/${m}`)}
                      className={`flex items-center justify-between p-2 rounded-lg border ${selectedModel === `ollama/${m}` ? `border-current ${t.primary}` : 'border-transparent hover:bg-white/5'} transition-colors text-left`}
                    >
                      <span className="text-[13px] font-medium">{m}</span>
                      {selectedModel === `ollama/${m}` && <Check size={14} weight="bold" />}
                    </button>
                  ))
                }
              </div>

              {/* Themes Column */}
              <div className="flex flex-col gap-1">
                <h4 className="font-bold flex items-center gap-2 text-[14px] uppercase tracking-wider mb-2"><PaintBrush size={16} /> Temas Visuales</h4>
                {Object.entries(AURELIOS_THEMES).map(([key, theme]) => (
                  <button 
                    key={key}
                    onClick={() => setCurrentThemeKey(key)}
                    className={`flex items-center justify-between p-2 rounded-lg border ${currentThemeKey === key ? `border-current ${theme.primary}` : 'border-transparent hover:bg-white/5'} transition-colors text-left`}
                  >
                    <span className="text-[13px] font-medium flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${theme.primary.replace('text-', 'bg-')}`}></span>
                      {theme.name}
                    </span>
                    {currentThemeKey === key && <Check size={14} weight="bold" className={theme.primary} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FlowDiagram: React.FC = () => {
  const { flowNodes, flowEdges, isSynthesizing, setPipelineProgress, pipelineStage, pipelineProgress } = useStudioStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  React.useEffect(() => { setNodes(flowNodes); }, [flowNodes]);
  React.useEffect(() => { setEdges(flowEdges); }, [flowEdges]);

  if (flowNodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-gray-600 gap-3">
        <Network size={40} weight="light" className="opacity-30" />
        <p className="text-sm font-medium">El diagrama aparecerá aquí en tiempo real</p>
        <p className="text-xs opacity-50">Envía un mensaje describiendo tu sistema →</p>
      </div>
    );
  }

  const meta = selectedNode ? (KIND_META[selectedNode.data?.kind || 'agent'] || KIND_META.agent) : null;

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'transparent' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={studioNodeTypes}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        attributionPosition="bottom-left"
      >
        <Background color="#0f172a" gap={24} size={1} />
        <Controls position="bottom-left" className="!bg-[#0d1117] !border-[#1e293b] !rounded-xl" />
        <MiniMap
          position="bottom-left"
          style={{ left: 60, bottom: 0 }}
          nodeColor={(n) => {
            const k = (n.data?.kind as string) || 'agent';
            const colors: Record<string,string> = { agent:'#3b82f6', trigger:'#10b981', tool:'#f59e0b', router:'#a855f7', human:'#ec4899', sink:'#64748b' };
            return colors[k] || '#3b82f6';
          }}
          maskColor="rgba(0,0,0,0.85)"
          className="!bg-[#0d1117] !border-[#1e293b]"
        />
      </ReactFlow>



      {/* Panel lateral de detalle */}
      {selectedNode && meta && (
        <div
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 280,
            background: 'rgba(10,12,20,0.97)',
            borderLeft: `2px solid ${meta.color}44`,
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            zIndex: 10,
            animation: 'slideIn 0.2s ease',
          }}
        >
          <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

          {/* Header */}
          <div style={{ background: meta.color + '18', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${meta.color}33` }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.color + '22', border: `1.5px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <meta.Icon size={16} weight="bold" style={{ color: meta.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: meta.color, textTransform: 'uppercase' }}>{meta.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedNode.data?.label}
              </div>
            </div>
            <button onClick={() => setSelectedNode(null)} style={{ all: 'unset', cursor: 'pointer', color: '#475569', padding: 4 }}>
              <X size={14} />
            </button>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Descripción */}
            {selectedNode.data?.fullDescription && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Descripción</div>
                <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {selectedNode.data.fullDescription}
                </p>
              </div>
            )}

            {/* I/O */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Contrato E/S</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {selectedNode.data?.inputPort && (
                  <div style={{ background: '#1e293b', borderRadius: 6, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>IN</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{selectedNode.data.inputPort}</span>
                  </div>
                )}
                {selectedNode.data?.outputPort && (
                  <div style={{ background: '#1e293b', borderRadius: 6, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: meta.color, fontWeight: 700 }}>OUT</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{selectedNode.data.outputPort}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tools */}
            {selectedNode.data?.allTools?.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Herramientas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(selectedNode.data.allTools as string[]).map((t: string) => (
                    <span key={t} style={{ fontSize: 10, fontFamily: 'monospace', background: meta.color + '18', color: meta.color, padding: '3px 8px', borderRadius: 5, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta info */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
                  <span>ID</span><span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{selectedNode.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
                  <span>Tipo</span><span style={{ color: meta.color, fontWeight: 700 }}>{meta.label}</span>
                </div>
                {selectedNode.data?.cost && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#475569' }}>
                    <span>Costo est.</span><span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{selectedNode.data.cost}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const AgentCarousel: React.FC = () => {
  const { agentCards, focusedAgent, setFocusedAgent, isSynthesizing, pipelineStage, pipelineProgress, synthStartTime } = useStudioStore();
  const { play, stop, isActive, currentSection } = useTTSStore();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [timeLeft, setTimeLeft] = React.useState(300);

  React.useEffect(() => {
    if (!isSynthesizing || !synthStartTime) { setTimeLeft(300); return; }
    const calcTime = () => Math.max(0, 900 - Math.floor((Date.now() - synthStartTime) / 1000));
    setTimeLeft(calcTime());
    const interval = setInterval(() => setTimeLeft(calcTime()), 1000);
    return () => clearInterval(interval);
  }, [isSynthesizing, synthStartTime]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  const handleWheel = (e: React.WheelEvent) => {
    if (focusedAgent) return;
    if (e.deltaY > 0) setCurrentIndex(prev => Math.min(agentCards.length - 1, prev + 1));
    else if (e.deltaY < 0) setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  if (isSynthesizing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center w-full h-full bg-transparent" style={{ gap: 36 }}>
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--theme-border)', animation: 'spin 2s linear infinite', opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid var(--theme-border)', animation: 'spin 1.4s linear infinite reverse', opacity: 0.6 }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-border)', fontSize: 36 }}>⚛</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontFamily: 'monospace', letterSpacing: '0.2em', color: 'var(--theme-border)', opacity: 0.8, marginBottom: 16 }}>MATCH & FUSE — TRIÁNGULO DORADO</div>
          <div style={{ fontSize: 36, color: '#ffffff', fontWeight: 800, maxWidth: 800, textAlign: 'center', minHeight: 48, lineHeight: 1.2 }}>{pipelineStage || 'Inicializando pipeline cuántico...'}</div>
        </div>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>PROGRESO REAL</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)' }}>T-{formatTime(timeLeft)}</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: 'var(--theme-border)' }}>{pipelineProgress}%</span>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 9999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 9999, width: `${pipelineProgress}%`, background: 'var(--theme-border)', boxShadow: '0 0 16px var(--theme-border)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            {[{ label: 'Genes', pct: 15 }, { label: 'Síntesis', pct: 45 }, { label: 'Evaluador', pct: 75 }, { label: 'Listo', pct: 100 }].map(({ label, pct }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', margin: '0 auto 6px', background: pipelineProgress >= pct ? 'var(--theme-border)' : 'rgba(255,255,255,0.1)', boxShadow: pipelineProgress >= pct ? '0 0 10px var(--theme-border)' : 'none', transition: 'background 0.3s, box-shadow 0.3s' }} />
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: pipelineProgress >= pct ? 'var(--theme-border)' : 'rgba(255,255,255,0.3)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (agentCards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-gray-500 gap-3">
        <Brain size={40} weight="light" className="opacity-30" />
        <p className="text-sm font-medium">Las tarjetas de agentes aparecerán aquí</p>
      </div>
    );
  }

  // Vista enfocada: Carta + Triángulo Dorado
  if (focusedAgent) {
    const card = focusedAgent;
    const isPlayingThis = isActive && currentSection === card.id;
    return (
      <div className="flex-1 flex w-full h-full bg-[#030712] p-8 gap-8 animate-in fade-in zoom-in duration-300">
        <div className="w-1/3 h-full flex flex-col">
          <div className="flex justify-between mb-4 items-center">
            <button onClick={() => setFocusedAgent(null)} className="text-white/50 hover:text-white px-4 py-2 bg-white/5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors">
              <X size={16} /> Cerrar vista detallada
            </button>
            <button 
              onClick={() => isPlayingThis ? stop() : play(card.description, card.id)}
              className={`p-3 rounded-full transition-all ${isPlayingThis ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white hover:bg-white/10'}`}
            >
              {isPlayingThis ? <Stop size={20} weight="fill" /> : <SpeakerHigh size={20} weight="duotone" />}
            </button>
          </div>
          {/* Card Solid and Large */}
          <div className="w-full flex-1 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col border" style={{ backgroundColor: '#1a1d21', borderColor: card.color || '#333' }}>
            <div className="h-2 w-full" style={{ backgroundColor: card.color }}></div>
            <div className="p-8 flex flex-col flex-1">
              <h3 className="text-3xl font-bold text-white tracking-tight leading-tight mb-2">{card.name}</h3>
              <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Robot size={18} weight="duotone" style={{ color: card.color }} /> {card.role}
              </div>
              <p className="text-lg text-white/90 leading-relaxed flex-1">{card.description}</p>
            </div>
          </div>
        </div>
        <div className="w-2/3 h-full flex flex-col pt-12">
          <h2 className="text-2xl font-bold text-white/90 mb-8 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: card.color }}></div> Triángulo Dorado
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col">
              <div className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">1. Decomposer (Genes)</div>
              <div className="flex flex-col gap-2">
                {card.genes?.map((g: any, i: number) => (
                  <div key={i} className="flex flex-col bg-black/40 p-3 rounded-lg border border-white/5">
                    <span className="text-xs text-white/40 font-bold mb-1">{g.kind}</span>
                    <span className="text-sm text-white/80">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                <div className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">2. Synthesizer</div>
                <div className="text-sm text-white/70 bg-black/40 p-4 rounded-lg font-mono">
                  {card.inputOutputContract}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex-1">
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">3. Sandbox Umpire</div>
                <div className="flex flex-wrap gap-2">
                  {card.requiredTools?.map((t: string) => (
                    <span key={t} className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg text-sm font-mono border border-emerald-500/20">{t}</span>
                  ))}
                  {(!card.requiredTools || card.requiredTools.length === 0) && <span className="text-white/30 text-sm">No tools required</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent overflow-hidden relative flex flex-col" style={{ perspective: '1200px' }} onWheel={handleWheel}>
      <div className="absolute top-6 w-full flex justify-center z-50">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 text-sm text-white/60 font-medium tracking-wide flex items-center gap-6 shadow-xl">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
            <span className="font-mono">{currentIndex + 1} / {agentCards.length}</span>
            <button onClick={() => setCurrentIndex(Math.min(agentCards.length - 1, currentIndex + 1))} disabled={currentIndex === agentCards.length - 1} className="hover:text-white disabled:opacity-30 transition-colors">Next →</button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative transform-gpu mt-12" style={{ transformStyle: 'preserve-3d' }}>
        {agentCards.map((card, index) => {
          const offset = index - currentIndex;
          const absOffset = Math.abs(offset);
          let zIndex = 100 - absOffset;
          let translateX = offset * 220;
          let rotateY = offset === 0 ? 0 : offset > 0 ? -25 : 25;
          let translateZ = absOffset * -300;
          let opacity = absOffset > 3 ? 0 : 1 - absOffset * 0.2;
          let scale = offset === 0 ? 1 : 0.85;
          
          const isPlayingThis = isActive && currentSection === card.id;

          return (
            <div 
              key={card.id}
              onClick={() => {
                if (offset === 0) setFocusedAgent(card);
                else setCurrentIndex(index);
              }}
              className="absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                width: '320px',
                height: '480px',
                marginLeft: '-160px',
                marginTop: '-240px',
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex, opacity,
                pointerEvents: (opacity === 0 ? 'none' : 'auto') as any,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="w-full h-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col group border transition-colors duration-300" 
                   style={{ backgroundColor: '#1a1d21', borderColor: offset === 0 ? (card.color || '#333') : '#222' }}>
                <div className="h-1.5 w-full opacity-80" style={{ backgroundColor: card.color }}></div>
                <div className="p-6 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{card.name}</h3>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        if (isPlayingThis) stop(); 
                        else play(card.description, card.id); 
                      }} 
                      className={`p-2 rounded-full transition-all flex-shrink-0 ml-2 ${isPlayingThis ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                      {isPlayingThis ? <Stop size={16} weight="fill" /> : <SpeakerHigh size={16} weight="duotone" />}
                    </button>
                  </div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                    <Robot size={16} weight="duotone" style={{ color: card.color }} /> {card.role}
                  </div>
                  <p className="text-[15px] text-white/80 leading-relaxed mb-6 flex-1 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }}>
                    {card.description}
                  </p>
                  {card.genes && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                       {card.genes.slice(0, 3).map((g: any, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded bg-black/40 text-white/70 border border-white/5">
                            {g.kind}
                          </span>
                       ))}
                       {card.genes.length > 3 && <span className="text-[10px] px-2 py-1 rounded bg-black/40 text-white/40">+{card.genes.length-3}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ArchitectureBlueprint: React.FC = () => {
  const { blueprintMd } = useStudioStore();

  if (!blueprintMd) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-gray-600 gap-3">
        <Cube size={40} weight="light" className="opacity-30" />
        <p className="text-sm font-medium">El blueprint aparecerá aquí</p>
        <p className="text-xs opacity-50">La respuesta completa de la IA se renderiza como documento técnico →</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-transparent overflow-y-auto p-6">
      <div className="prose prose-invert prose-sm max-w-none text-gray-200">
        <ReactMarkdown>{blueprintMd}</ReactMarkdown>
      </div>
    </div>
  );
};


  export const CanvasTabs: React.FC = () => {
    const { activeTab, setActiveTab, isSynthesizing } = useStudioStore();

    const go2WF = () => {
      const { agentCards, setFlow, setActiveTab, addChatMessage } = useStudioStore.getState();
      const nodes = agentCards.map((card, i) => ({
        id: card.id,
        type: 'agent',
        position: { x: 100 + (i % 3) * 350, y: 100 + Math.floor(i / 3) * 200 },
        data: {
          label: card.name,
          role: card.role,
          fullDescription: card.description,
          allTools: card.requiredTools || [],
          inputPort: card.inputOutputContract?.split('->')[0] || '',
          outputPort: card.inputOutputContract?.split('->')[1] || ''
        }
      }));
      setFlow(nodes, []);
      setActiveTab('discovery');
      addChatMessage({ role: 'agent', content: '✅ CHECKLIST COMPLETADO: Flujo actualizado con los AgentCards.', model: 'aurelios' });
    };

    const runMatchAndFusePipeline = async () => {

    const { flowNodes, setAgentCards, setActiveTab, setIsSynthesizing, isSynthesizing, setSynthStartTime } = useStudioStore.getState();
    if (isSynthesizing) return; // Prevent multiple concurrent executions

    setActiveTab('synthesis');
    if (flowNodes.length === 0) return;

    setIsSynthesizing(true);
    setSynthStartTime(Date.now());
    
    // UI optimista: establecemos 5% para tapar los milisegundos que tarda el WebSocket en conectar (y que por lo tanto pierde el 1er evento del backend)
    const { setPipelineProgress } = useStudioStore.getState();
    setPipelineProgress("🔍 Despertando motor cuántico...", 5);

    // AbortController con 15 minutos — el pipeline SDK tiene 3 etapas y puede tardar ~90s en Ollama, pero con contexto largo y iGPU puede llegar a 8-10 min
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);

    try {
      const selectedModel = localStorage.getItem('aurelios_model') || 'ollama/hermes3:8b';
      
      const res = await fetch(`${API_URL}/studio/match_fuse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          nodes: flowNodes.map(n => n.data),
          model: selectedModel 
        })
      });
      
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      const rawText = data.response || "";

      let jsonStr = rawText;
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) jsonStr = jsonMatch[0];
      
      try {
        const generatedCards = JSON.parse(jsonStr);
        setAgentCards(generatedCards);
      } catch (e: any) {
        throw new Error(`Parse failed. Raw: ${rawText.substring(0, 120)}...`);
      }
      
    } catch (e: any) {
      console.error("Match & Fuse v2 SDK Error:", e);
      
      const fallbackCards = [{
          id: "error-1",
          name: "Error de Sintesis",
          role: "FALLBACK",
          description: `Falló la síntesis. Error: ${e.message}`,
          color: "#EF4444",
          noveltyScore: 0.1,
          evalStatus: "FAIL",
          inputOutputContract: "IN: Error -> OUT: None",
          requiredTools: [],
          health: "red",
          genes: []
      }];
      setAgentCards(fallbackCards as any);
    } finally {
      setIsSynthesizing(false);
      setSynthStartTime(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'discovery': return <FlowDiagram />;
      case 'synthesis': return <AgentCarousel />;
      case 'blueprint': return <ArchitectureBlueprint />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', minHeight: 0 }}>
      <div className="flex shrink-0 h-16 bg-transparent">
        {(['discovery', 'synthesis', 'blueprint'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
            className={`px-6 h-full font-medium text-sm transition-colors flex items-center border-b-2 ${
              activeTab === tab
                ? 'text-blue-400 border-blue-400 bg-white/5'
                : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            {tab === 'discovery' && '1 Descubrir'}
            {tab === 'synthesis' && '2 Sintetizar'}
            {tab === 'blueprint' && '3 Blueprint'}
          </button>
        ))}
        <div className="flex-1" />
      </div>
      <div className="flex-1 flex flex-col relative min-h-0 p-4 md:p-5" style={{ background: '#030712' }}>
        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          {renderContent()}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex gap-4">
          {activeTab === 'synthesis' ? (
            <>
              <button 
                onClick={() => alert('Upgrade Cohesivo Iniciado: Fusionando genes cuánticos y prompts de sistema...')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <Brain size={18} weight="duotone" />
                Upgrade
              </button>
              <button 
                onClick={go2WF}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm bg-emerald-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Robot size={18} weight="duotone" />
                Go2WF
              </button>
            </>
          ) : (
            <button 
              onClick={runMatchAndFusePipeline}
              disabled={isSynthesizing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm ${
                isSynthesizing
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50 shadow-none'
                  : 'bg-[#00D9FF] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,217,255,0.3)]'
              }`}
            >
              <Brain size={18} weight={isSynthesizing ? "regular" : "duotone"} />
              {isSynthesizing ? 'Sintetizando...' : 'Detectar Agentes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const THINKING_PHRASES = [
  'Procesando directrices...',
  'Analizando contexto...',
  'Sintetizando vectores...',
  'Calculando arquitectura...',
  'Escribiendo respuesta...',
  'Evaluando variables...',
  'Consultando oráculos...'
];

export default function AgentOSStudio() {
  const { isSynthesizing, setPipelineProgress } = useStudioStore();

  React.useEffect(() => {
    if (!isSynthesizing) return;
    const ws = new WebSocket(WS_STUDIO_ACTIVITY_URL);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'match_fuse_progress') {
          setPipelineProgress(msg.stage || '', msg.pct ?? 0);
        }
      } catch {}
    };
    return () => ws.close();
  }, [isSynthesizing, setPipelineProgress]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        overflow: 'hidden',
        background: '#030712',
        color: 'white',
        fontFamily: 'inherit',
      }}
    >
      {/* Columna 1 — 30% — Chat */}
      <div style={{ width: '30%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #2A2A2A', flexShrink: 0, minWidth: 0 }}>
        <FlowArchitect />
      </div>

      {/* Columna 2 — 70% — Swarm Orchestration */}
      <div style={{ width: '70%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, position: 'relative' }}>
        <SwarmOrchestrationPanel />
      </div>
    </div>
  );
}

