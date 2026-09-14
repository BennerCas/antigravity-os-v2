import React, { useState } from 'react';
import { useStudioStore, TabId } from '../stores/useStudioStore';
import { Robot, Trash, Wrench, ShieldCheck, TreeStructure, CurrencyDollar, Database, SpeakerHigh, Star, PaperPlaneRight } from '@phosphor-icons/react';

const FlowArchitect: React.FC = () => {
  const { chatMessages, addChatMessage } = useStudioStore();
  const [input, setInput] = useState('');

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
    // Fake AI response for testing
    setTimeout(() => {
      addChatMessage({ role: 'agent', content: 'He recibido tu instrucción. Procederé a analizar la arquitectura del sistema y sugerir mejoras basadas en los patrones de diseño.' });
    }, 600);
  };

  const aiTools = [
    { title: 'Requirements Gatekeeper', icon: <ShieldCheck size={18} className="text-[#3b82f6]" weight="fill" />, desc: 'Filtro estricto de validación. Evalúa tu idea buscando ambigüedades y exige claridad absoluta antes de permitir el diseño.' },
    { title: 'Architecture Alternatives', icon: <TreeStructure size={18} className="text-[#3b82f6]" weight="fill" />, desc: 'Explora y compara enfoques arquitectónicos (microservicios, monolitos, serverless) para recomendar la estructura óptima.' },
    { title: 'Cost/Feasibility Analyzer', icon: <CurrencyDollar size={18} className="text-[#f5a623]" weight="fill" />, desc: 'Auditoría integral técnica y financiera. Proyecta viabilidad, detecta cuellos de botella y estima costos de infraestructura.' },
    { title: 'State Schema Designer', icon: <Database size={18} className="text-[#f5a623]" weight="fill" />, desc: 'Ingeniero de datos. Modela esquemas de estado, entidades y relaciones garantizando normalización y rendimiento.' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#E0E0E0] p-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1A1A1A] shrink-0">
        <div className="flex items-center gap-2">
          <Robot weight="duotone" size={24} className="text-[#F5A623]" />
          <h2 className="text-[17px] font-bold text-white tracking-tight">FlowArchitect Discovery</h2>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#333] rounded-md text-xs font-medium hover:bg-[#111] transition-colors">
          <Trash size={14} /> Limpiar
        </button>
      </div>

      {/* Chat History / Empty State with Invisible Scroll */}
      <div className="flex-1 overflow-y-auto mb-4 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col h-full pt-2">
            <div className="flex items-center gap-2 mb-4 text-[#888] text-xs font-bold tracking-wider">
              <Wrench size={14} /> AI TOOLS (MASTER PROMPTS)
            </div>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 mb-8">
              {aiTools.map((tool, i) => (
                <div key={i} className="bg-[#0A0A0A] border border-[#1A1A1A] p-4 rounded-lg flex flex-col hover:border-[#333] transition-colors cursor-pointer group" onClick={() => { handleSend(tool.title); }}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      {tool.icon}
                      {tool.title}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); speak(tool.desc); }} className="text-[#555] hover:text-[#E0E0E0] p-1.5 border border-[#333] rounded-full bg-[#111] transition-colors"><SpeakerHigh size={14} /></button>
                  </div>
                  <p className="text-[#888] text-xs leading-relaxed">{tool.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-auto p-4 border border-[#1A1A1A] rounded-lg bg-[#0A0A0A]">
              <span className="text-[#888] text-sm font-bold">Modelo de Chat:</span>
              <select className="bg-[#111] text-[#E0E0E0] border border-[#333] rounded px-2 py-1 text-sm focus:ring-0 cursor-pointer outline-none font-medium">
                <option>hermes3:8b (ollama)</option>
              </select>
              <span className="text-[#F5A623] flex items-center gap-1 text-sm font-bold"><Star weight="fill" size={14} /> Recomendado</span>
            </div>
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

      {/* Input Box - fixed at bottom of container */}
      <div className="shrink-0 mt-auto pt-4 border-t border-[#1A1A1A] bg-[#050505]">
        <div className="flex items-center bg-[#111] border border-[#333] rounded-xl overflow-hidden focus-within:border-[#555] transition-colors p-1">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#E0E0E0] placeholder-[#666] focus:outline-none"
            placeholder="Describe tu arquitectura o escribe una idea..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center mr-1 ${input.trim() ? 'bg-[#00D9FF] text-black hover:bg-[#00BFFF]' : 'bg-[#222] text-[#555] cursor-not-allowed'}`}
          >
            <PaperPlaneRight weight="fill" size={16} />
          </button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-[#555] font-medium tracking-wide">ANTIGRAVITY OS • AI ARCHITECTURE DISCOVERY</span>
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
