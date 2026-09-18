import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTTSStore } from '../lib/ttsStore';
import { PlayCircle, StopCircle, UserSwitch, Target, Cube, PauseCircle } from '@phosphor-icons/react';

export default function CoautorIA() {
  const [activeTab, setActiveTab] = useState<'uiux' | 'backend' | 'strategy'>('uiux');
  const [contents, setContents] = useState({ uiux: '', backend: '', strategy: '' });
  
  const { play, stop, isActive, isPaused, pause, resume } = useTTSStore();

  useEffect(() => {
    const uiuxContent = `# CoautorIA: UI/UX Concept\n\n1. **El Laboratorio Alquímico Digital:** Controles deslizantes que simulan tubos de vacío iluminados con fluido holográfico cian para los porcentajes de fusión, y una matriz hexagonal estilo astrolabio para la selección de nichos.\n2. **El Senado de Cristal (Salas de Debate):** Disposición en anfiteatro con avatares de bustos grecorromanos renderizados en wireframes cian, interactuando a través de hilos de chat dinámicos que se bifurcan visualmente.\n3. **La Torre de Transmisión (Podcast/Radio):** Una mesa de mezclas que fusiona madera de nogal con interfaces proyectadas. Incluye un visualizador de espectro masivo y perillas holográficas para ajustar el pacing, sarcasmo o tensión en tiempo real.\n4. **El Scriptorium Colaborativo (eBooks):** Un lienzo oscuro dividido con cursores colaborativos de colores para cada IA. Incorpora 'Glosas Digitales' en los márgenes para que los agentes debatan la estructura antes de escribir.`;
    
    const backendContent = `# CoautorIA: Backend Architecture\n\n1. **Jerarquías**: Tablas y enrutadores que limitan y controlan si un conjunto es un 'Team' (3-12) o evoluciona a un 'Enterprise' (13+).\n2. **Debate/Filosofía**: Uso intensivo de WebSockets en FastAPI para simular una sala de chat donde el modelo actúa en "Streaming". El usuario se conecta a la sala como espectador pasivo (o activo) mientras los agentes argumentan.\n3. **Cadenas (Spans)**: Creación de un sistema de "Workflows" asíncrono con BackgroundTasks donde el output de un Agente Guionista se inyecta automáticamente como el input_context de un Agente Locutor o Revisor. Todo el producto final y la metadata se almacenarán en la biblioteca.`;
    
    const strategyContent = `# CoautorIA: Product Strategy\n\n1. **Agentes individuales autónomos**: Consultores, Speakers, Referentes.\n2. **Equipos (Teams)**: 3 a 12 agentes trabajando en un área comercial o auditoría.\n3. **Empresas**: 13+ agentes operando en conjunto bajo roles directivos.\n4. **Fusión %**: El usuario podrá ajustar el 'Nivel de Fricción' (qué tan de acuerdo o en desacuerdo están los agentes) al fusionarlos. Si hay baja compatibilidad, se activan protocolos de resolución de conflictos.`;
    
    setContents({ uiux: uiuxContent, backend: backendContent, strategy: strategyContent });
  }, []);

  const handlePlayTTS = () => {
    const text = contents[activeTab].replace(/[#*]/g, '');
    play(text);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] text-gray-200">
      <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-[#080808]">
        <div>
          <h1 className="text-2xl font-light text-cyan-400 flex items-center gap-3">
            <UserSwitch size={32} weight="duotone" /> CoautorIA
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">Laboratorio de Equipos, Empresas y Medios Autónomos</p>
        </div>
        
        <div className="flex gap-2">
          {isActive ? (
            isPaused ? (
              <button onClick={resume} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30">
                <PlayCircle size={20} /> Reanudar Lectura
              </button>
            ) : (
              <button onClick={pause} className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                <PauseCircle size={20} /> Pausar Lectura
              </button>
            )
          ) : (
            <button onClick={handlePlayTTS} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
              <PlayCircle size={20} weight="fill" /> Escuchar Propuesta
            </button>
          )}
          
          {isActive && (
            <button onClick={stop} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
              <StopCircle size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-zinc-800 px-8 pt-4 gap-4 bg-[#080808]">
        <button 
          onClick={() => setActiveTab('uiux')}
          className={`pb-4 border-b-2 font-medium flex items-center gap-2 transition-all ${activeTab === 'uiux' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <Cube size={18} /> UI/UX Design
        </button>
        <button 
          onClick={() => setActiveTab('backend')}
          className={`pb-4 border-b-2 font-medium flex items-center gap-2 transition-all ${activeTab === 'backend' ? 'border-purple-400 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <Target size={18} /> Backend Arch
        </button>
        <button 
          onClick={() => setActiveTab('strategy')}
          className={`pb-4 border-b-2 font-medium flex items-center gap-2 transition-all ${activeTab === 'strategy' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          <Target size={18} /> Product Strategy
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-3xl prose prose-invert prose-cyan">
          <ReactMarkdown>{contents[activeTab]}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
