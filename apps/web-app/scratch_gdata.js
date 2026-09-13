const gData = {
  nodes: [
    // --- NODO CENTRAL / ROOT ---
    {
      id: 'center',
      name: 'FLOWARCHITECT AI',
      desc: 'Sistema Nervioso y Arquitectura\nde Flujos Agénticos Autónomos',
      val: 50,
      color: '#ffffff',
      icon: '🧠',
      group: 0
    },

    // ==========================================
    // TIER 1: FOUNDATION (Nivel 1 - 2)
    // ==========================================

    // 1. Navegación del Canvas
    {
      id: 'n1',
      name: '1. Navegación del Canvas',
      desc: 'Control espacial del viewport, atajos de teclado, encuadre semántico y ergonomía de orquestación visual.',
      val: 32,
      color: '#00f5d4',
      icon: '🧭',
      group: 1
    },
    { id: 'n1_1', name: 'Control de Viewport y Zoom Semántico', desc: 'Dominio de coordenadas, encuadres focales y renderizado adaptativo del lienzo.', val: 12, color: '#00f5d4', group: 1, isSub: true },
    { id: 'n1_2', name: 'Gestión Espacial y Layout de Nodos', desc: 'Topología limpia, minimización de cruces de cables y jerarquía visual de flujos.', val: 12, color: '#00f5d4', group: 1, isSub: true },
    { id: 'n1_3', name: 'Comandos Rápidos y Keybindings', desc: 'Paleta de acciones contextuales y navegación por teclado a alta velocidad.', val: 12, color: '#00f5d4', group: 1, isSub: true },

    // 2. Conexiones de Grafo
    {
      id: 'n2',
      name: '2. Conexiones de Grafo',
      desc: 'Tipado estricto de puertos, topología dirigida acíclica (DAG) y enrutamiento reactivo de señales de control.',
      val: 32,
      color: '#00b4d8',
      icon: '🕸️',
      group: 2
    },
    { id: 'n2_1', name: 'Tipado e Incompatibilidad de Puertos', desc: 'Validación estricta de interfaces entre nodos emisores y receptores.', val: 12, color: '#00b4d8', group: 2, isSub: true },
    { id: 'n2_2', name: 'Topología Dirigida y Detección de Ciclos', desc: 'Estructuración formal DAG y prevención de bloqueos recursivos no controlados.', val: 12, color: '#00b4d8', group: 2, isSub: true },
    { id: 'n2_3', name: 'Routing de Aristas y Señales de Control', desc: 'Diferenciación declarativa entre tubería de datos y bifurcación de ejecución.', val: 12, color: '#00b4d8', group: 2, isSub: true },

    // ==========================================
    // TIER 2: BUILDER (Nivel 3 - 6)
    // ==========================================

    // 3. Contratos de Datos y Transforms
    {
      id: 'n3',
      name: '3. Contratos de Datos\ny Transforms',
      desc: 'Esquemas JSON estrictos, proyecciones funcionales inmutables y validación perimetral con Zod.',
      val: 32,
      color: '#00f076',
      icon: '📋',
      group: 3
    },
    { id: 'n3_1', name: 'Esquemas Estrictos con Zod y JSON-Schema', desc: 'Contratos inmutables de entrada y salida con validación en frontera de nodos.', val: 12, color: '#00f076', group: 3, isSub: true },
    { id: 'n3_2', name: 'Transformaciones Funcionales Puras', desc: 'Pipelines de proyección, mapeo y filtrado sin efectos secundarios ni mutaciones.', val: 12, color: '#00f076', group: 3, isSub: true },
    { id: 'n3_3', name: 'Normalización y Deserialización Segura', desc: 'Manejo defensivo de estados corruptos, defaults deterministas y sanitización.', val: 12, color: '#00f076', group: 3, isSub: true },

    // 4. Decisiones Deterministas
    {
      id: 'n4',
      name: '4. Decisiones Deterministas',
      desc: 'Bifurcaciones por lógica formal, árboles de decisión booleanos y garantía exhaustiva de parada.',
      val: 32,
      color: '#70e000',
      icon: '⚖️',
      group: 4
    },
    { id: 'n4_1', name: 'Enrutamiento por Reglas Booleanas', desc: 'Lógica condicional determinista sin ambigüedad probabilística.', val: 12, color: '#70e000', group: 4, isSub: true },
    { id: 'n4_2', name: 'Branching Exhaustivo y Casos Límite', desc: 'Cobertura total de caminos de borde con rutas de escape garantizadas.', val: 12, color: '#70e000', group: 4, isSub: true },
    { id: 'n4_3', name: 'Tablas de Decisión y Predicados Puros', desc: 'Evaluación de condiciones atómicas en tiempo O(1) con aislamiento de estado.', val: 12, color: '#70e000', group: 4, isSub: true },

    // 5. Clasificación con IA
    {
      id: 'n5',
      name: '5. Clasificación con IA',
      desc: 'Categorización semántica zero/few-shot, calibración de confianza y detección de desvío temático.',
      val: 32,
      color: '#ffe600',
      icon: '🏷️',
      group: 5
    },
    { id: 'n5_1', name: 'Clasificación Semántica Zero y Few-Shot', desc: 'Asignación de intención mediante ejemplos contextuales y prompts de anclaje.', val: 12, color: '#ffe600', group: 5, isSub: true },
    { id: 'n5_2', name: 'Calibración de Umbrales de Confianza', desc: 'Enrutamiento condicionado al score probabilístico con fallback defensivo.', val: 12, color: '#ffe600', group: 5, isSub: true },
    { id: 'n5_3', name: 'Detección de Ambigüedad y Topic Drift', desc: 'Aislamiento de entradas fuera de dominio para evitar alucinaciones operativas.', val: 12, color: '#ffe600', group: 5, isSub: true },

    // 6. Prompt Engineering como Código
    {
      id: 'n6',
      name: '6. Prompt Engineering\ncomo Código',
      desc: 'Versionado semántico de prompts, templates declarativos con tipado y constrained decoding JSON.',
      val: 32,
      color: '#ff9f1c',
      icon: '💻',
      group: 6
    },
    { id: 'n6_1', name: 'Plantillas Declarativas Tipadas', desc: 'Interpolación segura de variables con aislamiento contra inyección de instrucciones.', val: 12, color: '#ff9f1c', group: 6, isSub: true },
    { id: 'n6_2', name: 'Salidas JSON Garantizadas por Gramática', desc: 'Forzado sintáctico mediante constrained decoding y schemas formales en el LLM.', val: 12, color: '#ff9f1c', group: 6, isSub: true },
    { id: 'n6_3', name: 'Versionado Semántico y Diffs de Prompts', desc: 'Control de versiones Git para instrucciones, changelogs y suites de regresión.', val: 12, color: '#ff9f1c', group: 6, isSub: true },

    // ==========================================
    // TIER 3: OPERATOR (Nivel 7 - 10)
    // ==========================================

    // 7. Capabilities y Mínimo Privilegio
    {
      id: 'n7',
      name: '7. Capabilities y\nMínimo Privilegio',
      desc: 'Seguridad perimetral en tool-use, aislamiento de API keys, cuotas de tokens y prevención de inyección indirecta.',
      val: 32,
      color: '#ff5400',
      icon: '🛡️',
      group: 7
    },
    { id: 'n7_1', name: 'Modelado de Scopes y Permisos Granulares', desc: 'Asignación estricta de capacidades de lectura/escritura por cada nodo individual.', val: 12, color: '#ff5400', group: 7, isSub: true },
    { id: 'n7_2', name: 'Sandboxing y Defensa Indirect Injection', desc: 'Filtrado de datos no confiables de terceros antes de exponerlos a herramientas.', val: 12, color: '#ff5400', group: 7, isSub: true },
    { id: 'n7_3', name: 'Gestión Criptográfica de Secretos y Cuotas', desc: 'Rotación de credenciales, límites presupuestarios de tokens y rate-limiting.', val: 12, color: '#ff5400', group: 7, isSub: true },

    // 8. Fiabilidad, Retry e Idempotencia
    {
      id: 'n8',
      name: '8. Fiabilidad, Retry\ne Idempotencia',
      desc: 'Backoff exponencial con jitter, patrones circuit breaker y transacciones exactly-once ante fallas.',
      val: 32,
      color: '#ff0055',
      icon: '🔄',
      group: 8
    },
    { id: 'n8_1', name: 'Backoff Exponencial con Full Jitter', desc: 'Reintentos distribuidos aleatoriamente para evitar sobrecargas sincrónicas.', val: 12, color: '#ff0055', group: 8, isSub: true },
    { id: 'n8_2', name: 'Circuit Breaker y Degradación Graciosa', desc: 'Interrupción de llamadas a proveedores caídos con conmutación a respuestas cached.', val: 12, color: '#ff0055', group: 8, isSub: true },
    { id: 'n8_3', name: 'Claves Idempotentes y Side-Effects Seguros', desc: 'Garantía de ejecución exactly-once en operaciones críticas con impacto transaccional.', val: 12, color: '#ff0055', group: 8, isSub: true },

    // 9. Human-in-the-Loop Resiliente
    {
      id: 'n9',
      name: '9. Human-in-the-Loop\nResiliente',
      desc: 'Pausa de estado persistente, timeouts de SLA con escalamiento automático y revisión contextual.',
      val: 32,
      color: '#ff1493',
      icon: '👤',
      group: 9
    },
    { id: 'n9_1', name: 'Persistencia de Estado y Reanudación Asíncrona', desc: 'Serialización durable del flujo en base de datos esperando intervención de un humano.', val: 12, color: '#ff1493', group: 9, isSub: true },
    { id: 'n9_2', name: 'Manejo de Timeouts y Políticas de Escalamiento', desc: 'Rutas alternativas automatizadas cuando un revisor humano excede el SLA pactado.', val: 12, color: '#ff1493', group: 9, isSub: true },
    { id: 'n9_3', name: 'Diff Contextual e Interfaces de Aprobación', desc: 'Inspección de cambios de alta resolución para validaciones con un solo clic.', val: 12, color: '#ff1493', group: 9, isSub: true },

    // 10. Observabilidad e Inspección de Trazas
    {
      id: 'n10',
      name: '10. Observabilidad e\nInspección de Trazas',
      desc: 'Spans OpenTelemetry, desglose analítico de latencia/tokens y depuración forense time-travel.',
      val: 32,
      color: '#ff00aa',
      icon: '🔍',
      group: 10
    },
    { id: 'n10_1', name: 'Trazabilidad Distribuida con OpenTelemetry', desc: 'Instrumentación granular de spans, linaje de eventos y correlación de invocaciones.', val: 12, color: '#ff00aa', group: 10, isSub: true },
    { id: 'n10_2', name: 'Auditoría en Tiempo Real de Tokens y Costos', desc: 'Monitoreo de gasto por sesión, nodo y agente con alertas de anomalía financiera.', val: 12, color: '#ff00aa', group: 10, isSub: true },
    { id: 'n10_3', name: 'Time-Travel Debugging y Replay Forense', desc: 'Reproducción idéntica de flujos anómalos usando snapshots del estado histórico.', val: 12, color: '#ff00aa', group: 10, isSub: true },

    // ==========================================
    // TIER 4: ARCHITECT (Nivel 11 - 14)
    // ==========================================

    // 11. Discovery Arquitectónico
    {
      id: 'n11',
      name: '11. Discovery\nArquitectónico',
      desc: 'Extracción de requerimientos, viabilidad algorítmica vs IA, cálculo de SLAs y topología de integración.',
      val: 32,
      color: '#cc00ff',
      icon: '🔭',
      group: 11
    },
    { id: 'n11_1', name: 'Evaluación de Viabilidad Heurística vs IA', desc: 'Separación estricta entre tareas deterministas y necesidades probabilísticas.', val: 12, color: '#cc00ff', group: 11, isSub: true },
    { id: 'n11_2', name: 'Modelado de Presupuesto, Latencia y SLAs', desc: 'Definición formal de tiempos límite, ventanas de respuesta y costos máximos.', val: 12, color: '#cc00ff', group: 11, isSub: true },
    { id: 'n11_3', name: 'Mapeo de Sistemas Legados y Dependencias', desc: 'Identificación de cuellos de botella, consistencia eventual y riesgos externos.', val: 12, color: '#cc00ff', group: 11, isSub: true },

    // 12. Diseño de Blueprint y Rutas de Fallo
    {
      id: 'n12',
      name: '12. Diseño de Blueprint\ny Rutas de Fallo',
      desc: 'Planos de arquitectura formal, diseño de contingencias ante caídas de modelos y colas de dead-letter.',
      val: 32,
      color: '#8a2be2',
      icon: '🗺️',
      group: 12
    },
    { id: 'n12_1', name: 'Especificación Blueprint de Alta Densidad', desc: 'Diseño estructural integral del sistema agéntico antes de su implementación.', val: 12, color: '#8a2be2', group: 12, isSub: true },
    { id: 'n12_2', name: 'Conmutación por Falla y Model Fallbacks', desc: 'Transición automática a modelos secundarios o heurísticas ante cortes de servicio.', val: 12, color: '#8a2be2', group: 12, isSub: true },
    { id: 'n12_3', name: 'Colas Dead-Letter y Recuperación Terminal', desc: 'Canalización de eventos irrecuperables para auditoría y rescate programático.', val: 12, color: '#8a2be2', group: 12, isSub: true },

    // 13. Subflows y Composición Modular
    {
      id: 'n13',
      name: '13. Subflows y\nComposición Modular',
      desc: 'Encapsulación de subgrafos reutilizables, límites de dominio limpios y contratos de prueba aislados.',
      val: 32,
      color: '#4361ee',
      icon: '🧩',
      group: 13
    },
    { id: 'n13_1', name: 'Encapsulación y Domain-Driven Subgraphs', desc: 'Empaquetado de flujos complejos en cajas negras con interfaces simples.', val: 12, color: '#4361ee', group: 13, isSub: true },
    { id: 'n13_2', name: 'Librería de Componentes Reutilizables', desc: 'Catálogo de subflujos certificados para orquestaciones multiplataforma.', val: 12, color: '#4361ee', group: 13, isSub: true },
    { id: 'n13_3', name: 'Testing Unitario de Subflujos con Fixtures', desc: 'Validación automatizada de submódulos inyectando mocks de datos de entrada.', val: 12, color: '#4361ee', group: 13, isSub: true },

    // 14. Paralelismo, Joins y Reducers
    {
      id: 'n14',
      name: '14. Paralelismo, Joins\ny Reducers',
      desc: 'Fan-out asíncrono concurrente, barreras de sincronización y reducción sin condiciones de carrera.',
      val: 32,
      color: '#00d2ff',
      icon: '⚡',
      group: 14
    },
    { id: 'n14_1', name: 'Estrategias de Fan-Out Asíncrono', desc: 'Dispersión de micro-tareas paralelas respetando cuotas de concurrencia.', val: 12, color: '#00d2ff', group: 14, isSub: true },
    { id: 'n14_2', name: 'Barreras de Sincronización Fan-In (Joins)', desc: 'Espera determinista y estructurada de múltiples promesas asíncronas concurrentes.', val: 12, color: '#00d2ff', group: 14, isSub: true },
    { id: 'n14_3', name: 'Patrones Reducer y Consolidación de Estado', desc: 'Fusión matemática y lógica de fragmentos parciales en una respuesta coherente.', val: 12, color: '#00d2ff', group: 14, isSub: true },

    // ==========================================
    // TIER 5: EXPERT (Nivel 15 - 17)
    // ==========================================

    // 15. Orquestación Multiagente
    {
      id: 'n15',
      name: '15. Orquestación\nMultiagente',
      desc: 'Topología supervisor/worker, pizarrón de memoria compartida, debate socrático y resolución de disensos.',
      val: 32,
      color: '#f72585',
      icon: '🤖',
      group: 15
    },
    { id: 'n15_1', name: 'Patrón Supervisor y Delegación de Especialistas', desc: 'Liderazgo jerárquico con planificación dinámica y descomposición de misiones.', val: 12, color: '#f72585', group: 15, isSub: true },
    { id: 'n15_2', name: 'Memoria Compartida y Estado Blackboard', desc: 'Pizarrón global sincronizado con control de locks y preservación de contexto.', val: 12, color: '#f72585', group: 15, isSub: true },
    { id: 'n15_3', name: 'Protocolos de Debate y Consenso Multiagente', desc: 'Arbitraje dialéctico con agentes verificadores para elevar la precisión final.', val: 12, color: '#f72585', group: 15, isSub: true },

    // 16. Evaluación de Prompts en Masa
    {
      id: 'n16',
      name: '16. Evaluación de\nPrompts en Masa',
      desc: 'LLM-as-a-judge calibrado, generación de datasets sintéticos de estrés y matrices de regresión automatizadas.',
      val: 32,
      color: '#b5179e',
      icon: '📊',
      group: 16
    },
    { id: 'n16_1', name: 'Metodología LLM-as-a-Judge con Rúbricas', desc: 'Scoring automatizado de outputs mediante evaluadores con criterios objetivos.', val: 12, color: '#b5179e', group: 16, isSub: true },
    { id: 'n16_2', name: 'Datasets Sintéticos y Casos Adversariales', desc: 'Creación masiva de vectores de prueba para someter el flujo a estrés límite.', val: 12, color: '#b5179e', group: 16, isSub: true },
    { id: 'n16_3', name: 'Matrices de Regresión y Benchmarking CI/CD', desc: 'Bloqueo automático de deploys si el rendimiento semántico sufre degradación.', val: 12, color: '#b5179e', group: 16, isSub: true },

    // 17. Defensa Técnica de Arquitectura
    {
      id: 'n17',
      name: '17. Defensa Técnica\nde Arquitectura',
      desc: 'Argumentación económica de ROI, cálculo de trade-offs latencia/costo y auditoría de compliance para comités.',
      val: 32,
      color: '#ffd166',
      icon: '🏛️',
      group: 17
    },
    { id: 'n17_1', name: 'Análisis de Trade-Offs (Costo, Latencia, Precisión)', desc: 'Fundamentación matemática de las decisiones arquitectónicas del sistema.', val: 12, color: '#ffd166', group: 17, isSub: true },
    { id: 'n17_2', name: 'Auditoría de Seguridad, Compliance y Gobernanza', desc: 'Defensa técnica de cumplimiento regulatorio, trazabilidad y protección de datos.', val: 12, color: '#ffd166', group: 17, isSub: true },
    { id: 'n17_3', name: 'Cálculo de ROI y Pitch Ejecutivo', desc: 'Traducción del rendimiento técnico a valor de negocio e impacto empresarial cuantificable.', val: 12, color: '#ffd166', group: 17, isSub: true }
  ],

  links: [
    // --- CONEXIONES DESDE EL CENTRO HACIA LAS 17 HABILIDADES ---
    { source: 'center', target: 'n1', name: 'fundamenta' },
    { source: 'center', target: 'n2', name: 'conecta' },
    { source: 'center', target: 'n3', name: 'estructura' },
    { source: 'center', target: 'n4', name: 'controla' },
    { source: 'center', target: 'n5', name: 'clasifica' },
    { source: 'center', target: 'n6', name: 'instruye' },
    { source: 'center', target: 'n7', name: 'protege' },
    { source: 'center', target: 'n8', name: 'estabiliza' },
    { source: 'center', target: 'n9', name: 'supervisa' },
    { source: 'center', target: 'n10', name: 'observa' },
    { source: 'center', target: 'n11', name: 'analiza' },
    { source: 'center', target: 'n12', name: 'diseña' },
    { source: 'center', target: 'n13', name: 'modulariza' },
    { source: 'center', target: 'n14', name: 'acelera' },
    { source: 'center', target: 'n15', name: 'orquesta' },
    { source: 'center', target: 'n16', name: 'valida' },
    { source: 'center', target: 'n17', name: 'defiende' },

    // --- CONEXIONES PADRE A SUB-COMPETENCIAS (51 enlaces) ---
    // Skill 1
    { source: 'n1', target: 'n1_1' },
    { source: 'n1', target: 'n1_2' },
    { source: 'n1', target: 'n1_3' },

    // Skill 2
    { source: 'n2', target: 'n2_1' },
    { source: 'n2', target: 'n2_2' },
    { source: 'n2', target: 'n2_3' },

    // Skill 3
    { source: 'n3', target: 'n3_1' },
    { source: 'n3', target: 'n3_2' },
    { source: 'n3', target: 'n3_3' },

    // Skill 4
    { source: 'n4', target: 'n4_1' },
    { source: 'n4', target: 'n4_2' },
    { source: 'n4', target: 'n4_3' },

    // Skill 5
    { source: 'n5', target: 'n5_1' },
    { source: 'n5', target: 'n5_2' },
    { source: 'n5', target: 'n5_3' },

    // Skill 6
    { source: 'n6', target: 'n6_1' },
    { source: 'n6', target: 'n6_2' },
    { source: 'n6', target: 'n6_3' },

    // Skill 7
    { source: 'n7', target: 'n7_1' },
    { source: 'n7', target: 'n7_2' },
    { source: 'n7', target: 'n7_3' },

    // Skill 8
    { source: 'n8', target: 'n8_1' },
    { source: 'n8', target: 'n8_2' },
    { source: 'n8', target: 'n8_3' },

    // Skill 9
    { source: 'n9', target: 'n9_1' },
    { source: 'n9', target: 'n9_2' },
    { source: 'n9', target: 'n9_3' },

    // Skill 10
    { source: 'n10', target: 'n10_1' },
    { source: 'n10', target: 'n10_2' },
    { source: 'n10', target: 'n10_3' },

    // Skill 11
    { source: 'n11', target: 'n11_1' },
    { source: 'n11', target: 'n11_2' },
    { source: 'n11', target: 'n11_3' },

    // Skill 12
    { source: 'n12', target: 'n12_1' },
    { source: 'n12', target: 'n12_2' },
    { source: 'n12', target: 'n12_3' },

    // Skill 13
    { source: 'n13', target: 'n13_1' },
    { source: 'n13', target: 'n13_2' },
    { source: 'n13', target: 'n13_3' },

    // Skill 14
    { source: 'n14', target: 'n14_1' },
    { source: 'n14', target: 'n14_2' },
    { source: 'n14', target: 'n14_3' },

    // Skill 15
    { source: 'n15', target: 'n15_1' },
    { source: 'n15', target: 'n15_2' },
    { source: 'n15', target: 'n15_3' },

    // Skill 16
    { source: 'n16', target: 'n16_1' },
    { source: 'n16', target: 'n16_2' },
    { source: 'n16', target: 'n16_3' },

    // Skill 17
    { source: 'n17', target: 'n17_1' },
    { source: 'n17', target: 'n17_2' },
    { source: 'n17', target: 'n17_3' },

    // --- ENLACES TRANSVERSALES / CROSS-LINKS ENTRE HABILIDADES RELACIONADAS ---
    { source: 'n1', target: 'n2', name: 'habilita' },
    { source: 'n2', target: 'n3', name: 'transporta' },
    { source: 'n3', target: 'n4', name: 'valida' },
    { source: 'n4', target: 'n5', name: 'complementa' },
    { source: 'n5', target: 'n6', name: 'parametrizado por' },
    { source: 'n6', target: 'n16', name: 'evaluado en' },
    { source: 'n7', target: 'n8', name: 'delimita' },
    { source: 'n8', target: 'n9', name: 'escala a' },
    { source: 'n9', target: 'n10', name: 'registrado por' },
    { source: 'n11', target: 'n12', name: 'origina' },
    { source: 'n12', target: 'n13', name: 'descompone en' },
    { source: 'n13', target: 'n14', name: 'ejecuta con' },
    { source: 'n14', target: 'n15', name: 'sincroniza' },
    { source: 'n15', target: 'n10', name: 'emite trazas a' },
    { source: 'n15', target: 'n7', name: 'aplica permisos a' },
    { source: 'n12', target: 'n17', name: 'sustenta' },
    { source: 'n16', target: 'n17', name: 'evidencia para' }
  ]
};
