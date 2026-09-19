import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTTSStore } from '../lib/ttsStore';
import { PlayCircle, StopCircle, UserSwitch, Target, Cube, PauseCircle } from '@phosphor-icons/react';

export default function CoautorIA() {
  const [activeTab, setActiveTab] = useState<'uiux' | 'backend' | 'strategy'>('uiux');
  const [contents, setContents] = useState({ uiux: '', backend: '', strategy: '' });
  
  const { play, stop, isActive, isPaused, pause, resume } = useTTSStore();

  useEffect(() => {
    const uiuxContent = `# CoautorIA: UI/UX "Quantum Leap"\n\n1. **El Motor de Fricción Cuántica:** Un dial rotativo holográfico que permite al usuario ajustar el "% de Compatibilidad". Al bajar la compatibilidad, la UI se vuelve más turbulenta e inyecta "Agentes Adversarios" en rojo.\n2. **Visualizador de DAGs:** El antiguo grid de avatares se reemplaza por un canvas infinito (React Flow) donde el usuario conecta agentes (Nodos) con líneas de eventos (Ejes), modelando enjambres industriales.\n3. **Dashboard de Turbulencia:** Para las "Salas de Debate" y "Estaciones de Radio", se muestran medidores en tiempo real del "Flujo Laminar" (consenso) vs "Caos Creativo" (disrupción).\n4. **La Fábrica (eBooks):** Una interfaz estilo pipeline CI/CD donde el usuario ve el progreso de map-reduce: "Worldbuilding -> Capítulos Paralelos -> Coherencia Final".`;
    
    const backendContent = `# CoautorIA: Backend Architecture (DAG & Enjambres)\n\n1. **Jerarquías Escalares**: Agentes Individuales (Event-driven), Equipos/Células (3-12 agentes orquestados en Estrella/Anillo) y Empresas/Megacorporaciones (13+ agentes con un Bus de Eventos Pub/Sub Industrial tipo Kafka/RabbitMQ).\n2. **Redes Adversarias**: Integración nativa de agentes "Red Team" diseñados exclusivamente para atacar las premisas del agente "Blue Team", fomentando heurísticas disyuntivas.\n3. **Flujo de Ejecución (Radio/eBook)**: Cadenas DAG (Directed Acyclic Graph) donde el output de un nodo detona la ejecución en paralelo de *N* nodos subsecuentes. Ej: Scraper -> Guionista -> TTS -> Ingeniero de Sonido, todo procesado en streaming asíncrono.`;
    
    const strategyContent = `# CoautorIA: Product Strategy (Industrial Swarms)\n\n1. **Agentes Autónomos Individuales**: Micro-trabajadores de alta precisión para tareas deterministas.\n2. **Equipos (Teams)**: Células ágiles de 3-12 agentes (ej. Área Comercial) organizadas bajo un Manager.\n3. **Empresas**: 13+ agentes operando como una multinacional. Directorio (estrategia top-down), Mandos Medios (encolado de tareas) y Operativos (ejecución map-reduce).\n4. **Fusión & Compatibilidad Cuántica**: El valor clave ya no es "juntar a dos personas", sino dictar la fricción. Alta compatibilidad = Flujo laminar (eficiencia, consenso rápido). Baja compatibilidad = Turbulencia (disrupción, innovación adversarial).`;
    
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
