import { useState, useEffect } from 'react';
import { Network, Play, DotsThreeOutlineVertical, Books, SquaresFour, Plus, DownloadSimple, SpeakerHigh, GraduationCap, ShieldCheck, Brain, Rocket, Cpu, Clock, PuzzlePiece, Target, Lightning, GitBranch } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { SavedFlow } from '../types/builder';
import { API_URL } from '../lib/api';
import { flowTemplates } from '../data/flowsTemplates';

export default function Flows() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my_flows' | 'templates'>('templates');
  const [activeLevel, setActiveLevel] = useState<string>('Basico');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);
  const [savedFlows, setSavedFlows] = useState<SavedFlow[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/flows`)
      .then(res => res.json())
      .then(data => setSavedFlows(Array.isArray(data) ? data : (data.flows || [])))
      .catch(err => console.error('Failed to fetch flows:', err));
  }, []);
  const handleDeleteFlow = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este ecosistema?")) return;
    try {
      await fetch(`${API_URL}/flows/${id}`, { method: 'DELETE' });
      setSavedFlows(prev => prev.filter(f => f.id !== id));
      setOpenMenuId(null);
    } catch (e) {
      console.error(e);
    }
  };


  const handleTTS = async (id: string, text: string) => {
    if (playingTTS) return;
    setPlayingTTS(id);
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingTTS(null);
      utterance.onerror = () => setPlayingTTS(null);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
      setPlayingTTS(null);
    }
  };

  const mockFlows = [
    { id: '1', name: 'Agente de Ventas B2B', engine: 'CrewAI', nodes: 8, lastActive: 'Hace 2 horas', status: 'ready' },
    { id: '2', name: 'Pipeline Analista SEO', engine: 'LangGraph', nodes: 14, lastActive: 'Ayer', status: 'active' },
    { id: '3', name: 'Desarrollador Fullstack Auto', engine: 'AutoGen', nodes: 5, lastActive: 'Hace 3 dias', status: 'draft' },
  ];

  const allFlows: SavedFlow[] = [...mockFlows, ...savedFlows];

  const getEngineColor = (engine?: string) => {
    switch (engine) {
      case 'CrewAI': return 'bg-orange-900/30 text-orange-400 border-orange-800/50';
      case 'LangGraph': return 'bg-purple-900/30 text-purple-400 border-purple-800/50';
      case 'AutoGen': return 'bg-green-900/30 text-green-400 border-green-800/50';
      default: return 'bg-blue-900/30 text-blue-400 border-blue-800/50';
    }
  };

  const getLevelConfig = (level: string) => {
    switch(level) {
      case 'Basico': return { icon: <GraduationCap size={20} />, color: 'bg-green-500/20 text-green-400 border-green-500/50' };
      case 'Intermedio': return { icon: <ShieldCheck size={20} />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
      case 'Avanzado': return { icon: <Rocket size={20} />, color: 'bg-red-500/20 text-red-400 border-red-500/50' };
      case 'Experto': return { icon: <Brain size={20} />, color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50' };
      default: return { icon: <Books size={20} />, color: 'bg-blue-500/20 text-blue-400' };
    }
  };

  const renderActiveLevel = () => {
    const filtered = flowTemplates.filter((t) => t.complexity === activeLevel);
    if (filtered.length === 0) return null;

    let gridClass = "flex-1 grid gap-6 h-full pb-6 ";
    let itemClass = "group bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col hover:border-blue-500/50 transition-all shadow-lg relative ";
    
    if (activeLevel === 'Avanzado') {
      gridClass += "grid-cols-4 w-full h-full";
      itemClass += "h-auto justify-between";
    } else {
      gridClass += "grid-cols-3 w-full h-full place-items-stretch";
      itemClass += "h-auto text-lg"; // Larger font size
    }

    return (
      <div className={gridClass}>
        {filtered.map((tpl) => (
          <div key={tpl.id} className={itemClass}>
            <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
            
            <div className="relative z-10 flex flex-col flex-grow h-full">
              {/* Header */}
              <div className="flex justify-between items-start mb-4 flex-shrink-0">
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full border ${getEngineColor(tpl.engine)}`}>
                  {tpl.engine}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-gray-800 text-gray-400 rounded-full border border-gray-700">
                    {tpl.category}
                  </span>
                  <button 
                    onClick={() => handleTTS(tpl.id, `Plantilla ${tpl.name}. Nivel ${tpl.complexity}. ${tpl.description}`)}
                    className={`p-1.5 rounded-full transition-colors ${playingTTS === tpl.id ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                  >
                    <SpeakerHigh size={16} weight={playingTTS === tpl.id ? "fill" : "regular"} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-100 mb-2 flex-shrink-0">{tpl.name}</h3>
              
              {/* Description Content */}
              <div className="flex flex-col gap-5 mb-4 flex-grow">
                  <p className="text-sm text-gray-400 leading-relaxed text-justify">
                    {tpl.description}
                  </p>
                  
                  {/* Learning Objectives & Framework Mastery */}
                  <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5 mb-1.5">
                      <Target size={14} weight="light" /> Objetivo de Aprendizaje
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed text-justify">
                      {tpl.learningObjective}
                    </p>
                  </div>

                  <div className="bg-fuchsia-900/10 border border-fuchsia-900/30 rounded-lg p-3">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-fuchsia-400 flex items-center gap-1.5 mb-1.5">
                      <Lightning size={14} weight="light" /> Masterclass de {tpl.engine}
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed text-justify">
                      {tpl.frameworkMastery}
                    </p>
                  </div>
                  
                  {/* Rich Metadata Section */}
                  <div className="mt-2 pt-4 border-t border-gray-800/50 grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-1"><Cpu size={12}/> Stack Recomendado</span>
                      <span className="text-xs text-gray-300 font-mono bg-black/20 p-1.5 rounded border border-gray-800">{tpl.apis || 'Local LLM (Ollama)'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-1"><Clock size={12}/> Tiempo Ejecución</span>
                      <span className="text-xs text-blue-400 font-mono bg-blue-900/10 p-1.5 rounded border border-blue-900/30">{tpl.time || '~1-2 min'}</span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-1"><PuzzlePiece size={12}/> Casos de Uso</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(tpl.useCases || ['Prototipado', 'Automatización']).map((uc: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-gray-800/60 text-gray-300 rounded text-[10px] uppercase tracking-wider border border-gray-700">{uc}</span>
                        ))}
                      </div>
                    </div>
                  </div>                  </div>
                  
                  {/* Nodes Preview Section */}
                  <div className="mt-3 bg-gray-900/30 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-1 mb-2"><GitBranch size={12}/> Composición de Nodos ({tpl.nodes})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.builderData?.nodes?.map((n: { id: string; data?: { title?: string } }, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/20 text-indigo-300 border border-indigo-900/40">
                          {n.data?.title || n.id}
                        </span>
                      ))}
                    </div>
                  </div>
                {/* Action Footer */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50 flex-shrink-0">
                <span className="text-sm font-medium text-gray-500">{tpl.nodes} nodos estructurales</span>
                <button 
                  onClick={() => navigate('/builder', { state: { templateFlow: tpl.builderData } })} 
                  className="px-5 py-2 bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all flex items-center gap-2 font-bold hover:scale-105"
                  title="Abrir plantilla y guardar como nuevo"
                >
                  <DownloadSimple size={18} weight="light" /> Utilizar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh)] w-full flex flex-col p-8 bg-[#0a0c10] overflow-hidden">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold text-blue-500 tracking-wide flex items-center gap-3">
          <Network size={36} weight="light" /> Nexus
        </h1>
        <p className="text-gray-400 mt-2">Tu red neuronal de pipelines y ecosistemas multi-agentes guardados.</p>
      </header>

      {/* Tabs Principales */}
      <div className="flex gap-4 mb-6 border-b border-gray-800 pb-px flex-shrink-0">
        <button 
          onClick={() => setActiveTab('my_flows')}
          className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors ${activeTab === 'my_flows' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <SquaresFour size={20} /> Mis Ecosistemas
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors ${activeTab === 'templates' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
        >
          <Books size={20} /> Biblioteca de Plantillas
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'my_flows' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 h-auto">
            {allFlows.map(flow => (
              <div key={flow.id} className="relative group bg-gray-900/40 border border-gray-800 rounded-2xl p-6 overflow-hidden hover:border-blue-500/50 transition-all h-[240px] flex flex-col">
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative z-10 flex justify-between items-start mb-auto">
                  <div>
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full border ${getEngineColor(flow.engine)}`}>
                      {flow.engine || 'Desconocido'}
                    </span>
                    <h2 className="text-xl font-bold text-gray-100 mt-3">{flow.name}</h2>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === flow.id ? null : flow.id)} className="text-gray-500 hover:text-white relative">
                      <DotsThreeOutlineVertical size={20} weight="light" />
                    </button>
                    {openMenuId === flow.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                        <button onClick={() => handleDeleteFlow(flow.id)} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 text-sm font-semibold transition-colors">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex gap-4 text-sm text-gray-500 mb-4 mt-4">
                  <span>{Array.isArray(flow.nodes) ? flow.nodes.length : (flow.nodes || flow.data?.nodes?.length || 0)} nodos</span>
                  <span>•</span>
                  <span>{flow.lastActive || 'Reciente'}</span>
                </div>

                <div className="relative z-10 flex gap-3">
                  <button onClick={() => navigate('/builder', { state: { restoreFlow: flow } })} className="flex-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-900/50 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
                    <Network size={18} /> Editar
                  </button>
                  <button onClick={() => alert("Próximamente: Ejecución Headless. Te permitirá correr este ecosistema en segundo plano y recibir los resultados directamente aquí, sin tener que abrir el entorno del Builder.")} className="w-12 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-900/50 rounded-xl flex items-center justify-center transition-colors" title="Ejecución Headless (Próximamente)">
                    <Play size={18} weight="light" />
                  </button>
                </div>
              </div>
            ))}

            <div onClick={() => navigate('/builder')} className="group bg-gray-900/20 border border-dashed border-gray-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors h-[240px]">
              <div className="w-14 h-14 rounded-full bg-blue-900/20 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus size={28} />
              </div>
              <span className="font-bold text-gray-400 group-hover:text-blue-400">Diseñar Nuevo</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex gap-3 mb-6 flex-shrink-0">
              {['Basico', 'Intermedio', 'Avanzado', 'Experto'].map(level => {
                const config = getLevelConfig(level);
                return (
                  <button 
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${activeLevel === level ? config.color + ' shadow-lg scale-105' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                  >
                    {config.icon}
                    <span className="font-bold">{level}</span>
                  </button>
                );
              })}
            </div>
            
            {renderActiveLevel()}
          </div>
        )}
      </div>
    </div>
  );
}
