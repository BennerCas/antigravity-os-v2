import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Columns, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain, HardDrives, Plugs, BugBeetle, PaintBrush } from '@phosphor-icons/react';

const AURELIOS_THEMES: Record<string, any> = {
  obsidian: {
    name: 'Obsidian Emperor', bg: 'bg-[#050505]', text: 'text-[#F3F4F6]', border: 'border-[#27272A]',
    panelBg: 'bg-[#18181B]', panelBorder: 'border-[#3F3F46]', primary: 'text-[#22D3EE]',
    toolBg: 'bg-[#27272A]', toolHover: 'hover:border-[#52525B]', aiBubble: 'bg-[#18181B] border-[#3F3F46] text-[#F3F4F6]',
    humanBubble: 'bg-[#22D3EE] text-[#050505]', inputBg: 'bg-[#18181B] border-[#3F3F46]', inputFocus: 'focus:border-[#22D3EE]',
    sendActive: 'bg-[#22D3EE] text-[#050505] hover:bg-[#06B6D4]', sendDisabled: 'bg-[#27272A] text-[#A1A1AA]'
  },
  marble: {
    name: 'Marble Stoic', bg: 'bg-[#F8F9FA]', text: 'text-[#111827]', border: 'border-[#D1D5DB]',
    panelBg: 'bg-[#FFFFFF]', panelBorder: 'border-[#9CA3AF]', primary: 'text-[#D97706]',
    toolBg: 'bg-[#E5E7EB]', toolHover: 'hover:border-[#6B7280]', aiBubble: 'bg-[#FFFFFF] border-[#D1D5DB] text-[#111827]',
    humanBubble: 'bg-[#1D4ED8] text-[#FFFFFF]', inputBg: 'bg-[#FFFFFF] border-[#D1D5DB]', inputFocus: 'focus:border-[#1D4ED8]',
    sendActive: 'bg-[#1D4ED8] text-[#FFFFFF] hover:bg-[#1E40AF]', sendDisabled: 'bg-[#E5E7EB] text-[#6B7280]'
  },
  crimson: {
    name: 'Crimson Forge', bg: 'bg-[#170505]', text: 'text-[#FEE2E2]', border: 'border-[#7F1D1D]',
    panelBg: 'bg-[#2A0A0A]', panelBorder: 'border-[#991B1B]', primary: 'text-[#F87171]',
    toolBg: 'bg-[#450A0A]', toolHover: 'hover:border-[#DC2626]', aiBubble: 'bg-[#2A0A0A] border-[#991B1B] text-[#FEE2E2]',
    humanBubble: 'bg-[#DC2626] text-[#FFFFFF]', inputBg: 'bg-[#2A0A0A] border-[#7F1D1D]', inputFocus: 'focus:border-[#F87171]',
    sendActive: 'bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C]', sendDisabled: 'bg-[#450A0A] text-[#FCA5A5]'
  },
  legion: {
    name: 'Cyber Legion', bg: 'bg-[#020F08]', text: 'text-[#D1FAE5]', border: 'border-[#065F46]',
    panelBg: 'bg-[#064E3B]', panelBorder: 'border-[#059669]', primary: 'text-[#34D399]',
    toolBg: 'bg-[#065F46]', toolHover: 'hover:border-[#10B981]', aiBubble: 'bg-[#064E3B] border-[#059669] text-[#D1FAE5]',
    humanBubble: 'bg-[#10B981] text-[#050505]', inputBg: 'bg-[#064E3B] border-[#065F46]', inputFocus: 'focus:border-[#34D399]',
    sendActive: 'bg-[#10B981] text-[#050505] hover:bg-[#059669]', sendDisabled: 'bg-[#065F46] text-[#A7F3D0]'
  },
  imperial: {
    name: 'Imperial Purple', bg: 'bg-[#140524]', text: 'text-[#F3E8FF]', border: 'border-[#5B21B6]',
    panelBg: 'bg-[#2E1065]', panelBorder: 'border-[#7C3AED]', primary: 'text-[#C084FC]',
    toolBg: 'bg-[#3B0764]', toolHover: 'hover:border-[#9333EA]', aiBubble: 'bg-[#2E1065] border-[#7C3AED] text-[#F3E8FF]',
    humanBubble: 'bg-[#9333EA] text-[#FFFFFF]', inputBg: 'bg-[#2E1065] border-[#5B21B6]', inputFocus: 'focus:border-[#C084FC]',
    sendActive: 'bg-[#9333EA] text-[#FFFFFF] hover:bg-[#7E22CE]', sendDisabled: 'bg-[#3B0764] text-[#D8B4FE]'
  },
  solar: {
    name: 'Solar Flare', bg: 'bg-[#1E0F04]', text: 'text-[#FEF3C7]', border: 'border-[#92400E]',
    panelBg: 'bg-[#451A03]', panelBorder: 'border-[#B45309]', primary: 'text-[#FBBF24]',
    toolBg: 'bg-[#78350F]', toolHover: 'hover:border-[#D97706]', aiBubble: 'bg-[#451A03] border-[#B45309] text-[#FEF3C7]',
    humanBubble: 'bg-[#F59E0B] text-[#050505]', inputBg: 'bg-[#451A03] border-[#92400E]', inputFocus: 'focus:border-[#FBBF24]',
    sendActive: 'bg-[#F59E0B] text-[#050505] hover:bg-[#D97706]', sendDisabled: 'bg-[#78350F] text-[#FDE68A]'
  },
  abyssal: {
    name: 'Abyssal Ocean', bg: 'bg-[#041222]', text: 'text-[#E0F2FE]', border: 'border-[#0369A1]',
    panelBg: 'bg-[#0C4A6E]', panelBorder: 'border-[#0284C7]', primary: 'text-[#7DD3FC]',
    toolBg: 'bg-[#075985]', toolHover: 'hover:border-[#0EA5E9]', aiBubble: 'bg-[#0C4A6E] border-[#0284C7] text-[#E0F2FE]',
    humanBubble: 'bg-[#0EA5E9] text-[#050505]', inputBg: 'bg-[#0C4A6E] border-[#0369A1]', inputFocus: 'focus:border-[#7DD3FC]',
    sendActive: 'bg-[#0EA5E9] text-[#050505] hover:bg-[#0284C7]', sendDisabled: 'bg-[#075985] text-[#BAE6FD]'
  },
  toxic: {
    name: 'Toxic Wasteland', bg: 'bg-[#0A120A]', text: 'text-[#ECFCCB]', border: 'border-[#4D7C0F]',
    panelBg: 'bg-[#1A2E1A]', panelBorder: 'border-[#65A30D]', primary: 'text-[#BEF264]',
    toolBg: 'bg-[#2C4A2C]', toolHover: 'hover:border-[#84CC16]', aiBubble: 'bg-[#1A2E1A] border-[#65A30D] text-[#ECFCCB]',
    humanBubble: 'bg-[#84CC16] text-[#050505]', inputBg: 'bg-[#1A2E1A] border-[#4D7C0F]', inputFocus: 'focus:border-[#BEF264]',
    sendActive: 'bg-[#84CC16] text-[#050505] hover:bg-[#65A30D]', sendDisabled: 'bg-[#2C4A2C] text-[#D9F99D]'
  },
  midnight: {
    name: 'Midnight Rose', bg: 'bg-[#1F0F19]', text: 'text-[#FCE7F3]', border: 'border-[#9D174D]',
    panelBg: 'bg-[#40162F]', panelBorder: 'border-[#BE185D]', primary: 'text-[#F9A8D4]',
    toolBg: 'bg-[#621A46]', toolHover: 'hover:border-[#DB2777]', aiBubble: 'bg-[#40162F] border-[#BE185D] text-[#FCE7F3]',
    humanBubble: 'bg-[#DB2777] text-[#FFFFFF]', inputBg: 'bg-[#40162F] border-[#9D174D]', inputFocus: 'focus:border-[#F9A8D4]',
    sendActive: 'bg-[#DB2777] text-[#FFFFFF] hover:bg-[#BE185D]', sendDisabled: 'bg-[#621A46] text-[#FBCFE8]'
  },
  monochrome: {
    name: 'Monochrome Terminal', bg: 'bg-[#000000]', text: 'text-[#FFFFFF]', border: 'border-[#444444]',
    panelBg: 'bg-[#111111]', panelBorder: 'border-[#666666]', primary: 'text-[#FFFFFF]',
    toolBg: 'bg-[#222222]', toolHover: 'hover:border-[#999999]', aiBubble: 'bg-[#111111] border-[#666666] text-[#FFFFFF]',
    humanBubble: 'bg-[#FFFFFF] text-[#000000]', inputBg: 'bg-[#111111] border-[#444444]', inputFocus: 'focus:border-[#FFFFFF]',
    sendActive: 'bg-[#FFFFFF] text-[#000000] hover:bg-[#CCCCCC]', sendDisabled: 'bg-[#222222] text-[#999999]'
  },
  claude: {
    name: 'Claude Elegance', bg: 'bg-[#F9F8F6]', text: 'text-[#2D2A26]', border: 'border-[#D4D0C5]',
    panelBg: 'bg-[#FFFFFF]', panelBorder: 'border-[#C2BCAE]', primary: 'text-[#B45F45]',
    toolBg: 'bg-[#EAE5D9]', toolHover: 'hover:border-[#B45F45]', aiBubble: 'bg-[#FFFFFF] border-[#C2BCAE] text-[#2D2A26]',
    humanBubble: 'bg-[#B45F45] text-[#FFFFFF]', inputBg: 'bg-[#FFFFFF] border-[#D4D0C5]', inputFocus: 'focus:border-[#B45F45]',
    sendActive: 'bg-[#B45F45] text-[#FFFFFF] hover:bg-[#9B4D36]', sendDisabled: 'bg-[#EAE5D9] text-[#7A7465]'
  },
  solargrid: {
    name: 'Solar Grid (Retro)', bg: 'bg-[#140727]', text: 'text-[#FEF08A]', border: 'border-[#7C3AED]',
    panelBg: 'bg-[#2E1065]', panelBorder: 'border-[#9333EA]', primary: 'text-[#F97316]',
    toolBg: 'bg-[#4C1D95]', toolHover: 'hover:border-[#F97316]', aiBubble: 'bg-[#2E1065] border-[#9333EA] text-[#FEF08A]',
    humanBubble: 'bg-[#F97316] text-[#050505]', inputBg: 'bg-[#2E1065] border-[#7C3AED]', inputFocus: 'focus:border-[#F97316]',
    sendActive: 'bg-[#F97316] text-[#050505] hover:bg-[#EA580C]', sendDisabled: 'bg-[#4C1D95] text-[#FDE047]'
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
        const modelName = selectedModel.replace('free.ai/', '');
        const res = await fetch('https://api.free.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: textToSend }]
          })
        });
        
        if (!res.ok) throw new Error('Error de conexión con Free.AI');
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || 'Sin respuesta';
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
                {msg.content}
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
