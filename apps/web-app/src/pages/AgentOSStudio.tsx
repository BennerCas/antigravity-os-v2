import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Trash, Wrench, ShieldCheck, TreeStructure, CurrencyDollar, Database, SpeakerHigh, Star, PaperPlaneRight, LockKey, Lightning } from '@phosphor-icons/react';

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
    // Mock response
    setTimeout(() => {
      addChatMessage({ role: 'agent', content: `He procesado tu solicitud usando el modelo ${selectedModel}. La cascada de Free.AI y el SDK de Antigravity están listos para orquestar los subagentes necesarios.` });
    }, 600);
  };

  const aiTools = [
    { title: 'Requirements Gatekeeper', icon: <ShieldCheck size={18} className="text-[#3b82f6]" weight="fill" />, desc: 'Filtro estricto de validación. Evalúa tu idea buscando ambigüedades.' },
    { title: 'Architecture Alternatives', icon: <TreeStructure size={18} className="text-[#3b82f6]" weight="fill" />, desc: 'Explora y compara enfoques arquitectónicos.' },
    { title: 'Cost/Feasibility Analyzer', icon: <CurrencyDollar size={18} className="text-[#f5a623]" weight="fill" />, desc: 'Auditoría integral técnica y financiera.' },
    { title: 'State Schema Designer', icon: <Database size={18} className="text-[#f5a623]" weight="fill" />, desc: 'Ingeniero de datos. Modela esquemas de estado y relaciones.' },
    { title: 'Security & Auth Auditor', icon: <LockKey size={18} className="text-[#e11d48]" weight="fill" />, desc: 'Auditor de seguridad. Busca vulnerabilidades y revisa políticas de acceso.' },
    { title: 'Performance Profiler', icon: <Lightning size={18} className="text-[#e11d48]" weight="fill" />, desc: 'Analizador de rendimiento. Detecta cuellos de botella y optimiza recursos.' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#E0E0E0] p-4 relative">
      {/* Top Fixed Area */}
      <div className="shrink-0 flex flex-col gap-3 pb-3 border-b border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Robot weight="duotone" size={24} className="text-[#F5A623]" />
            <h2 className="text-[17px] font-bold text-white tracking-tight">FlowArchitect</h2>
          </div>
          <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333] rounded-md text-xs font-medium hover:bg-[#111] transition-colors">
            <Trash size={14} /> Limpiar
          </button>
        </div>

        {/* AI Model Selector */}
        <div className="flex items-center justify-between bg-[#0A0A0A] p-2 rounded-lg border border-[#1A1A1A]">
          <span className="text-[#888] text-[11px] font-bold ml-1 tracking-wider">MODELO AI:</span>
          <select 
            className="bg-transparent text-[#00D9FF] text-xs font-bold focus:outline-none cursor-pointer flex-1 mx-2 text-right appearance-none"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            <optgroup label="Free.AI (Cascada Inteligente)">
              <option value="free.ai/auto">Cascada (Auto-Routing) 🌟</option>
              <option value="free.ai/gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="free.ai/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="free.ai/gpt-4o">GPT-4o</option>
            </optgroup>
            <optgroup label="Ollama (Locales)">
              {ollamaModels.map(m => <option key={m} value={`ollama/${m}`}>{m}</option>)}
              {ollamaModels.length === 0 && <option value="ollama/hermes3:8b">hermes3:8b (Offline)</option>}
            </optgroup>
          </select>
        </div>

        {/* Fixed AI Tools (6 buttons) */}
        <div className="flex items-center gap-2 mb-1 text-[#888] text-[10px] font-bold tracking-wider uppercase">
          <Wrench size={12} /> AI Tools (Master Prompts)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {aiTools.map((tool, i) => (
            <button 
              key={i} 
              onClick={() => handleSend(tool.title)} 
              title={tool.desc}
              className="flex items-center gap-2 p-2 bg-[#111] border border-[#222] hover:border-[#444] rounded-lg text-left transition-colors group"
            >
              <div className="shrink-0">{tool.icon}</div>
              <span className="text-[10.5px] font-bold text-[#E0E0E0] leading-tight group-hover:text-white transition-colors">{tool.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat History / Invisible Scroll */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-[#444] text-sm px-8 font-medium">
            Selecciona una herramienta de IA del panel superior o escribe tu idea para comenzar.
          </div>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'human' ? 'ml-auto' : 'mr-auto'}`}>
              <div className={`p-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'human' ? 'bg-[#00D9FF] text-black rounded-tr-sm font-medium' : 'bg-[#111] border border-[#222] text-[#E0E0E0] rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'agent' && (
                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <button onClick={() => speak(msg.content)} className="text-[#555] hover:text-[#00D9FF] flex items-center gap-1 text-xs font-semibold transition-colors">
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
            className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-sm text-[#E0E0E0] placeholder-[#666] focus:outline-none focus:border-[#555] shadow-inner transition-colors"
            placeholder="Describe tu arquitectura o idea..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            className={`p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0 ${input.trim() ? 'bg-[#00D9FF] text-black hover:bg-[#00BFFF] hover:scale-105' : 'bg-[#222] text-[#555] cursor-not-allowed'}`}
          >
            <PaperPlaneRight weight="fill" size={18} />
          </button>
        </div>
        <div className="text-center mt-3">
          <span className="text-[10px] text-[#555] font-medium tracking-wide">ANTIGRAVITY OS • SDK INTEGRATED CHAT</span>
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
