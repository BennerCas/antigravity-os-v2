import ReactMarkdown from 'react-markdown';
import { useEffect } from 'react';
import React, { useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { studioNodeTypes, KIND_META } from '../components/StudioNodes';
import { useStudioStore, TabId, parseAIResponseToFlow } from '../stores/useStudioStore';
import { API_URL } from '../lib/api';
import { Gear, X, Check, Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush, Copy, ArrowsClockwise, Clock } from '@phosphor-icons/react';


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
    const { chatMessages, addChatMessage, setFlow, setAgentCards, setBlueprintMd } = useStudioStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [currentThemeKey, setCurrentThemeKey] = useState(() => localStorage.getItem('aurelios_theme') || 'obsidian');

  useEffect(() => {
    localStorage.setItem('aurelios_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('aurelios_theme', currentThemeKey);
  }, [currentThemeKey]);
  const t = AURELIOS_THEMES[currentThemeKey];

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    window.speechSynthesis.speak(utterance);
  };

  const clearChat = () => {
    useStudioStore.setState({ chatMessages: [] });
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = (typeof overrideInput === 'string') ? overrideInput : input;
    if (!textToSend.trim() || isTyping) return;
    
    addChatMessage({ role: 'human', content: textToSend });
    setInput('');
    
    setThinkingPhrase(THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)]);
    setIsTyping(true);

    try {
      // Motor Híbrido Real:
      // LOCAL → Ollama directo
      // NUBE  → Backend /studio/chat → Free.AI (api.free.ai con llave real)
      const LOCAL_MODELS_SET = new Set(['hermes3:8b','llama3.1:8b','mistral','qwen2.5:7b','phi3:3.8b']);
      const isLocal = LOCAL_MODELS_SET.has(selectedModel) || selectedModel.includes(':');

      if (isLocal) {
        const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: [{ role: 'user', content: textToSend }],
            stream: false
          })
        });
        if (!ollamaRes.ok) throw new Error(`Ollama no responde — ejecuta "ollama serve" en una terminal`);
        const d = await ollamaRes.json();
        addChatMessage({ role: 'agent', content: d.message?.content || 'Sin respuesta.', model: `ollama/${selectedModel}` });
      } else {
        // Free.AI via backend (tiene la llave real FREE_AI_API_KEY)
        const res = await fetch(`${API_URL}/studio/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            model: selectedModel,
            system: 'Eres AureliOS, un asistente de IA avanzado. Responde en el idioma del usuario con formato Markdown: **negritas**, *cursivas*, listas, títulos, párrafos.'
          })
        });
        if (!res.ok) throw new Error(`Backend Free.AI respondió ${res.status}`);
        const data = await res.json();
        const aiText = data.response || 'Sin respuesta.';
        addChatMessage({ role: 'agent', content: aiText, model: data.model_used || selectedModel });
        // Actualizar Flow Diagram + Agentes + Blueprint en tiempo real
        const { nodes, edges, cards, md } = parseAIResponseToFlow(aiText);
        setFlow(nodes, edges);
        if (cards.length > 0) setAgentCards(cards);
        setBlueprintMd(md);
      }
    } catch (err: any) {
      addChatMessage({ role: 'agent', content: `[ERROR] ${err.message}`, model: selectedModel });
    } finally {
      setIsTyping(false);
    }
  };


  const aiTools = [
    { title: 'Swarm Orchestrator', icon: <Network size={18} className="text-[#3b82f6]" weight="duotone" />, desc: 'Orquesta múltiples agentes autónomos. Asigna tareas complejas, gestiona el estado compartido y resuelve dependencias en paralelo.' },
    { title: 'Umpire Core', icon: <Scales size={18} className="text-[#e11d48]" weight="duotone" />, desc: 'Árbitro determinista. Somete el código y la arquitectura a pruebas de estrés implacables para asegurar escalabilidad y cero alucinaciones.' },
    { title: 'State Reducer', icon: <Cube size={18} className="text-[#f5a623]" weight="duotone" />, desc: 'Diseña el flujo de datos unidireccional. Modela mutaciones de estado predecibles, inmutables y auditables en tiempo real.' },
    { title: 'RAG Synthesizer', icon: <Strategy size={18} className="text-[#10b981]" weight="duotone" />, desc: 'Cerebro de memoria profunda. Fusiona bases de datos vectoriales y grafos de conocimiento para contextualizar decisiones al instante.' },
    { title: 'Codebase Overlord', icon: <Cpu size={18} className="text-[#8b5cf6]" weight="duotone" />, desc: 'Maestro del código. Refactoriza, optimiza y ensambla piezas arquitectónicas masivas a nivel de repositorio completo.' },
    { title: 'Forensic Inspector', icon: <MagnifyingGlass size={18} className="text-[#06b6d4]" weight="duotone" />, desc: 'Analizador de telemetría en vivo. Destripa cuellos de botella y audita el rendimiento e integraciones a nivel milisegundo.' },
    { title: 'Zero-Trust Gatekeeper', icon: <ShieldCheck size={18} className="text-[#f43f5e]" weight="duotone" />, desc: 'Auditor de ciberseguridad extremo. Detecta vulnerabilidades y exige políticas estrictas de autenticación y autorización.' },
    { title: 'Resource Optimizer', icon: <CurrencyDollar size={18} className="text-[#f5a623]" weight="duotone" />, desc: 'Estratega de infraestructuras. Balancea la carga entre modelos locales y en la nube minimizando costos y uso límite de VRAM.' },
    { title: 'UX Psychologist', icon: <Brain size={18} className="text-[#d946ef]" weight="duotone" />, desc: 'Especialista en interfaces persuasivas. Aplica sesgos cognitivos e inyecta fricción positiva para dominar la experiencia del usuario.' },
    { title: 'Infrastructure Titan', icon: <HardDrives size={18} className="text-[#64748b]" weight="duotone" />, desc: 'Ingeniero DevOps. Automatiza Docker, Kubernetes, CI/CD pipelines y configura servidores para despliegues a prueba de balas.' },
    { title: 'API Nexus', icon: <Plugs size={18} className="text-[#14b8a6]" weight="duotone" />, desc: 'Especialista en integraciones. Diseña y audita pasarelas de pago, Webhooks, arquitecturas GraphQL y orquesta microservicios.' },
    { title: 'Synthetic QA', icon: <BugBeetle size={18} className="text-[#facc15]" weight="duotone" />, desc: 'Simulador de caos. Genera edge cases y ataca tu código simulando enjambres de usuarios para quebrar la app antes de producción.' }
  ];

  return (
    <div className={`flex flex-col ${t.bg} ${t.text} p-4 relative transition-colors duration-500`} style={{ height: '100%', overflow: 'hidden' }}>
      
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
      <div className={`shrink-0 flex flex-col gap-3 pb-3 border-b ${t.border} transition-colors duration-500`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Columns weight="duotone" size={26} className="text-[#F5A623]" />
            <h2 className="text-[20px] font-bold tracking-tight">AureliOS</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={clearChat} title="Limpiar chat" className={`hover:brightness-125 transition-opacity ${t.text}`}>
              <Trash size={18} />
            </button>
            <button onClick={() => setShowSetup(true)} title="Configuración de Modelo y Tema" className={`hover:brightness-125 transition-opacity ${t.text}`}>
              <Gear size={18} />
            </button>
          </div>
        </div>

        {/* Fixed AI Tools */}
        <div className="flex items-center gap-2 mb-0.5 mt-1 text-[11px] font-bold tracking-wider uppercase ">
          <Wrench size={14} /> God-Tier Master Prompts
        </div>
        <div className="grid grid-cols-3 gap-2">
          {aiTools.map((tool, i) => (
            <div key={i} className="relative group">
              <button 
                onClick={() => handleSend(tool.title)} 
                className={`w-full flex items-center justify-between p-1.5 ${t.toolBg} border ${t.panelBorder} ${t.toolHover} rounded text-left transition-all duration-300`}
              >
                <div className="flex items-center gap-3 overflow-hidden ml-1">
                  <div className="shrink-0">{tool.icon}</div>
                  <span className="text-[11px] font-bold truncate group-hover:brightness-125 transition-all">{tool.title}</span>
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

      {/* Chat History / Invisible Scroll */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              {msg.role === 'agent' && (
                <div className={`flex items-center gap-3 mt-1.5 px-1 text-[11px] font-bold ${t.primary} uppercase tracking-widest opacity-75 flex-nowrap`}>
                  <Cpu size={12} />
                  <span className="opacity-90 normal-case font-semibold truncate max-w-[160px]">{msg.model || 'AureliOS'}</span>
                  <Clock size={12} className="opacity-50 ml-1 shrink-0" />
                  <span className="opacity-50 normal-case font-semibold whitespace-nowrap">{new Date(parseInt(msg.id) > 10000000000 ? parseInt(msg.id) : Date.now()).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button onClick={() => navigator.clipboard.writeText(msg.content)} title="Copiar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><Copy size={13} /></button>
                    <button onClick={() => speak(msg.content)} title="Escuchar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><SpeakerHigh size={13} /></button>
                    <button title="Regenerar" style={{all:'unset',cursor:'pointer'}} className="hover:opacity-100 opacity-60 transition-opacity"><ArrowsClockwise size={13} /></button>
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
      <div className="shrink-0 pt-2 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className={`flex-1 ${t.inputBg} border rounded-xl px-4 py-3 text-base placeholder- focus:outline-none ${t.inputFocus} shadow-inner transition-colors duration-500`}
            placeholder="Comanda al enjambre..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${input.trim() && !isTyping ? `${t.sendActive} hover:scale-105` : `${t.sendDisabled} cursor-not-allowed`}`}
          >
            <PaperPlaneRight weight="fill" size={22} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px]  font-bold tracking-widest uppercase">AURELIOS • STOIC AI ORCHESTRATOR</span>
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
  const { flowNodes, flowEdges } = useStudioStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  React.useEffect(() => { setNodes(flowNodes); }, [flowNodes]);
  React.useEffect(() => { setEdges(flowEdges); }, [flowEdges]);

  if (flowNodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] text-gray-600 gap-3">
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
        <Controls className="!bg-[#0d1117] !border-[#1e293b] !rounded-xl" />
        <MiniMap
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
  const { agentCards, focusedAgent, setFocusedAgent } = useStudioStore();

  if (agentCards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] text-gray-600 gap-3">
        <Brain size={40} weight="light" className="opacity-30" />
        <p className="text-sm font-medium">Las tarjetas de agentes aparecerán aquí</p>
        <p className="text-xs opacity-50">Pide a AureliOS que diseñe un equipo de agentes →</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#050505] overflow-y-auto p-4 relative">
      <style>{`
        .agent-card { perspective: 1000px; }
        .agent-card-inner { transition: transform 0.5s; transform-style: preserve-3d; position: relative; }
        .agent-card:hover .agent-card-inner { transform: rotateY(8deg) rotateX(-3deg); }
        .agent-card-inner::before {
          content: ''; position: absolute; inset: 0; border-radius: 12px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 70%);
          pointer-events: none;
        }
      `}</style>
      <div className="grid grid-cols-2 gap-3">
        {agentCards.map((card) => (
          <div key={card.id} className="agent-card cursor-pointer" onClick={() => setFocusedAgent(card)}>
            <div className="agent-card-inner rounded-xl p-4" style={{ background: '#0d1117', border: `1.5px solid ${card.color}33`, boxShadow: `0 4px 20px ${card.color}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: card.color }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: card.color }}>{card.role}</span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1 leading-tight">{card.name}</h3>
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{card.description}</p>
              {card.tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {card.tools.map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: `${card.color}22`, color: card.color }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Focus Modal */}
      {focusedAgent && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20 p-6">
          <div className="rounded-2xl p-6 w-full max-w-md relative" style={{ background: '#0d1117', border: `2px solid ${focusedAgent.color}`, boxShadow: `0 0 40px ${focusedAgent.color}44` }}>
            <button onClick={() => setFocusedAgent(null)} style={{ all: 'unset', cursor: 'pointer', position: 'absolute', top: 16, right: 16, color: '#888' }}>✕</button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${focusedAgent.color}22`, border: `2px solid ${focusedAgent.color}` }}>
                <Brain size={20} style={{ color: focusedAgent.color }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: focusedAgent.color }}>{focusedAgent.role}</p>
                <h2 className="text-white font-bold text-lg">{focusedAgent.name}</h2>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{focusedAgent.description}</p>
            {focusedAgent.tools.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Herramientas</p>
                <div className="flex flex-wrap gap-2">
                  {focusedAgent.tools.map(t => (
                    <span key={t} className="px-2 py-1 rounded-lg text-xs font-mono font-bold" style={{ background: `${focusedAgent.color}22`, color: focusedAgent.color }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ArchitectureBlueprint: React.FC = () => {
  const { blueprintMd } = useStudioStore();

  if (!blueprintMd) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] text-gray-600 gap-3">
        <Cube size={40} weight="light" className="opacity-30" />
        <p className="text-sm font-medium">El blueprint aparecerá aquí</p>
        <p className="text-xs opacity-50">La respuesta completa de la IA se renderiza como documento técnico →</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#050505] overflow-y-auto p-6">
      <div className="prose prose-invert prose-sm max-w-none text-gray-200">
        <ReactMarkdown>{blueprintMd}</ReactMarkdown>
      </div>
    </div>
  );
};

const CanvasTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useStudioStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'discovery': return <FlowDiagram />;
      case 'synthesis': return <AgentCarousel />;
      case 'blueprint': return <ArchitectureBlueprint />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', minHeight: 0 }}>
      <div className="flex border-b border-gray-700 bg-gray-900 shrink-0">
        {(['discovery', 'synthesis', 'blueprint'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab === 'discovery' && '1 Descubrir'}
            {tab === 'synthesis' && '2 Sintetizar'}
            {tab === 'blueprint' && '3 Blueprint'}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col relative min-h-0 p-4 md:p-5" style={{ background: '#030712' }}>
        <div className="flex-1 flex flex-col relative rounded-xl overflow-hidden bg-transparent">
          {renderContent()}
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
      <div style={{ width: '30%', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f2937', flexShrink: 0, minWidth: 0 }}>
        <FlowArchitect />
      </div>

      {/* Columna 2 — 70% — Canvas */}
      <div style={{ width: '70%', height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, minHeight: 0, minWidth: 0 }}>
        <CanvasTabs />
      </div>
    </div>
  );
}

