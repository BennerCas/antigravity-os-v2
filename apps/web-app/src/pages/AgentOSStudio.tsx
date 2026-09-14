import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush } from '@phosphor-icons/react';

const AURELIOS_THEMES: Record<string, any> = {
  obsidian: {
    name: 'Obsidian Emperor', bg: 'bg-[#050505]', text: 'text-[#E0E0E0]', border: 'border-[#1A1A1A]',
    panelBg: 'bg-[#0A0A0A]', panelBorder: 'border-[#222]', primary: 'text-[#00D9FF]',
    toolBg: 'bg-[#111]', toolHover: 'hover:border-[#444]', aiBubble: 'bg-[#111] border-[#222] text-[#E0E0E0]',
    humanBubble: 'bg-[#00D9FF] text-black', inputBg: 'bg-[#111] border-[#333]', inputFocus: 'focus:border-[#555]',
    sendActive: 'bg-[#00D9FF] text-black hover:bg-[#00BFFF]', sendDisabled: 'bg-[#222] text-[#555]'
  },
  marble: {
    name: 'Marble Stoic', bg: 'bg-[#F8F9FA]', text: 'text-[#1F2937]', border: 'border-[#E5E7EB]',
    panelBg: 'bg-[#FFFFFF]', panelBorder: 'border-[#D1D5DB]', primary: 'text-[#F5A623]',
    toolBg: 'bg-[#F3F4F6]', toolHover: 'hover:border-[#9CA3AF]', aiBubble: 'bg-[#FFFFFF] border-[#E5E7EB] text-[#1F2937]',
    humanBubble: 'bg-[#1E3A8A] text-white', inputBg: 'bg-[#FFFFFF] border-[#D1D5DB]', inputFocus: 'focus:border-[#9CA3AF]',
    sendActive: 'bg-[#1E3A8A] text-white hover:bg-[#1D4ED8]', sendDisabled: 'bg-[#E5E7EB] text-[#9CA3AF]'
  },
  crimson: {
    name: 'Crimson Forge', bg: 'bg-[#110505]', text: 'text-[#FCA5A5]', border: 'border-[#3F1616]',
    panelBg: 'bg-[#1A0A0A]', panelBorder: 'border-[#451A1A]', primary: 'text-[#EF4444]',
    toolBg: 'bg-[#240F0F]', toolHover: 'hover:border-[#7F1D1D]', aiBubble: 'bg-[#1F1010] border-[#451A1A] text-[#FECACA]',
    humanBubble: 'bg-[#B91C1C] text-white', inputBg: 'bg-[#1A0A0A] border-[#451A1A]', inputFocus: 'focus:border-[#7F1D1D]',
    sendActive: 'bg-[#B91C1C] text-white hover:bg-[#DC2626]', sendDisabled: 'bg-[#240F0F] text-[#451A1A]'
  },
  legion: {
    name: 'Cyber Legion', bg: 'bg-[#020C06]', text: 'text-[#6EE7B7]', border: 'border-[#064E3B]',
    panelBg: 'bg-[#02180B]', panelBorder: 'border-[#065F46]', primary: 'text-[#10B981]',
    toolBg: 'bg-[#032412]', toolHover: 'hover:border-[#047857]', aiBubble: 'bg-[#02180B] border-[#065F46] text-[#A7F3D0]',
    humanBubble: 'bg-[#059669] text-white', inputBg: 'bg-[#02180B] border-[#064E3B]', inputFocus: 'focus:border-[#047857]',
    sendActive: 'bg-[#059669] text-white hover:bg-[#10B981]', sendDisabled: 'bg-[#032412] text-[#064E3B]'
  },
  imperial: {
    name: 'Imperial Purple', bg: 'bg-[#0D0518]', text: 'text-[#E9D5FF]', border: 'border-[#3B0764]',
    panelBg: 'bg-[#170B2B]', panelBorder: 'border-[#4C1D95]', primary: 'text-[#A855F7]',
    toolBg: 'bg-[#21103D]', toolHover: 'hover:border-[#6D28D9]', aiBubble: 'bg-[#170B2B] border-[#4C1D95] text-[#F3E8FF]',
    humanBubble: 'bg-[#7E22CE] text-white', inputBg: 'bg-[#170B2B] border-[#3B0764]', inputFocus: 'focus:border-[#6D28D9]',
    sendActive: 'bg-[#7E22CE] text-white hover:bg-[#9333EA]', sendDisabled: 'bg-[#21103D] text-[#3B0764]'
  },
  solar: {
    name: 'Solar Flare', bg: 'bg-[#180A05]', text: 'text-[#FDE68A]', border: 'border-[#78350F]',
    panelBg: 'bg-[#291008]', panelBorder: 'border-[#92400E]', primary: 'text-[#F59E0B]',
    toolBg: 'bg-[#451A03]', toolHover: 'hover:border-[#B45309]', aiBubble: 'bg-[#291008] border-[#92400E] text-[#FEF3C7]',
    humanBubble: 'bg-[#F59E0B] text-black', inputBg: 'bg-[#291008] border-[#78350F]', inputFocus: 'focus:border-[#B45309]',
    sendActive: 'bg-[#F59E0B] text-black hover:bg-[#D97706]', sendDisabled: 'bg-[#451A03] text-[#78350F]'
  },
  abyssal: {
    name: 'Abyssal Ocean', bg: 'bg-[#030B14]', text: 'text-[#BAE6FD]', border: 'border-[#0C4A6E]',
    panelBg: 'bg-[#07172A]', panelBorder: 'border-[#0284C7]', primary: 'text-[#38BDF8]',
    toolBg: 'bg-[#082F49]', toolHover: 'hover:border-[#0EA5E9]', aiBubble: 'bg-[#07172A] border-[#0284C7] text-[#E0F2FE]',
    humanBubble: 'bg-[#38BDF8] text-black', inputBg: 'bg-[#07172A] border-[#0C4A6E]', inputFocus: 'focus:border-[#0EA5E9]',
    sendActive: 'bg-[#38BDF8] text-black hover:bg-[#0284C7]', sendDisabled: 'bg-[#082F49] text-[#0C4A6E]'
  },
  toxic: {
    name: 'Toxic Wasteland', bg: 'bg-[#111311]', text: 'text-[#D9F99D]', border: 'border-[#3F6212]',
    panelBg: 'bg-[#1A1F1A]', panelBorder: 'border-[#4D7C0F]', primary: 'text-[#84CC16]',
    toolBg: 'bg-[#222E22]', toolHover: 'hover:border-[#65A30D]', aiBubble: 'bg-[#1A1F1A] border-[#4D7C0F] text-[#ECFCCB]',
    humanBubble: 'bg-[#84CC16] text-black', inputBg: 'bg-[#1A1F1A] border-[#3F6212]', inputFocus: 'focus:border-[#65A30D]',
    sendActive: 'bg-[#84CC16] text-black hover:bg-[#65A30D]', sendDisabled: 'bg-[#222E22] text-[#3F6212]'
  },
  midnight: {
    name: 'Midnight Rose', bg: 'bg-[#0F0A0D]', text: 'text-[#FBCFE8]', border: 'border-[#831843]',
    panelBg: 'bg-[#1A1016]', panelBorder: 'border-[#9D174D]', primary: 'text-[#F472B6]',
    toolBg: 'bg-[#2E1624]', toolHover: 'hover:border-[#BE185D]', aiBubble: 'bg-[#1A1016] border-[#9D174D] text-[#FCE7F3]',
    humanBubble: 'bg-[#F472B6] text-black', inputBg: 'bg-[#1A1016] border-[#831843]', inputFocus: 'focus:border-[#BE185D]',
    sendActive: 'bg-[#F472B6] text-black hover:bg-[#DB2777]', sendDisabled: 'bg-[#2E1624] text-[#831843]'
  },
  monochrome: {
    name: 'Monochrome Terminal', bg: 'bg-[#000000]', text: 'text-[#FFFFFF]', border: 'border-[#333333]',
    panelBg: 'bg-[#0A0A0A]', panelBorder: 'border-[#555555]', primary: 'text-[#FFFFFF]',
    toolBg: 'bg-[#111111]', toolHover: 'hover:border-[#999999]', aiBubble: 'bg-[#0A0A0A] border-[#555555] text-[#FFFFFF]',
    humanBubble: 'bg-[#FFFFFF] text-black', inputBg: 'bg-[#0A0A0A] border-[#333333]', inputFocus: 'focus:border-[#999999]',
    sendActive: 'bg-[#FFFFFF] text-black hover:bg-[#CCCCCC]', sendDisabled: 'bg-[#111111] text-[#333333]'
  }
};

