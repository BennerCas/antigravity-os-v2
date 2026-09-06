import codecs

content = """export const flowTemplates = [
  // BÁSICO
  {
    id: 'tpl_b1', name: 'Agente de Ventas B2B', engine: 'CrewAI', nodes: 3, complexity: 'Basico', sublevel: 1, category: 'Ventas',
    description: 'Pipeline lineal que perfila una empresa en LinkedIn, genera un ángulo de venta personalizado y redacta un cold email. Excelente punto de partida para entender la secuencialidad.',
    masterPrompt: 'Genera un flujo CrewAI con 3 agentes: 1. Profiler (analiza perfil LinkedIn). 2. Estratega (crea angulo de venta). 3. Copywriter (redacta email). Tarea secuencial.',
    learningObjective: 'Transición de prompts simples a cadenas secuenciales lógicas.',
    frameworkMastery: 'CrewAI: Pasar el output del Nodo 1 como input del Nodo 2 requiere mapear variables explícitas y definir tareas con claras dependencias.',
    apis: 'OpenAI + Serper', time: '~30 seg', useCases: ['Redacción', 'SEO', 'Blog']
  },
  {
    id: 'tpl_b2', name: 'Clasificador de Soporte', engine: 'LangGraph', nodes: 4, complexity: 'Basico', sublevel: 2, category: 'Atención al Cliente',
    description: 'Grafo condicional simple. Lee un ticket de soporte, lo clasifica por urgencia (Baja, Media, Alta) y lo enruta al departamento correspondiente para generar una respuesta base.',
    masterPrompt: 'Construye un grafo LangGraph con 4 nodos: Ingesta, Clasificador, Soporte Tecnico, Facturacion. El clasificador enruta el ticket segun el problema.',
    learningObjective: 'Clasificación de intenciones y enrutamiento básico (Routing).',
    frameworkMastery: 'LangGraph: Utilizar nodos condicionales (edges) para evaluar el volumen de quejas y derivarlas sin perder el contexto global (State).',
    apis: 'Anthropic Claude', time: '~45 seg', useCases: ['Soporte', 'Tickets', 'CX']
  },
  {
    id: 'tpl_b3', name: 'Code Reviewer Automático', engine: 'AutoGen', nodes: 3, complexity: 'Basico', sublevel: 3, category: 'Desarrollo',
    description: 'Un programador escribe código y un revisor lo audita buscando vulnerabilidades o malas prácticas. Si falla, se lo devuelve para corrección.',
    masterPrompt: 'Chat AutoGen entre Coder y Revisor. El Coder escribe una funcion, el Revisor la audita. Deben iterar hasta que no haya errores.',
    learningObjective: 'Bucle de retroalimentación (Feedback loop) entre agentes.',
    frameworkMastery: 'AutoGen: Permite que el agente Linter/Revisor ejecute código real localmente o en Docker y devuelva el error crudo al Coder de forma autónoma.',
    apis: 'Local (Ollama)', time: '~1 min', useCases: ['Refactor', 'Code Review']
  },

  // INTERMEDIO
  {
    id: 'tpl_i1', name: 'Pipeline Outreach Masivo', engine: 'CrewAI', nodes: 6, complexity: 'Intermedio', sublevel: 1, category: 'Ventas',
    description: 'Sistema de prospección profunda. Investiga a la empresa, a la industria y a los competidores en paralelo antes de que el copywriter fusione los datos en una campaña.',
    masterPrompt: 'Crea un equipo CrewAI B2B. Agentes: Profiler, Icebreaker, Cold Copywriter, Follow-up Strategist, QA Spam Checker. Pipeline de contacto completo.',
    learningObjective: 'Orquestación de tareas en paralelo (Asíncronas).',
    frameworkMastery: 'CrewAI: Ejecutar nodos de investigación en paralelo (async) reduce el tiempo total de ejecución antes de unificar el volumen en el prompt masivo de redacción.',
    apis: 'Groq + Tavily', time: '~2 min', useCases: ['Outreach B2B', 'Ventas']
  },
  {
    id: 'tpl_i2', name: 'Auditor de Seguridad DevSecOps', engine: 'AutoGen', nodes: 6, complexity: 'Intermedio', sublevel: 2, category: 'Ciberseguridad',
    description: 'Chat grupal para auditoría de código. Scanner busca CVEs, Exploiter intenta romperlo, Patcher lo arregla y Reviewer aprueba el parche. Termina con un reporte de compliance.',
    masterPrompt: 'GroupChat en AutoGen con 6 agentes: Scanner, Exploiter, Patcher, Security Reviewer, Compliance Officer y Reporter.',
    learningObjective: 'Debates, consensos multi-agente y roles adversarios.',
    frameworkMastery: 'AutoGen: Manejar alto volumen de prompts en GroupChat requiere un system prompt estricto en el Manager para evitar alucinaciones en cadena.',
    apis: 'OpenAI + GitHub', time: '~3 min', useCases: ['DevSecOps', 'Compliance']
  },
  {
    id: 'tpl_i3', name: 'Fábrica de Landing Pages', engine: 'LangGraph', nodes: 6, complexity: 'Intermedio', sublevel: 3, category: 'Desarrollo Frontend',
    description: 'Agencia web automatizada. Genera copy, estructura UX/UI en JSON y escribe componentes React+Tailwind. Un Linter rechaza el código si no compila, forzando iteraciones.',
    masterPrompt: 'Grafo condicional LangGraph. Nodos: Copywriter, UX Designer, React Coder, Linter, UI Reviewer. Logica: Si Linter falla, regresa al Coder.',
    learningObjective: 'Manejo de estado condicional y recuperación de errores.',
    frameworkMastery: 'LangGraph: Si un nodo falla, el grafo retrocede inyectando el log de errores como estado (State) acumulado, enseñando al agente cómo no repetir el fallo.',
    apis: 'Anthropic + Vercel', time: '~5 min', useCases: ['Web Dev', 'Prototipado']
  },

  // AVANZADO
  {
    id: 'tpl_a1', name: 'Ecosistema Startup Software', engine: 'AutoGen', nodes: 8, complexity: 'Avanzado', sublevel: 1, category: 'Ingenieria',
    description: 'Simulación de una startup. El PM lanza historias, Arquitecto divide tareas, Devs programan, QA testea y DevOps despliega contenedores. Liderado por un Scrum Master.',
    masterPrompt: 'Orquesta entorno AutoGen. 8 agentes: PM, Arquitecto, Frontend, Backend, QA, DevOps, Scrum Master, Tech Lead. Flujo de CI/CD simulado.',
    learningObjective: 'Arquitecturas de enjambre (Swarm) y jerarquías complejas.',
    frameworkMastery: 'AutoGen: Escalar a 8+ agentes requiere sub-grupos jerárquicos. El Arquitecto actúa como proxy, filtrando ruido antes de pasar instrucciones a los Devs.',
    apis: 'Multi-Model', time: '~10 min', useCases: ['Startups', 'Agile']
  },
  {
    id: 'tpl_a2', name: 'Fondo de Cobertura Quant AI', engine: 'LangGraph', nodes: 9, complexity: 'Avanzado', sublevel: 2, category: 'Finanzas',
    description: 'Trading algorítmico. Scraping de noticias, análisis de sentimiento y evaluación técnica. Incluye rutas de emergencia ante picos de volatilidad (Circuit Breakers).',
    masterPrompt: 'StateGraph bursatil. 9 Nodos: Scraper, Sentiment, Macro, Quant Model, Risk Manager, Exec, Alert. Circuit breaker ante crisis.',
    learningObjective: 'Interruptores de emergencia (Circuit Breakers) y control de flujo.',
    frameworkMastery: 'LangGraph: Las rutas short-circuit permiten que, si se detecta pánico en el mercado, se ignoren los nodos pesados de análisis y salte a venta inmediata.',
    apis: 'Bloomberg + OpenAI', time: '~15 min', useCases: ['Trading Quant', 'Riesgos']
  },
  {
    id: 'tpl_a3', name: 'Agencia de Marketing 360°', engine: 'CrewAI', nodes: 10, complexity: 'Avanzado', sublevel: 3, category: 'Empresarial',
    description: 'Corporación jerárquica con Director delegando a expertos SEO, copywriters, promters Midjourney y gestores Ads. Retroalimentación inter-departamental masiva.',
    masterPrompt: 'Crew empresarial masiva. 10 agentes jerarquicos bajo un Director. Campañas multicanal, PR, diseño visual y validacion legal.',
    learningObjective: 'Delegación jerárquica masiva y fragmentación de tareas.',
    frameworkMastery: 'CrewAI: Usar un Manager Agent. Se le pasa un brief monstruoso de 10k tokens, y él autónomamente genera mini-prompts hiper-específicos para cada agente subordinado.',
    apis: 'OpenAI + Midjourney', time: '~20 min', useCases: ['Marketing 360', 'Agencias']
  },
  {
    id: 'tpl_a4', name: 'Upgrade Atomizado (Editado)', engine: 'LangGraph', nodes: 12, complexity: 'Avanzado', sublevel: 4, category: 'Optimizacion',
    description: 'Desglosa sistemas grandes en componentes hiper-eficientes. Mapea la arquitectura, diseña el refactor por capas, y distribuye las tareas entre agentes especialistas.',
    masterPrompt: 'Despliega el flujo Upgrade Atomizado. Nodos: Analista de Sistema, Desglosador de Componentes, Optimizador de Código, Revisor de Arquitectura.',
    learningObjective: 'Descomposición de prompts monstruosos en átomos lógicos.',
    frameworkMastery: 'LangGraph: Dividir un megasistema en 12 prompts atómicos de 800 tokens (vs 1 de 10k) evita bancarrota de contexto y alucinaciones. El State reensambla el puzzle.',
    apis: 'Anthropic + AST', time: '~12 min', useCases: ['Optimización', 'Refactor']
  },

  // EXPERTO
  {
    id: 'tpl_e1', name: 'Departamento R&D Deep Tech', engine: 'CrewAI', nodes: 14, complexity: 'Experto', sublevel: 1, category: 'Investigación Científica',
    description: '14 agentes que cruzan patentes, modelan hipótesis, simulan lógicas matemáticas y redactan whitepapers. Ingiere un problema complejo y escupe un framework innovador.',
    masterPrompt: 'CrewAI jerarquica de 14 nodos para R&D. Scrapers de patentes, sintetizadores, modeladores matematicos, junta de etica y redactores de whitepaper.',
    learningObjective: 'Ingesta de alto volumen de documentos con Memoria Vectorial (RAG).',
    frameworkMastery: 'CrewAI: Para procesar 50 papers científicos simultáneos, es obligatorio activar Entity Memory y acoplar ChromaDB para mantener la VRAM estable.',
    apis: 'Anthropic + Arxiv', time: '~45 min', useCases: ['Deep Tech', 'R&D', 'Papers']
  },
  {
    id: 'tpl_e2', name: 'SOC Ciberseguridad Enterprise', engine: 'LangGraph', nodes: 18, complexity: 'Experto', sublevel: 2, category: 'Ciberseguridad Enterprise',
    description: 'Centro de operaciones SOC. Monitorea logs, aísla endpoints, evalúa malware en sandbox, aplica YARA y despliega parches automáticos según reglas CVSS.',
    masterPrompt: 'Grafo de Estado Extremo con 18 nodos SOC. Ingesta de Logs, reglas YARA, ingenieria inversa, aislamiento de red, y despliegue de parches.',
    learningObjective: 'Orquestación Map-Reduce para ingesta masiva de eventos.',
    frameworkMastery: 'LangGraph: Utiliza dinámicamente nodos `Send` para desplegar 100 agentes en paralelo (Map) analizando alertas, y luego colapsa las respuestas (Reduce) en un solo dashboard.',
    apis: 'OpenAI + YARA', time: '~30 min', useCases: ['SOC', 'Respuesta Incidentes']
  },
  {
    id: 'tpl_e3', name: 'Imperio Medios Autónomo', engine: 'AutoGen', nodes: 22, complexity: 'Experto', sublevel: 3, category: 'Media & Producción',
    description: 'Conglomerado de noticias 24/7 sin humanos. 22 agentes: rastreadores de tendencias, periodistas, correctores, editores Midjourney/Video y publicadores API en 5 idiomas.',
    masterPrompt: 'Imperio mediatico AutoGen con 22 agentes. Grupos anidados de Investigacion, Redaccion, Multimedia y Distribucion automatica API.',
    learningObjective: 'Sistemas Autónomos de Producción Continua (Infinite Loops).',
    frameworkMastery: 'AutoGen: Operar 24/7 requiere inyectar limpiadores de contexto dinámicos y establecer límites hiperestrictos (Max_Turns) para evitar el desbordamiento de tokens y colapso de API.',
    apis: 'Multi-API Global', time: '24/7 (Continuo)', useCases: ['Media', 'Broadcasting']
  }
];
"""

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\data\flowsTemplates.ts'
with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
