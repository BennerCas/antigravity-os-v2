import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Trash, Wrench, SpeakerHigh, PaperPlaneRight, Cpu, Network, Scales, MagnifyingGlass, Strategy, Cube, ShieldCheck, CurrencyDollar, Brain } from '@phosphor-icons/react';

const FlowArchitect: React.FC = () => {
  const { chatMessages, addChatMessage } = useStudioStore();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('free.ai/auto');
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);

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

  const handleSend = (overrideInput?: string) => {
    const textToSend = (typeof overrideInput === 'string') ? overrideInput : input;
    if (!textToSend.trim()) return;
    addChatMessage({ role: 'human', content: textToSend });
    setInput('');
    setTimeout(() => {
      addChatMessage({ role: 'agent', content: `[${selectedModel}] Sistema en línea. Despliegue de subagentes iniciado...` });
    }, 600);
  };

  const aiTools = [
    { title: 'Swarm Orchestrator', icon: <Network size={22} className="text-[#3b82f6]" weight="duotone" />, desc: 'Orquesta múltiples agentes autónomos. Asigna tareas complejas, gestiona el estado compartido y resuelve dependencias en paralelo.' },
    { title: 'Umpire Core', icon: <Scales size={22} className="text-[#e11d48]" weight="duotone" />, desc: 'Árbitro determinista. Somete el código y la arquitectura a pruebas de estrés implacables para asegurar escalabilidad y cero alucinaciones.' },
    { title: 'State Reducer', icon: <Cube size={22} className="text-[#f5a623]" weight="duotone" />, desc: 'Diseña el flujo de datos unidireccional. Modela mutaciones de estado predecibles, inmutables y auditables en tiempo real.' },
    { title: 'RAG Synthesizer', icon: <Strategy size={22} className="text-[#10b981]" weight="duotone" />, desc: 'Cerebro de memoria profunda. Fusiona bases de datos vectoriales y grafos de conocimiento para contextualizar decisiones al instante.' },
    { title: 'Codebase Overlord', icon: <Cpu size={22} className="text-[#8b5cf6]" weight="duotone" />, desc: 'Maestro del código. Refactoriza, optimiza y ensambla piezas arquitectónicas masivas a nivel de repositorio completo.' },
    { title: 'Forensic Inspector', icon: <MagnifyingGlass size={22} className="text-[#06b6d4]" weight="duotone" />, desc: 'Analizador de telemetría en vivo. Destripa cuellos de botella y audita el rendimiento e integraciones a nivel milisegundo.' },
    { title: 'Zero-Trust Gatekeeper', icon: <ShieldCheck size={22} className="text-[#f43f5e]" weight="duotone" />, desc: 'Auditor de ciberseguridad extremo. Detecta vulnerabilidades y exige políticas estrictas de autenticación y autorización.' },
    { title: 'Resource Optimizer', icon: <CurrencyDollar size={22} className="text-[#f5a623]" weight="duotone" />, desc: 'Estratega de infraestructuras. Balancea la carga entre modelos locales y en la nube minimizando costos y uso límite de VRAM.' },
    { title: 'UX Psychologist', icon: <Brain size={22} className="text-[#d946ef]" weight="duotone" />, desc: 'Especialista en interfaces persuasivas. Aplica sesgos cognitivos e inyecta fricción positiva para dominar la experiencia del usuario.' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#E0E0E0] p-4 relative">
      {/* Top Fixed Area */}
      <div className="shrink-0 flex flex-col gap-3 pb-3 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Robot weight="duotone" size={24} className="text-[#F5A623]" />
            <h2 className="text-[19px] font-bold text-white tracking-tight">FlowArchitect</h2>
            
            {/* AI Model Selector inline with title */}
            <div className="flex items-center bg-[#0A0A0A] px-2 py-1 rounded-md border border-[#222] ml-2">
              <span className="text-[#888] text-[11px] font-bold mr-1 tracking-wider uppercase">Mod:</span>
              <select 
                className="bg-transparent text-[#00D9FF] text-[13px] font-bold focus:outline-none cursor-pointer appearance-none max-w-[120px] truncate"
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

          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333] rounded-md text-[13px] font-medium hover:bg-[#111] px-4 py-2 transition-colors shrink-0">
            <Trash size={14} /> Limpiar
          </button>
        </div>

        {/* Fixed AI Tools (9 buttons, 3 columns) */}
        <div className="flex items-center gap-2 mb-0.5 mt-1 text-[#888] text-[11px] font-bold tracking-wider uppercase">
          <Wrench size={14} /> God-Tier Master Prompts
        </div>
        <div className="grid grid-cols-3 gap-2">
          {aiTools.map((tool, i) => (
            <div key={i} className="relative group">
              <button 
                onClick={() => handleSend(tool.title)} 
                className="w-full flex items-center justify-between p-1.5 bg-[#111] border border-[#222] hover:border-[#444] rounded text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className="shrink-0">{tool.icon}</div>
                  <span className="text-[11px] font-bold text-[#E0E0E0] truncate group-hover:text-white transition-colors">{tool.title}</span>
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); speak(tool.desc); }}
                  className="text-[#555] hover:text-[#00D9FF] shrink-0 ml-1 p-0.5 cursor-pointer bg-[#000] border border-[#333] rounded-sm"
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
          <div className="flex h-full items-center justify-center text-center text-[#444] text-base px-8 font-medium leading-relaxed">
            Selecciona un arquitecto de la forja o escribe tu idea para comenzar.
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 rounded-xl text-[15px] leading-relaxed ${
                msg.role === 'human' ? 'bg-[#00D9FF] text-black rounded-tr-sm font-medium' : 'bg-[#111] border border-[#222] text-[#E0E0E0] rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'agent' && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <button onClick={() => speak(msg.content)} className="text-[#555] hover:text-[#00D9FF] flex items-center gap-1 text-[13px] font-semibold transition-colors">
                    <SpeakerHigh size={14} /> Escuchar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input Box - Split Layout, 0.5cm (mb-5) bottom margin */}
      <div className="shrink-0 pt-2 mb-5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-base text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#555] shadow-inner transition-colors"
            placeholder="Comanda al enjambre..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${input.trim() ? 'bg-[#00D9FF] text-black hover:bg-[#00BFFF] hover:scale-105' : 'bg-[#222] text-[#555] cursor-not-allowed'}`}
          >
            <PaperPlaneRight weight="fill" size={22} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[11px] text-[#555] font-bold tracking-widest uppercase">Antigravity OS • FlowArchitect Console</span>
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
