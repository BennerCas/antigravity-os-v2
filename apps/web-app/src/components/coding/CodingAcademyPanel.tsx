import { useState, useRef } from 'react';
import { Play, Stop, BookOpen, Code, GraduationCap, ArrowRight, SpeakerHigh } from '@phosphor-icons/react';

interface CodingAcademyPanelProps {
  onLoadExample: (content: string, framework: string) => void;
}

export default function CodingAcademyPanel({ onLoadExample }: CodingAcademyPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingCard, setPlayingCard] = useState<number | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  const guideText = `
Bienvenido al Módulo Coding de Antigravity OS.
Aquí puedes crear, orquestar y ejecutar ecosistemas de Agentes de IA usando frameworks de grado industrial como Crew A I, AutoGen y LangGraph.

¿Cómo funciona el flujo de trabajo?
1. Escribe o carga un prompt en el Editor. Puedes usar los prompts de la base de datos Atlas desde el panel izquierdo.
2. Selecciona el Framework que mejor se adapte a tu tarea. Usa Crew AI para flujos de trabajo colaborativos y estructurados, AutoGen para resolución de problemas mediante debate entre agentes, o LangGraph para procesos complejos basados en estado y grafos condicionales.
3. Haz clic en "Compilar". El Meta-Orquestador procesará tu idea y generará el código Python puro necesario.
4. Finalmente, haz clic en "Run". Tu código se enviará al Sandbox seguro de Antigravity OS y verás la ejecución en tiempo real en la Terminal interactiva inferior.

Si ocurre un error durante la ejecución, el sistema de Auto-Healing intervendrá para intentar reparar y reanudar el código.

A continuación, tienes 10 ejemplos reales para empezar. Haz clic en "Cargar al Editor" para inyectarlos y empezar a experimentar.
  `.trim();

  const handleTTS = () => {
    if (!synthRef.current) return;
    setPlayingCard(null);
    
    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    synthRef.current.cancel(); // Clear any ongoing speech
    const utterance = new SpeechSynthesisUtterance(guideText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    synthRef.current.speak(utterance);
  };

  const examples = [
    {
      title: "1. Investigador Básico",
      level: "Básico",
      framework: "crewai",
      desc: "Un equipo simple de investigación y redacción.",
      content: "Crea un equipo de CrewAI con dos agentes:\n1. 'Research Analyst': Investiga las últimas 3 tendencias en Inteligencia Artificial Generativa del mes actual.\n2. 'Tech Writer': Toma los datos del analista y escribe un post de blog corto de 3 párrafos en español."
    },
    {
      title: "2. Creador de Contenido SEO",
      level: "Básico",
      framework: "crewai",
      desc: "Genera artículos optimizados para buscadores.",
      content: "Genera una estructura de artículo SEO sobre 'Domótica para el Hogar' usando CrewAI. Necesito:\n1. Agente SEO: Encuentra palabras clave principales.\n2. Copywriter: Escribe el borrador optimizado.\n3. Editor: Revisa y asegura que el tono sea persuasivo."
    },
    {
      title: "3. Pair Programming",
      level: "Intermedio",
      framework: "autogen",
      desc: "Dos agentes que debaten código para mejorarlo.",
      content: "Usa AutoGen para crear un chat entre:\n1. Un 'Desarrollador React' que escribe un componente de un botón con TailwindCSS.\n2. Un 'Revisor de Código' que analiza el componente y sugiere mejoras de accesibilidad (a11y)."
    },
    {
      title: "4. Analista de Datos JSON",
      level: "Intermedio",
      framework: "autogen",
      desc: "Extrae insights de datos estructurados.",
      content: "Configura agentes en AutoGen para analizar un JSON ficticio de ventas. Un agente propone una estructura de base de datos SQL para esos datos, y el otro agente valida la normalización de la tabla."
    },
    {
      title: "5. QA Automático y Reflexión",
      level: "Avanzado",
      framework: "langgraph",
      desc: "Grafo cíclico donde el código es evaluado y corregido.",
      content: "Diseña un flujo LangGraph de 3 nodos:\n1. Nodo 'Generador': Escribe una función en Python para calcular números primos.\n2. Nodo 'Evaluador': Revisa si el código es eficiente.\n3. Nodo 'Corrector': Si el evaluador detecta O(n^2), el corrector optimiza a O(n log n). El flujo debe volver al evaluador."
    },
    {
      title: "6. Arquitecto Cloud AWS",
      level: "Avanzado",
      framework: "crewai",
      desc: "Diseño de infraestructura multi-capa.",
      content: "Usando CrewAI, simula un departamento de TI:\n1. 'Cloud Architect': Propone la arquitectura AWS para una app web de alto tráfico.\n2. 'Security Specialist': Asegura que la arquitectura cumpla con SOC2 (VPCs, IAM).\n3. 'DevOps': Escribe un resumen de los scripts de Terraform necesarios."
    },
    {
      title: "7. Ciberseguridad: Auditoría",
      level: "Avanzado",
      framework: "autogen",
      desc: "Simula un Red Team y un Blue Team.",
      content: "Flujo AutoGen:\nCrea un agente 'Red Team' que proponga 3 ataques comunes a una API REST (ej. SQLi, IDOR, Rate Limiting), y un agente 'Blue Team' que responda con las mitigaciones exactas en Node.js."
    },
    {
      title: "8. Orquestador de Soporte Técnico",
      level: "Experto",
      framework: "langgraph",
      desc: "Clasificación de tickets con nodos condicionales.",
      content: "Crea un LangGraph de triaje de soporte:\n1. Nodo 'Clasificador': Lee un ticket ('Mi servidor se apagó').\n2. Si es hardware -> Nodo 'Soporte Nivel 2'.\n3. Si es software -> Nodo 'Soporte Nivel 1'.\n4. Nodo 'Respuesta': Formula la respuesta final al cliente."
    },
    {
      title: "9. Meta-Ingeniero de Prompts",
      level: "Experto",
      framework: "crewai",
      desc: "Agentes creando prompts para otros agentes.",
      content: "Crea una cadena de CrewAI meta-cognitiva:\n1. 'Prompt Engineer': Diseña el mejor prompt posible para un modelo de lenguaje que debe escribir código C++.\n2. 'QA Agent': Evalúa el prompt, le busca fallas de ambigüedad y lo refina.\n3. 'Output Formatter': Transforma el prompt final a un formato JSON limpio."
    },
    {
      title: "10. Flujo Completo Antigravity",
      level: "Máster",
      framework: "autogen",
      desc: "El pipeline final de generación de software.",
      content: "Sistema AutoGen avanzado:\n1. Agente 'Product Manager': Define los requerimientos de un script de Python (ej. Scraper de precios).\n2. Agente 'Senior Developer': Escribe el código utilizando BeautifulSoup.\n3. Agente 'Tester': Simula una prueba unitaria del scraper.\n4. Agente 'Documentador': Escribe el README.md del script."
    }
  ];

  const handleCardTTS = (index: number, title: string, desc: string, e: any) => {
    e.stopPropagation();
    if (!synthRef.current) return;
    
    setIsPlaying(false);

    if (playingCard === index) {
      synthRef.current.cancel();
      setPlayingCard(null);
      return;
    }

    setPlayingCard(index);
    synthRef.current.cancel(); 
    
    const text = `${title}. ${desc}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.05;
    
    utterance.onend = () => setPlayingCard(null);
    utterance.onerror = () => setPlayingCard(null);
    
    synthRef.current.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-[#151515] p-5 text-white overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <GraduationCap size={28} weight="fill" className="text-white" />
          <h2 className="text-2xl font-bold tracking-tight">Guía & Academy</h2>
        </div>
        <button
          onClick={handleTTS}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-300 ${
            isPlaying 
              ? 'bg-[#FFFFFF] text-[#000000]' 
              : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
          }`}
        >
          {isPlaying ? <Stop size={18} weight="fill" /> : <Play size={18} weight="fill" />}
          <span>{isPlaying ? 'Detener Guía' : 'Escuchar Guía Interactiva'}</span>
        </button>
      </div>

      <div className="bg-[#000000] border border-[#2A2A2A] rounded-xl p-5 mb-5 text-[15px] text-[#d0d0d0] leading-relaxed shadow-sm shrink-0">
        <h3 className="text-white text-xl font-semibold mb-3 flex items-center gap-2">
          <BookOpen size={20} />
          ¿Cómo funciona el Módulo Coding?
        </h3>
        <p className="mb-3">
          Este entorno unifica tus ideas con el poder de ejecución multi-agente de Antigravity OS. El flujo sigue 4 etapas principales:
        </p>
        <ul className="space-y-2 mb-2 list-none pl-1">
          <li className="flex gap-3">
            <span className="text-[#8A8A8A] font-bold">1.</span>
            <span><strong>Editor y Atlas:</strong> Define tu tarea. Puedes apoyarte del panel izquierdo para extraer Prompts pre-validados.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#8A8A8A] font-bold">2.</span>
            <span><strong>Framework:</strong> Elige el motor (<span className="text-white">CrewAI</span> para colaboración, <span className="text-white">AutoGen</span> para debates, <span className="text-white">LangGraph</span> para flujos cíclicos/condicionales).</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#8A8A8A] font-bold">3.</span>
            <span><strong>Compilación (Compiler):</strong> La IA traduce tu texto humano en código de orquestación nativo ejecutable.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-[#8A8A8A] font-bold">4.</span>
            <span><strong>Ejecución (Terminal):</strong> El script corre en el Sandbox seguro transmitiendo resultados vía WebSockets a la terminal inferior.</span>
          </li>
        </ul>
      </div>

      <h3 className="text-xl font-bold mb-3 flex items-center gap-2 shrink-0">
        <Code size={24} />
        Ejemplos de Producción
      </h3>
      
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 grid-rows-2 gap-4 w-full pb-1">
        {examples.map((ex, i) => (
          <div key={i} className="group bg-[#000000] border border-[#2A2A2A] hover:border-[#4A4A4A] transition-all duration-300 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex flex-col mb-2 gap-2 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-[16px] leading-tight line-clamp-2">{ex.title}</h4>
                  <button
                    onClick={(e) => handleCardTTS(i, ex.title, ex.desc, e)}
                    className="text-[#8A8A8A] hover:text-[#00FF41] transition-colors shrink-0 mt-0.5"
                    title="Escuchar explicación"
                  >
                    {playingCard === i ? <Stop size={16} weight="fill" className="text-[#FF6B6B]" /> : <SpeakerHigh size={16} />}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    ex.level === 'Básico' ? 'bg-[#1a2e1f] text-[#4ade80]' :
                    ex.level === 'Intermedio' ? 'bg-[#3b2a1a] text-[#fbbf24]' :
                    ex.level === 'Avanzado' ? 'bg-[#3a1a1f] text-[#f87171]' :
                    'bg-[#2d1b3f] text-[#c084fc]'
                  }`}>
                    {ex.level}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#151515] border border-[#2A2A2A] text-[#8A8A8A] font-bold uppercase tracking-wider">
                    {ex.framework}
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-[#8A8A8A] leading-relaxed line-clamp-3 overflow-hidden flex-1">{ex.desc}</p>
            </div>
            
            <button
              onClick={() => onLoadExample(ex.content, ex.framework)}
              className="flex items-center justify-center gap-2 w-full py-1.5 bg-[#151515] border border-[#2A2A2A] hover:bg-[#FFFFFF] hover:text-[#000000] hover:border-[#FFFFFF] transition-all rounded-md text-[14px] font-medium shrink-0 mt-3"
            >
              Cargar
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
