import ReactMarkdown from 'react-markdown';
import { useEffect } from 'react';
import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush } from '@phosphor-icons/react';

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
    const { chatMessages, addChatMessage } = useStudioStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingPhrase, setThinkingPhrase] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('aurelios_model') || 'free.ai/auto');
  const [currentThemeKey, setCurrentThemeKey] = useState(() => localStorage.getItem('aurelios_theme') || 'obsidian');

  useEffect(() => {
    localStorage.setItem('aurelios_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('aurelios_theme', currentThemeKey);
  }, [currentThemeKey]);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  
  const t = AURELIOS_THEMES[currentThemeKey];

  React.useEffect(() => {
    fetch('http://127.0.0.1:11434/api/tags')
      .then(res => res.json())
      .then(data => {
        if (data.models) setOllamaModels(data.models.map((m: any) => m.name));
      })
      .catch(() => {});
  }, []);

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
      if (selectedModel.startsWith('ollama/')) {
        const modelName = selectedModel.replace('ollama/', '');
        const response = await fetch('http://127.0.0.1:11434/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: textToSend }],
            stream: false
          })
        });
        
        if (!response.ok) throw new Error('Error de conexión con Ollama');
        const data = await response.json();
        addChatMessage({ role: 'agent', content: data.message?.content || 'Respuesta vacía.' });
      } else {
        
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        if (!apiKey) {
          addChatMessage({ role: 'agent', content: '[AURELIOS] Para usar la red global, configura tu VITE_GEMINI_API_KEY en el archivo .env' });
          setIsTyping(false);
          return;
        }
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: textToSend }] }] })
        });
        
        if (!res.ok) throw new Error('Error de conexión con la red global Gemini/Free.AI');
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
        addChatMessage({ role: 'agent', content: text });
      }
    } catch (err: any) {
      addChatMessage({ role: 'agent', content: `[ERROR] No se pudo contactar al motor de IA: ${err.message}` });
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
    <div className={`flex flex-col h-full ${t.bg} ${t.text} p-4 relative transition-colors duration-500`}>
      
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Columns weight="duotone" size={26} className="text-[#F5A623]" />
            <h2 className="text-[20px] font-bold tracking-tight">AureliOS</h2>
            
            {/* AI Model Selector */}
            <div className={`flex items-center ${t.panelBg} px-2 py-1 rounded-md border ${t.panelBorder} ml-2 transition-colors duration-500`}>
              <span className={`text-[11px] font-bold mr-1 tracking-wider uppercase `}>Mod:</span>
              <select 
                className={`bg-transparent ${t.primary} text-[13px] font-bold focus:outline-none cursor-pointer appearance-none max-w-[120px] truncate`}
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                <optgroup label="Free.AI (Cascada Inteligente)">
                  <option value="free.ai/auto">Auto (Cascada)</option>
                  <option value="free.ai/gemini-1.5-pro">Gemini 1.5</option>
                  <option value="free.ai/claude-3.5">Claude 3.5</option>
                  <option value="free.ai/gpt-4o">GPT-4o</option>
                </optgroup>
                <optgroup label="Ollama (Locales)">
                  {ollamaModels.map(m => <option key={m} value={`ollama/${m}`}>{m}</option>)}
                  {ollamaModels.length === 0 && <option value="ollama/hermes3:8b">hermes3 (Local)</option>}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <div className={`flex items-center ${t.panelBg} px-2 py-1.5 border ${t.panelBorder} rounded-md transition-colors duration-500`}>
              <PaintBrush size={14} className=" mr-1.5" />
              <select 
                className="bg-transparent text-[13px] font-medium focus:outline-none cursor-pointer appearance-none"
                value={currentThemeKey}
                onChange={e => setCurrentThemeKey(e.target.value)}
              >
                {Object.entries(AURELIOS_THEMES).map(([key, theme]) => (
                  <option key={key} value={key} className="bg-black text-white">{theme.name}</option>
                ))}
              </select>
            </div>

            <button onClick={clearChat} className={`flex items-center gap-1.5 px-4 py-2 border ${t.panelBorder} rounded-md text-[13px] font-medium hover: transition-opacity shrink-0`}>
              <Trash size={14} /> Limpiar
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
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="shrink-0">{tool.icon}</div>
                  <span className="text-[11px] font-bold truncate group-hover:brightness-125 transition-all">{tool.title}</span>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                  className={` hover:brightness-125 ${t.primary} shrink-0 ml-1 p-0.5 cursor-pointer bg-black/20 rounded-sm transition-opacity`}
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
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 text-[15px] leading-relaxed border ${
                msg.role === 'human' ? `${t.humanBubble} border-transparent rounded-xl rounded-tr-sm font-medium` : `${t.aiBubble} rounded-xl rounded-tl-sm shadow-sm`
              } transition-colors duration-500`}>
                <div className={`markdown-body max-w-none ${msg.role === 'agent' ? t.text : 'text-inherit'}`}>
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
              {msg.role === 'agent' && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <button onClick={() => speak(msg.content)} className={` hover:brightness-125 ${t.primary} flex items-center gap-1 text-[13px] font-semibold transition-opacity`}>
                    <SpeakerHigh size={14} /> Escuchar
                  </button>
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
    </div>
  );
};

const FlowDiagram: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
    [Flow Diagram / React Flow Canvas]
  </div>
);

const AgentCarousel: React.FC = () => {
  const { isFocusMode, setFocusMode } = useStudioStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 relative">
      {!isFocusMode ? (
        <div className="text-center">
          <div className="text-gray-400 mb-4">[3D Agent Carousel View]</div>
          <button
            onClick={() => setFocusMode(true)}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white transition-colors"
          >
            Enter Flip & Focus Mode
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-95 flex flex-col items-center justify-center p-8 backdrop-blur-sm z-10 transition-all duration-250">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => setFocusMode(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕ Close
            </button>
            <h3 className="text-xl font-bold mb-4 text-white">Focus Mode: Agent Details</h3>
            <div className="space-y-4 text-gray-300">
              <p><strong>I/O Contract:</strong> Defined</p>
              <p><strong>Required Tools:</strong> vector_search, pdf_parse</p>
              <p><strong>Evals:</strong> 5/5 Passing</p>
              <div className="mt-6">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition-colors">
                  Edit Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ArchitectureBlueprint: React.FC = () => (
  <div className="flex-1 flex items-center justify-center bg-gray-800 text-gray-400">
    [Architecture Blueprint / Markdown Editor]
  </div>
);

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
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex border-b border-gray-700 bg-gray-900">
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
      <div className="flex-1 flex flex-col relative">
        {renderContent()}
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
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      <div className="w-[35%] border-r border-gray-800 flex flex-col shrink-0">
        <FlowArchitect />
      </div>
      <div className="w-[65%] flex flex-col shrink-0">
        <CanvasTabs />
      </div>
    </div>
  );
}