const FlowArchitect: React.FC = () => {
  const { chatMessages, addChatMessage } = useStudioStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('free.ai/auto');
  const [currentThemeKey, setCurrentThemeKey] = useState('obsidian');
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
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          addChatMessage({ role: 'agent', content: `[AURELIOS] Bloqueo de seguridad: No se detectó VITE_GEMINI_API_KEY en tu archivo .env local. Por favor, configura tu API Key de Google o selecciona un modelo local de Ollama en el panel superior.` });
          setIsTyping(false);
          return;
        }
        
        // Use Gemini API directly as Free.AI cascade fallback
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: textToSend }] }]
          })
        });
        
        if (!res.ok) throw new Error('Error de conexión con la nube');
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
      {/* Top Fixed Area */}
      <div className={`shrink-0 flex flex-col gap-3 pb-3 border-b ${t.border} transition-colors duration-500`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Columns weight="duotone" size={26} className="text-[#F5A623]" />
            <h2 className="text-[20px] font-bold tracking-tight">AureliOS</h2>
            
            {/* AI Model Selector */}
            <div className={`flex items-center ${t.panelBg} px-2 py-1 rounded-md border ${t.panelBorder} ml-2 transition-colors duration-500`}>
              <span className={`text-[11px] font-bold mr-1 tracking-wider uppercase opacity-70`}>Mod:</span>
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
              <PaintBrush size={14} className="opacity-70 mr-1.5" />
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

            <button onClick={clearChat} className={`flex items-center gap-1.5 px-4 py-2 border ${t.panelBorder} rounded-md text-[13px] font-medium hover:opacity-70 transition-opacity shrink-0`}>
              <Trash size={14} /> Limpiar
            </button>
          </div>
        </div>

        {/* Fixed AI Tools */}
        <div className="flex items-center gap-2 mb-0.5 mt-1 text-[11px] font-bold tracking-wider uppercase opacity-70">
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
                  className={`opacity-70 hover:opacity-100 ${t.primary} shrink-0 ml-1 p-0.5 cursor-pointer bg-black/20 rounded-sm transition-opacity`}
                  title="Escuchar descripción"
                >
                  <SpeakerHigh size={14} weight="fill" />
                </div>
              </button>
              {/* Invisible custom tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-black border border-[#444] text-[13px] text-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.9)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[999] pointer-events-none text-center font-medium leading-relaxed">
                {tool.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat History / Invisible Scroll */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center opacity-60 text-base px-8 font-medium leading-relaxed">
            Selecciona un pilar de AureliOS o escribe tu visión arquitectónica para comenzar.
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 text-[15px] leading-relaxed border ${
                msg.role === 'human' ? `${t.humanBubble} border-transparent rounded-xl rounded-tr-sm font-medium` : `${t.aiBubble} rounded-xl rounded-tl-sm shadow-sm`
              } transition-colors duration-500`}>
                {msg.content}
              </div>
              {msg.role === 'agent' && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <button onClick={() => speak(msg.content)} className={`opacity-60 hover:opacity-100 ${t.primary} flex items-center gap-1 text-[13px] font-semibold transition-opacity`}>
                    <SpeakerHigh size={14} /> Escuchar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <div className="shrink-0 pt-2 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className={`flex-1 ${t.inputBg} border rounded-xl px-4 py-3 text-base placeholder-opacity-50 focus:outline-none ${t.inputFocus} shadow-inner transition-colors duration-500`}
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
          <span className="text-[11px] opacity-50 font-bold tracking-widest uppercase">AURELIOS • STOIC AI ORCHESTRATOR</span>
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
