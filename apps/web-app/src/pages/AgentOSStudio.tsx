import { useTTSStore } from '../lib/ttsStore';
import ReactMarkdown from 'react-markdown';
import React, { useState, useEffect, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { studioNodeTypes, KIND_META } from '../components/StudioNodes';
import { SwarmOrchestrationPanel } from '../components/studio/SwarmOrchestrationPanel';
import { useStudioStore, TabId, parseAIResponseToFlow, detectKind } from '../stores/useStudioStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { API_URL, WS_STUDIO_ACTIVITY_URL } from '../lib/api';
import { Gear, Archive, Star, MagnifyingGlass, X, Check, Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush, Copy, ArrowsClockwise, Clock, Stop, Microphone, Database, Globe, TerminalWindow, FileText, CodeBlock, Scan, AppWindow, File, MaskHappy, Chats, ArrowUUpLeft, ArrowUUpRight, FloppyDisk } from '@phosphor-icons/react';


import remarkGfm from 'remark-gfm';

const AURELIOS_THEMES: Record<string, any> = {
  obsidian: {
    name: 'Obsidian Emperor', bg: 'bg-zinc-950', text: 'text-white', border: 'border-zinc-800',
    panelBg: 'bg-zinc-900', panelBorder: 'border-zinc-700', primary: 'text-cyan-400',
    toolBg: 'bg-zinc-800', toolHover: 'hover:border-zinc-500', aiBubble: 'bg-zinc-900 border-zinc-700 text-zinc-100',
    humanBubble: 'bg-green-500/10 border border-green-500/30 text-green-400', inputBg: 'bg-zinc-900 border-zinc-700', inputFocus: 'focus:border-cyan-400',
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

const FreeChatCapabilitiesGrid = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { freeChatFiles, addFreeChatFiles, screenStream, setScreenStream } = useStudioStore();

  React.useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const toggleScreenShare = async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setScreenStream(stream);
        stream.getVideoTracks()[0].onended = () => { setScreenStream(null); };
      } catch (err) { console.error("Error sharing screen", err); }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFreeChatFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-4 gap-1.5 mt-4 px-2 pb-2 w-full animate-in fade-in slide-in-from-top-2 duration-300">
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.pdf,.md,.csv,.json" />
      
      <div onClick={() => fileInputRef.current?.click()} className="bg-black/40 border border-white/5 rounded-none pl-[0.5cm] py-3 pr-2 hover:border-green-500/50 transition-colors cursor-pointer group flex items-center gap-3">
        <Database size={32} className="text-gray-400 group-hover:text-green-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-300 group-hover:text-green-400 leading-tight">Ingesta</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Docs locales</p>
          {freeChatFiles.length > 0 && <p className="text-[11px] text-green-400 mt-0.5 leading-tight">{freeChatFiles.length} listos</p>}
        </div>
      </div>
      
      <div className="bg-black/40 border border-white/5 rounded-none pl-[0.5cm] py-3 pr-2 hover:border-green-500/50 transition-colors cursor-pointer group flex items-center gap-3">
        <Globe size={32} className="text-gray-400 group-hover:text-green-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-300 group-hover:text-green-400 leading-tight">Web</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Internet real</p>
        </div>
      </div>
      
      <div onClick={toggleScreenShare} className={`bg-black/40 border ${screenStream ? 'border-cyan-500' : 'border-white/5'} rounded-none pl-[0.5cm] py-3 pr-2 hover:border-cyan-500/50 transition-colors cursor-pointer group flex items-center gap-3`}>
        <TerminalWindow size={32} className={`${screenStream ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-400'} shrink-0`}/>
        <div className="flex flex-col justify-center">
          <h4 className={`font-bold text-[13px] leading-tight ${screenStream ? 'text-cyan-400' : 'text-gray-300 group-hover:text-cyan-400'}`}>
            {screenStream ? 'Activa' : 'Pantalla'}
          </h4>
          <p className="text-[11px] text-gray-500 leading-tight">Transmite PC</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <MaskHappy size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">RolPlay</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Personajes</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <Chats size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">Talk</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Voz fluida</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <TerminalWindow size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">CLI</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Terminal</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <PaintBrush size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">UI</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Render vivo</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <HardDrives size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">RAG</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Memoria</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <Scan size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">Crawler</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Scraping</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <CodeBlock size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">Sandbox</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Aislado</p>
        </div>
      </div>

      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <AppWindow size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">Control</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Computer</p>
        </div>
      </div>
      
      <div className="bg-black/40 border border-white/5 opacity-40 rounded-none pl-[0.5cm] py-3 pr-2 flex items-center gap-3 cursor-not-allowed">
        <Network size={32} className="text-gray-400 shrink-0"/>
        <div className="flex flex-col justify-center">
          <h4 className="font-bold text-[13px] text-gray-400 leading-tight">Enjambre</h4>
          <p className="text-[11px] text-gray-500 leading-tight">Paralelo</p>
        </div>
      </div>
    </div>
  );
};

