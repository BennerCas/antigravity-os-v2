import re

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "r", encoding="utf-8") as f:
    content = f.read()

robust_swarms = """  const swarm1 = [
    { id: 'entrevistador', title: 'Entrevistador Socrático', icon: <Brain size={18} className="text-[#10b981]" weight="duotone" />, desc: 'Nodo 1 del Enjambre Radar. Usa mayéutica profunda para diseccionar la ambigüedad del usuario, extrayendo intenciones ocultas antes de que se conviertan en requerimientos erróneos.' },
    { id: 'francotirador', title: 'Francotirador Industria', icon: <MagnifyingGlass size={18} className="text-[#e11d48]" weight="duotone" />, desc: 'Nodo 2 del Enjambre Radar. Escanea la web y bases de conocimiento en tiempo real para cruzar las respuestas del usuario con métricas de mercado y tendencias de la industria.' },
    { id: 'analista-viabilidad', title: 'Analista de Viabilidad', icon: <Scales size={18} className="text-[#f5a623]" weight="duotone" />, desc: 'Nodo 3 del Enjambre Radar. Computa la carga cognitiva y el costo de infraestructura. Destruye promesas tecnológicas imposibles antes de escribirlas.' },
    { id: 'profiler', title: 'Profiler Psicológico', icon: <Strategy size={18} className="text-[#8b5cf6]" weight="duotone" />, desc: 'Nodo 4 del Enjambre Radar. Traza el perfil conductual del usuario o del cliente final para adaptar la fricción de la interfaz y la narrativa del proyecto.' }
  ];

  const swarm2 = [
    { id: 'arquitecto-cuestionario', title: 'Arquitecto Extracción', icon: <Network size={18} className="text-[#3b82f6]" weight="duotone" />, desc: 'Nodo 1 del Inquisidor. Transmuta los hallazgos del Radar en un cuestionario técnico agresivo que fuerza definiciones precisas sobre arquitectura y flujos.' },
    { id: 'red-teamer', title: 'Red Teamer', icon: <BugBeetle size={18} className="text-[#facc15]" weight="duotone" />, desc: 'Nodo 2 del Inquisidor. Atacante asimétrico. Su única función es destrozar el cuestionario del Arquitecto, revelando huecos de seguridad, lógica circular o sesgos de diseño.' },
    { id: 'escribano', title: 'El Escribano', icon: <Wrench size={18} className="text-[#14b8a6]" weight="duotone" />, desc: 'Nodo 3 del Inquisidor. Redacta el Contrato I/O definitivo en JSON inmutable, sellando los parámetros técnicos tras la colisión entre el Arquitecto y el Red Teamer.' }
  ];

  const swarm3 = [
    { id: 'flow-designer', title: 'System Designer', icon: <Cube size={18} className="text-[#06b6d4]" weight="duotone" />, desc: 'Nodo 1 de La Forja. Genera grafos de estado y arquitecturas de microservicios, ensamblando el Blueprint base a partir del Contrato I/O del Escribano.' },
    { id: 'auditor', title: 'Auditor Cero-Trust', icon: <ShieldCheck size={18} className="text-[#f43f5e]" weight="duotone" />, desc: 'Nodo 2 de La Forja. Aplica discriminación topológica. Escanea el Blueprint en busca de fugas de memoria, cuellos de botella asíncronos y fallas de dependencias.' },
    { id: 'juez', title: 'El Juez (AureliOS)', icon: <Cpu size={18} className="text-[#d946ef]" weight="duotone" />, desc: 'Nodo 3 de La Forja. El árbitro definitivo. Juzga el Blueprint contra las directrices de Antigravity OS y orquesta el Match & Fuse final si se aprueba el despliegue.' },
    { id: 'tts-animador', title: 'Narrador TTS', icon: <SpeakerHigh size={18} className="text-[#64748b]" weight="duotone" />, desc: 'Nodo 4 de La Forja. Sintetizador de voz cuántico. Traduce el caos determinista de los enjambres en un reporte auditivo fluido y humano para la toma de decisiones.' }
  ];"""

content = re.sub(
    r'const swarm1 = \[.*?\];\s*const swarm2 = \[.*?\];\s*const swarm3 = \[.*?\];',
    robust_swarms,
    content,
    flags=re.DOTALL
)

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated robust descriptions.")