const FlowArchitect: React.FC = () => {
    const { chatMessages, chatHistories, rollupCurrentChat, toggleMessageStar, saveProject, resetProject, addChatMessage, addActivityLog, setFlow, setAgentCards, setBlueprintMd, setTriggerChatSend, activityLogs, quantumPhase, setQuantumPhase, } = useStudioStore();
    const [input, setInput] = useState('');
    const [chatSearch, setChatSearch] = useState('');
    const [showStarredOnly, setShowStarredOnly] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleListen = () => {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        return;
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Tu navegador no soporta el dictado por voz de forma nativa. Usa Chrome o Edge.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim());
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech rec error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      recognitionRef.current = recognition;
    };
    const [isTyping, setIsTyping] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('aurelios-core');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [currentThemeKey, setCurrentThemeKey] = useState(() => localStorage.getItem('aurelios_theme') || 'obsidian');
  const [selectedChatAgentId, setSelectedChatAgentId] = useState('aurelios-core');
  const [carouselSlide, setCarouselSlide] = useState(0);
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
    useStudioStore.getState().saveFlowState(); // Punto de retorno antes de borrar TODO
    useStudioStore.setState({ 
      chatMessages: [],
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

    
    // --- OMNICHAT ROUTING ---
    let targetPhase = quantumPhase;
    let actualPrompt = textToSend;

    if (textToSend.trim().toLowerCase().startsWith('/flow')) {
         targetPhase = 'phase1_triage';
         actualPrompt = textToSend.substring(5).trim();
         setQuantumPhase('phase1_triage');
    } else if (textToSend.trim().toLowerCase().startsWith('/free')) {
         targetPhase = 'omni';
         actualPrompt = textToSend.substring(5).trim();
         setQuantumPhase('omni');
    }

    if (targetPhase === 'omni') {
        // FREECHAT MODE
        addActivityLog({ source: 'AureliOS OmniChat', message: 'Ejecutando Modo Sandbox...', status: 'FREECHAT' });
        
        const doFreeChat = async () => {
          try {
            const { freeChatFiles } = useStudioStore.getState();
            
            let uploadedFiles = [];
            
            if (freeChatFiles && freeChatFiles.length > 0) {
              addActivityLog({ source: 'AureliOS OmniChat', message: `Procesando ${freeChatFiles.length} archivo(s)...`, status: 'FREECHAT' });
              
              for (const file of freeChatFiles) {
                const buffer = await file.arrayBuffer();
                const base64Str = btoa(
                  new Uint8Array(buffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                uploadedFiles.push({
                  name: file.name,
                  mime_type: file.type || 'application/octet-stream',
                  data: base64Str
                });
              }
              useStudioStore.setState({ freeChatFiles: [] });
            }
  
            const payload = {
              messages: chatMessages.concat({ role: 'human', content: actualPrompt, id: crypto.randomUUID() }),
              files: uploadedFiles.length > 0 ? uploadedFiles : undefined
            };
  
            const res = await fetch(`${API_URL}/studio/freechat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: abortControllerRef.current?.signal
            });
            if (!res.ok) throw new Error(`Error en OmniChat: ${res.status}`);
            
            const data = await res.json();
            
            let rawReply = data.reply;
            const swarmRegex = /<swarm>([\s\S]*?)<\/swarm>/g;
            let swarmMatch;
            while ((swarmMatch = swarmRegex.exec(rawReply)) !== null) {
              addChatMessage({ role: 'swarm', content: swarmMatch[1].trim(), model: selectedModel });
              rawReply = rawReply.replace(swarmMatch[0], '');
            }

            const { nodes, edges, md } = parseAIResponseToFlow(rawReply);
            if (md.trim()) {
              addChatMessage({ role: 'agent', content: md, model: selectedModel });
            }
            setIsTyping(false);
            isHandlingSendRef.current = false;
            
            if (nodes.length > 0) {
               useStudioStore.getState().setFlow(nodes, edges);
               useStudioStore.getState().setZone2ActiveTab('infinityboard');
            }

          } catch (error: any) {
            if (error.name !== 'AbortError') {
              console.error(error);
              addChatMessage({ role: 'agent', content: `[ERROR] No se pudo completar la operacion en modo Sandbox.`, model: 'System' });
            }
            setIsTyping(false);
            isHandlingSendRef.current = false;
          }
        };
        
        doFreeChat();
        return;
    }
    // ORCHESTRATOR MODE (PHASES)
    

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
          setZone2ActiveTab('phases');
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
            const cleanText = text.replace(/\[ES_ENTREVISTA\]/g, '').trim();
            console.log('[AureliOS] Triage needs interview. Clean text:', cleanText);
            // Mostrar la respuesta del agente también en el chat para que el usuario pueda "charlar" y leer las aclaraciones
            addChatMessage({ role: 'agent', content: cleanText, model: selectedModel });
            
            // Usar un setTimeout mínimo para garantizar que el ID cambie incluso si la máquina es absurdamente rápida (aunque con Math.random() ya está solucionado).
            setTimeout(() => {
              addChatMessage({ role: 'agent', content: '> [AureliOS] Triage ha actualizado las preguntas. Puedes responder aquí o en la pestaña **Fase 1: Triage**.', model: 'Orchestrator' });
            }, 10);
            
            const currentPhase1 = useStudioStore.getState().phase1Interview || '';
            const newPhase1 = currentPhase1 
              ? currentPhase1.replace('\n\n---\n*AureliOS está analizando tus respuestas...*', '') + `\n\n---\n**🤖 Respuesta/Entrevista del Enjambre:**\n\n${cleanText}`
              : cleanText;
            console.log('[AureliOS] Setting phase1Interview to:', newPhase1);
            useStudioStore.getState().setPhase1Interview(newPhase1);
            useStudioStore.getState().setZone2ActiveTab('phases');
            setQuantumPhase('phase1_triage');
            break; 
          } else {
            // Fallback si no hay tag
            addChatMessage({ role: 'agent', content: text, model: selectedModel });
            break;
          }
        }

        if (currentPhase === 'phase2_extraction') {
          setZone2ActiveTab('phases');

          // Si el usuario aceptó explícitamente, saltamos la validación del LLM y sellamos la fase
          if (currentData.includes('Acepto el contrato de la fase 2')) {
            addChatMessage({ role: 'agent', content: '> [AureliOS] Contrato Aprobado. Procediendo a Fase 3...', model: 'Orchestrator' });
            setPhase2Complete(true);
            currentPhase = 'phase3_blueprint';
            currentData = useStudioStore.getState().phase2Content || '';
            continue;
          }

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
          setZone2ActiveTab('phases');
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
          <button onClick={() => setShowStarredOnly(!showStarredOnly)} title="Ver solo favoritos" className={`transition-colors ${showStarredOnly ? 'text-yellow-400' : `hover:text-yellow-400 ${t.text}`}`}>
            <Star size={18} weight={showStarredOnly ? 'fill' : 'regular'} />
          </button>
          
          <div className="relative group">
            <MagnifyingGlass size={18} className={`absolute left-2 top-1/2 -translate-y-1/2 opacity-50 ${t.text}`} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className={`w-24 focus:w-40 transition-all duration-300 pl-8 pr-2 py-1 text-xs rounded-full bg-black/20 border ${t.border} outline-none ${t.text}`}
            />
          </div>

          <button onClick={clearChat} title="Limpiar chat" className={`hover:brightness-125 transition-opacity ${t.text}`}>
            <Trash size={18} />
          </button>

          <button onClick={() => rollupCurrentChat()} title="Comprimir Historial (Rollup)" className={`hover:text-purple-400 transition-colors ${t.text}`}>
            <Archive size={18} />
          </button>
          
          <button onClick={() => saveProject()} title="Guardar Proyecto" className={`hover:text-green-400 transition-colors ${t.text}`}>
            <FloppyDisk size={18} />
          </button>

          <button onClick={() => setShowSetup(true)} title="Configuración de Modelo y Tema" className={`hover:brightness-125 transition-opacity ${t.text}`}>
            <Gear size={18} />
          </button>
        </div>
      </div>

      {/* Model Pill (Always visible) */}
      <div className="flex flex-col items-center gap-2 mb-2 relative z-10 px-4 pt-4 shrink-0">
        {quantumPhase !== 'omni' && (
          <div className="flex gap-2 items-center mx-auto">
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: 0, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 0 ? t.primary : "bg-gray-500 opacity-40"}`} />
            <button onClick={() => document.getElementById("agent-carousel")?.scrollTo({ left: window.innerWidth, behavior: "smooth" })} className={`w-2 h-2 rounded-full transition-colors duration-300 ${carouselSlide === 1 ? t.primary : "bg-gray-500 opacity-40"}`} />
          </div>
        )}
        
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/30 border border-white/5 shadow-inner text-[11px] font-mono tracking-widest text-emerald-400/90 font-semibold backdrop-blur-sm">
          <Brain size={14} className="text-emerald-400" weight="duotone" />
          <span>{selectedModel.startsWith('ollama/') ? `LOCAL | ${selectedModel.replace('ollama/', '')}` : `NUBE | ${selectedModel}`}</span>
          {activeAgentName && quantumPhase !== 'omni' && (
            <>
              <span className="text-emerald-400/50">|</span>
              <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse">
                <Robot size={12} weight="duotone" /> {activeAgentName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Chat History / Invisible Scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.length === 0 && (!chatHistories || chatHistories.length === 0) ? (
          <div className="flex h-full items-center justify-center text-center text-base px-8 font-medium leading-relaxed">
            Selecciona un pilar de AureliOS o escribe tu visión arquitectónica para comenzar.
          </div>
        ) : (
          <>
          {chatHistories && chatHistories.map(history => {
            const filteredMsgs = history.messages.filter(msg => {
              if (showStarredOnly && !msg.starred) return false;
              if (chatSearch && !msg.content.toLowerCase().includes(chatSearch.toLowerCase())) return false;
              return true;
            });
            if (filteredMsgs.length === 0) return null;
            return (
              <details key={history.id} className={`w-full border ${t.border} rounded-lg mb-2 cursor-pointer`}>
                <summary className={`p-2 font-bold ${t.text} bg-black/10 hover:bg-black/20 transition-colors`}>
                  <Cube className="inline mr-2" /> {history.name} ({filteredMsgs.length} msgs)
                </summary>
                <div className="p-4 flex flex-col gap-4 border-t" style={{ borderColor: 'inherit' }}>
                  {filteredMsgs.map(msg => (
                    <div key={msg.id} className={`flex flex-col max-w-[90%] min-w-0 ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
                      {msg.role === 'swarm' ? (
                        <details className={`w-full border ${t.border} rounded-lg mb-2 shadow-sm`}>
                          <summary className={`p-3 font-semibold ${t.text} bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer transition-colors flex items-center`}>
                            <Cpu className="inline mr-2 text-purple-400 animate-pulse" /> Enjambre en Ejecución (Discusión)
                          </summary>
                          <div className="p-4 flex flex-col gap-3 border-t bg-black/40" style={{ borderColor: 'inherit' }}>
                            <div className={`text-xs font-mono whitespace-pre-wrap ${t.text} opacity-80`}>
                              {msg.content}
                            </div>
                          </div>
                        </details>
                      ) : (
                        <div className={`p-3 text-[14px] leading-relaxed break-words relative ${
                          msg.role === 'human' ? `${t.humanBubble} rounded-xl rounded-tr-sm font-medium` : `${t.aiBubble} border rounded-xl rounded-tl-sm shadow-sm`
                        } transition-colors duration-500`}>
                          <button onClick={() => toggleMessageStar(msg.id)} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity opacity-0 group-hover:opacity-100 ${msg.starred ? 'text-yellow-400 opacity-100' : 'text-zinc-500'}`}>
                            <Star size={16} weight={msg.starred ? 'fill' : 'regular'} />
                          </button>
                          <div className={msg.role === 'agent' ? `markdown-body max-w-none break-words ${t.text}` : 'whitespace-pre-wrap'}>
                            {msg.role === 'agent' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown> : msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )
          })}
          {chatMessages.filter(msg => {
            if (showStarredOnly && !msg.starred) return false;
            if (chatSearch && !msg.content.toLowerCase().includes(chatSearch.toLowerCase())) return false;
            return true;
          }).map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[90%] min-w-0 ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              {msg.role === 'swarm' ? (
                <details className={`w-full border ${t.border} rounded-lg mb-2 shadow-sm`}>
                  <summary className={`p-3 font-semibold ${t.text} bg-purple-500/10 hover:bg-purple-500/20 cursor-pointer transition-colors flex items-center`}>
                    <Cpu className="inline mr-2 text-purple-400 animate-pulse" /> Enjambre en Ejecución (Discusión)
                  </summary>
                  <div className="p-4 flex flex-col gap-3 border-t bg-black/40" style={{ borderColor: 'inherit' }}>
                    <div className={`text-xs font-mono whitespace-pre-wrap ${t.text} opacity-80`}>
                      {msg.content}
                    </div>
                  </div>
                </details>
              ) : (
                <div className={`p-3 text-[14px] leading-relaxed break-words relative group ${
                  msg.role === 'human' ? `${t.humanBubble} rounded-xl rounded-tr-sm font-medium` : `${t.aiBubble} border rounded-xl rounded-tl-sm shadow-sm`
                } transition-colors duration-500`}>
                  <button onClick={() => toggleMessageStar(msg.id)} className={`absolute -left-6 top-1/2 -translate-y-1/2 transition-opacity opacity-0 group-hover:opacity-100 ${msg.starred ? 'text-yellow-400 opacity-100' : 'text-zinc-500'}`}>
                    <Star size={16} weight={msg.starred ? 'fill' : 'regular'} />
                  </button>
                  <div className={msg.role === 'agent' ? `markdown-body max-w-none break-words ${t.text}` : 'whitespace-pre-wrap'}>
                    {msg.role === 'agent' ? (
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              )}
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
          }
          </>
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
            <>
              
                <button
                  onClick={toggleListen}
                  className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                    isListening ? 'bg-emerald-500 text-emerald-950 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]' : t.sendDisabled
                  } hover:scale-105`}
                  title={isListening ? "Detener grabación" : "Dictar por voz"}
                >
                  <Microphone weight={isListening ? "fill" : "duotone"} size={22} />
                </button>
                <button
                  onClick={() => handleSend()}
                  className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${
                    input.trim() && !isTyping ? `${t.sendActive} hover:scale-105` : `${t.sendDisabled} cursor-not-allowed`
                  }`}
                >
                  <PaperPlaneRight weight="fill" size={22} />
                </button>
              </>
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
  const { flowNodes, flowEdges, isSynthesizing, setPipelineProgress, pipelineStage, pipelineProgress, showLegend, setShowLegend, showMiniMap, setShowMiniMap, undoFlow, redoFlow, pastFlows, futureFlows } = useStudioStore();
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

  const handleNodeDragStart = () => {
    useStudioStore.getState().saveFlowState();
  };

  const handleNodeDragStop = () => {
    useStudioStore.getState().setFlow(nodes, edges);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', background: 'transparent' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={studioNodeTypes}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={(_, node) => setSelectedNode(node)}
        onPaneClick={() => setSelectedNode(null)}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        attributionPosition="bottom-left"
      >
        
          <Panel position="top-left" className="!m-4">
            <div className="bg-[#0d1117]/90 backdrop-blur-md border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2 shadow-xl">
              <h3 className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-widest">Leyenda de Nodos</h3>
              {Object.entries(KIND_META).map(([k, meta]) => {
                const Icon = meta.Icon;
                return (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${meta.color}22`, border: `1px solid ${meta.color}66` }}>
                      <Icon size={14} weight="bold" style={{ color: meta.color }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#cbd5e1' }}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
<Background color="#0f172a" gap={24} size={1} />
        
        {showMiniMap && (
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
      )}
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

  const [dragStartX, setDragStartX] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (!isSynthesizing || !synthStartTime) { setTimeLeft(300); return; }
    const calcTime = () => Math.max(0, 1200 - Math.floor((Date.now() - synthStartTime) / 1000));
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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (focusedAgent) return;
    setDragStartX(e.clientX);
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX !== null) {
      if (Math.abs(e.clientX - dragStartX) > 10) setIsDragging(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (focusedAgent || dragStartX === null) return;
    const deltaX = e.clientX - dragStartX;
    if (deltaX > 50) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    } else if (deltaX < -50) {
      setCurrentIndex(prev => Math.min(agentCards.length - 1, prev + 1));
    }
    setDragStartX(null);
    setTimeout(() => setIsDragging(false), 50);
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
        <div className="w-2/3 h-full flex flex-col pt-8 pl-4 pb-8">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
              <div className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ background: card.color }}></div> 
              Triángulo Dorado
            </h2>
            <p className="text-white/40 mt-2 text-sm ml-8">Análisis forense de la creación autónoma del agente</p>
          </div>
          
          <div className="flex items-stretch gap-3 flex-1 h-0">
            {/* Step 1: Decomposer */}
            <div className="flex-1 bg-[#111318] border border-blue-500/20 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-blue-500/40 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                    <Network size={24} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">Etapa 1</div>
                    <div className="text-lg font-bold text-white/90 tracking-tight">Decomposer</div>
                  </div>
                </div>
                <p className="text-[13px] text-white/40 mb-5 leading-relaxed">Extracción del ADN cognitivo, políticas y directrices operativas a partir del contexto.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
                  {card.genes?.map((g: any, i: number) => (
                    <div key={i} className="flex flex-col bg-black/30 p-3.5 rounded-xl border border-white/5 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/40 rounded-l-xl"></div>
                      <span className="text-[11px] text-blue-300 font-bold mb-1.5 pl-2 uppercase tracking-wide">{g.kind}</span>
                      <span className="text-[13px] text-white/70 pl-2 leading-relaxed">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-white/10">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>

            {/* Step 2: Synthesizer */}
            <div className="flex-1 bg-[#111318] border border-purple-500/20 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-purple-500/40 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
                    <Cpu size={24} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-purple-500/80 uppercase tracking-widest">Etapa 2</div>
                    <div className="text-lg font-bold text-white/90 tracking-tight">Synthesizer</div>
                  </div>
                </div>
                <p className="text-[13px] text-white/40 mb-5 leading-relaxed">Fusión de genes en un contrato de entrada/salida estructurado para el bucle de razonamiento.</p>
                
                <div className="flex-1 flex flex-col">
                   <div className="bg-black/30 border border-purple-500/10 rounded-xl p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                      <div className="text-[10px] text-purple-400/70 font-bold uppercase tracking-widest mb-3">Contrato I/O</div>
                      <div className="font-mono text-[13px] text-white/80 leading-loose">
                         {card.inputOutputContract?.includes('->') ? card.inputOutputContract.split('->').map((part: string, idx: number) => (
                            <div key={idx} className="mb-3 bg-white/5 p-3 rounded-lg border border-white/5">
                               {idx === 0 ? <span className="text-purple-400 font-bold block mb-1">IN:</span> : <span className="text-pink-400 font-bold block mb-1">OUT:</span>}
                               {part.replace('IN:','').replace('OUT:','').trim()}
                            </div>
                         )) : <div className="bg-white/5 p-3 rounded-lg border border-white/5">{card.inputOutputContract}</div>}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center text-white/10">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>

            {/* Step 3: Sandbox */}
            <div className="flex-1 bg-[#111318] border border-emerald-500/20 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <Wrench size={24} weight="duotone" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Etapa 3</div>
                    <div className="text-lg font-bold text-white/90 tracking-tight">Sandbox Umpire</div>
                  </div>
                </div>
                <p className="text-[13px] text-white/40 mb-5 leading-relaxed">Simulación de ejecución y dotación de herramientas y APIs accionables para el mundo real.</p>
                
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
                  <div className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest mb-1">Caja de Herramientas</div>
                  {card.requiredTools?.map((t: string) => (
                    <div key={t} className="flex items-start gap-3 bg-black/30 p-3.5 rounded-xl border border-emerald-500/10">
                       <TerminalWindow size={16} className="text-emerald-500/60 mt-0.5 flex-shrink-0" weight="duotone" />
                       <span className="text-[13px] font-mono text-emerald-100/90 leading-snug break-words">{t}</span>
                    </div>
                  ))}
                  {(!card.requiredTools || card.requiredTools.length === 0) && (
                     <div className="flex items-center justify-center h-20 border border-dashed border-white/10 rounded-xl text-white/30 text-xs">
                        Operación puramente cognitiva
                     </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 bg-transparent overflow-hidden relative flex flex-col touch-pan-y" 
      style={{ perspective: '1200px' }} 
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute top-6 w-full flex justify-center z-50">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 text-sm text-white/60 font-medium tracking-wide flex items-center gap-6 shadow-xl pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.max(0, currentIndex - 1)); }} disabled={currentIndex === 0} className="hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
            <span className="font-mono cursor-default">{currentIndex + 1} / {agentCards.length}</span>
            <button onClick={(e) => { e.stopPropagation(); setCurrentIndex(Math.min(agentCards.length - 1, currentIndex + 1)); }} disabled={currentIndex === agentCards.length - 1} className="hover:text-white disabled:opacity-30 transition-colors">Next →</button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 relative transform-gpu mt-12" style={{ transformStyle: 'preserve-3d' }}>
        {agentCards.map((card, index) => {
          const offset = index - currentIndex;
          const absOffset = Math.abs(offset);
          let zIndex = 100 - absOffset;
          let translateX = offset * 320; // Increased spacing for even larger cards
          let rotateY = offset === 0 ? 0 : offset > 0 ? -20 : 20; 
          let translateZ = absOffset * -350; 
          let opacity = absOffset > 3 ? 0 : 1 - absOffset * 0.2;
          let scale = offset === 0 ? 1 : 0.85;
          
          const isPlayingThis = isActive && currentSection === card.id;

          return (
            <div 
              key={card.id}
              onClick={() => {
                if (isDragging) return;
                if (offset === 0) setFocusedAgent(card);
                else setCurrentIndex(index);
              }}
              className="absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                width: '460px', // Extra large
                height: '660px', // Extra large
                marginLeft: '-230px',
                marginTop: '-330px',
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex, opacity,
                pointerEvents: (opacity === 0 ? 'none' : 'auto') as any,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="w-full h-full rounded-2xl shadow-2xl relative overflow-hidden flex flex-col group border transition-colors duration-300" 
                   style={{ backgroundColor: '#1a1d21', borderColor: offset === 0 ? (card.color || '#333') : '#222' }}>
                <div className="h-1.5 w-full opacity-80" style={{ backgroundColor: card.color }}></div>
                <div className="p-8 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-5">
                    <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">{card.name}</h3>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        if (isPlayingThis) stop(); 
                        else play(card.description, card.id); 
                      }} 
                      className={`p-3 rounded-full transition-all flex-shrink-0 ml-3 ${isPlayingThis ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                      {isPlayingThis ? <Stop size={20} weight="fill" /> : <SpeakerHigh size={20} weight="duotone" />}
                    </button>
                  </div>
                  <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Robot size={20} weight="duotone" style={{ color: card.color }} /> {card.role}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 mb-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    <p className="text-[16px] text-white/80 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  {card.genes && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                       {card.genes.slice(0, 3).map((g: any, i: number) => (
                          <span key={i} className="text-xs px-2.5 py-1.5 rounded-md bg-black/40 text-white/70 border border-white/5">
                            {g.kind}
                          </span>
                       ))}
                       {card.genes.length > 3 && <span className="text-xs px-2.5 py-1.5 rounded-md bg-black/40 text-white/40">+{card.genes.length-3}</span>}
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
      const { agentCards, flowNodes, flowEdges, setFlow, saveFlowState, setActiveTab, addChatMessage } = useStudioStore.getState();
      
      saveFlowState(); // Guardar historial antes de modificar

      let cardIndex = 0;
      const updatedNodes = flowNodes.map(node => {
        // Actualizamos los nodos abstractos con los perfiles detallados
        if ((node.type === 'agent' || node.type === 'mainPrompt' || node.data?.kind === 'agent') && cardIndex < agentCards.length) {
          const card = agentCards[cardIndex];
          cardIndex++;
          return {
            ...node,
            type: node.type || detectKind(card.name, card.description),
            data: {
              ...node.data,
              kind: node.data?.kind || detectKind(card.name, card.description),
              label: card.name,
              role: card.role,
              fullDescription: card.description,
              allTools: card.requiredTools || [],
              inputPort: card.inputOutputContract?.split('->')[0] || '',
              outputPort: card.inputOutputContract?.split('->')[1] || ''
            }
          };
        }
        return node;
      });

      // Si el motor descubrió más agentes de los que había en el grafo original, los añadimos debajo
      const maxExistingY = flowNodes.reduce((max, node) => Math.max(max, node.position.y), 0);
      const startY = maxExistingY > 0 ? maxExistingY + 250 : 100;

      const newNodes = [];
      for (let i = cardIndex; i < agentCards.length; i++) {
        const card = agentCards[i];
        const inferredKind = detectKind(card.name, card.description);
        newNodes.push({
          id: card.id,
          type: inferredKind,
          position: { x: 100 + ((i - cardIndex) % 3) * 350, y: startY + Math.floor((i - cardIndex) / 3) * 200 },
          data: {
            kind: inferredKind,
            label: card.name,
            role: card.role,
            fullDescription: card.description,
            allTools: card.requiredTools || [],
            inputPort: card.inputOutputContract?.split('->')[0] || '',
            outputPort: card.inputOutputContract?.split('->')[1] || ''
          }
        });
      }

      // Reemplazamos los nodos fusionados y añadimos los nuevos
      setFlow([...updatedNodes, ...newNodes], flowEdges);
      setActiveTab('discovery');
      addChatMessage({ role: 'agent', content: '✨ FUSIÓN COMPLETADA: Los perfiles sintetizados se han inyectado en el grafo, actualizando los nodos base y preservando sus conexiones.', model: 'aurelios' });
    };

        const runMatchAndFusePipeline = async () => {
      (window as any).runMatchAndFuse = runMatchAndFusePipeline;

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
    const timeoutId = setTimeout(() => controller.abort(), 20 * 60 * 1000);

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
      const jsonMatch = rawText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
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

  const recoverBaseFlow = () => {
    const { phase3Content, agentCards, setFlow, saveFlowState } = useStudioStore.getState();
    if (phase3Content) {
      saveFlowState(); // Guardar antes de modificar

      // 1. Restaurar los nodos originales desde el markdown base
      const { nodes: baseNodes, edges: baseEdges } = parseAIResponseToFlow(phase3Content);
      
      // 2. Fusionar las tarjetas (AgentCards) con los nodos base
      let cardIndex = 0;
      const updatedNodes = baseNodes.map(node => {
        if ((node.type === 'agent' || node.type === 'mainPrompt' || node.data?.kind === 'agent') && cardIndex < agentCards.length) {
          const card = agentCards[cardIndex];
          cardIndex++;
          return {
            ...node,
            type: node.type || detectKind(card.name, card.description),
            data: {
              ...node.data,
              kind: node.data?.kind || detectKind(card.name, card.description),
              label: card.name,
              role: card.role,
              fullDescription: card.description,
              allTools: card.requiredTools || [],
              inputPort: card.inputOutputContract?.split('->')[0] || '',
              outputPort: card.inputOutputContract?.split('->')[1] || ''
            }
          };
        }
        return node;
      });

      // Si sobran agentCards, se añaden debajo
      const maxExistingY = baseNodes.reduce((max, node) => Math.max(max, node.position.y), 0);
      const startY = maxExistingY > 0 ? maxExistingY + 250 : 100;

      const newNodes = [];
      for (let i = cardIndex; i < agentCards.length; i++) {
        const card = agentCards[i];
        const inferredKind = detectKind(card.name, card.description);
        newNodes.push({
          id: card.id,
          type: inferredKind,
          position: { x: 100 + ((i - cardIndex) % 3) * 350, y: startY + Math.floor((i - cardIndex) / 3) * 200 },
          data: {
            kind: inferredKind,
            label: card.name,
            role: card.role,
            fullDescription: card.description,
            allTools: card.requiredTools || [],
            inputPort: card.inputOutputContract?.split('->')[0] || '',
            outputPort: card.inputOutputContract?.split('->')[1] || ''
          }
        });
      }

      // 3. Establecer el grafo fusionado
      setFlow([...updatedNodes, ...newNodes], baseEdges);
    } else {
      console.warn("No base markdown content found to recover.");
    }
  };

  const { undoFlow, redoFlow, pastFlows, futureFlows } = useStudioStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', minHeight: 0 }}>
      <div className="flex shrink-0 h-16 bg-transparent items-center pr-4">
        <div className="flex h-full">
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
        </div>
        <div className="flex-1" />
        {activeTab === 'discovery' && (
          <div className="flex items-center gap-3">
            
            {/* New Toolbar Actions */}
            <div className="flex bg-black/40 rounded-full overflow-hidden border border-white/10">
              <button onClick={() => (window as any).runMatchAndFuse()} disabled={isSynthesizing} title="Detectar Agentes" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border-r border-white/10">
                 <Brain size={16} weight={isSynthesizing ? "regular" : "duotone"} className={isSynthesizing ? "text-gray-500" : "text-[#00D9FF]"} />
              </button>
              <button onClick={() => alert('Fusión Infinita: El motor ahora analizará las conexiones (Edges) de tu grafo para orquestar y evolucionar todos los agentes cohesivamente.')} title="Upgrade" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-white/10 hover:text-white border-r border-white/10">
                 <Network size={16} weight="duotone" className="text-purple-400" />
              </button>
              <button onClick={() => useStudioStore.getState().setShowLegend(!useStudioStore.getState().showLegend)} title="Toggle Nodos" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-white/10 hover:text-white border-r border-white/10">
                 <div className="font-bold text-xs text-blue-400">N</div>
              </button>
              <button onClick={() => useStudioStore.getState().setShowMiniMap(!useStudioStore.getState().showMiniMap)} title="Toggle Mapa" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-white/10 hover:text-white">
                 <div className="font-bold text-xs text-green-400">M</div>
              </button>
                <button onClick={() => { useStudioStore.getState().saveFlowState(); useStudioStore.getState().setFlow([], []); }} title="Limpiar Lienzo" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-red-500/20 hover:text-red-400 border-l border-white/10">
                   <Trash size={16} weight="duotone" className="text-red-400" />
                </button>
                <button onClick={() => { useStudioStore.getState().saveFlowState(); alert("Estado guardado en el Historial (Autoguardado siempre activo en cache local)."); }} title="Guardar / Autoguardado" className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold hover:bg-green-500/20 hover:text-green-400 border-l border-white/10">
                   <FloppyDisk size={16} weight="duotone" className="text-green-400" />
                </button>
            </div>

            <div className="flex bg-black/40 rounded-full overflow-hidden border border-white/10">
              <button 
                onClick={undoFlow}
                disabled={pastFlows.length === 0}
                title="Deshacer acción en el flujo"
                className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed border-r border-white/10"
              >
                <ArrowUUpLeft size={14} weight="bold" />
              </button>
              <button 
                onClick={redoFlow}
                disabled={futureFlows.length === 0}
                title="Rehacer acción en el flujo"
                className="flex items-center gap-1.5 px-3 py-1.5 transition-all text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUUpRight size={14} weight="bold" />
              </button>
            </div>
            
            <button 
              onClick={recoverBaseFlow}
              title="Recuperar Flujo Base"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full transition-all text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
            >
              <ArrowsClockwise size={14} /> Restaurar Flujo
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col relative min-h-0 p-4 md:p-5" style={{ background: '#030712' }}>
        <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
          {renderContent()}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex gap-4">
          {null}
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
    let timeoutId: any;
    const unsub = useStudioStore.subscribe((state, prevState) => {
      if (
        state.chatMessages !== prevState.chatMessages ||
        state.phase1Interview !== prevState.phase1Interview ||
        state.triageSummary !== prevState.triageSummary ||
        state.phase2Content !== prevState.phase2Content ||
        state.phase3Content !== prevState.phase3Content ||
        state.phase1Complete !== prevState.phase1Complete ||
        state.phase2Complete !== prevState.phase2Complete ||
        state.phase3Complete !== prevState.phase3Complete ||
        state.flowNodes !== prevState.flowNodes
      ) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
           if (state.chatMessages.length > 1 || state.triageSummary) {
             useHistoryStore.getState().saveCurrentToHistory(state);
           }
        }, 3000);
      }
    });
    return () => { unsub(); clearTimeout(timeoutId); };
  }, []);

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
      <div style={{ width: '70%', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, position: 'relative', padding: '0' }}>
        <SwarmOrchestrationPanel />
      </div>
    </div>
  );
}
















