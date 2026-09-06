"""Router de Arquitectura: expone el mapa del flujo de la app y los master prompts REALES
que el backend usa en cada punto (single source of truth — nunca se desincroniza)."""
from fastapi import APIRouter

from routers.builder_actions import MASTER_PROMPTS
from routers.execute import COHESION_PROMPT_DOC, ORCHESTRATOR_PROMPT_DOC
from services.healer import HEALER_SYSTEM, HEALER_PROMPT
from routers.search import (
    ENHANCE_SYSTEM, SUGGEST_SYSTEM, REQUIREMENTS_SYSTEM, ARCHITECT_SYSTEM, UI_UX_SYSTEM,
    PRODUCT_STRATEGIST_SYSTEM, MARKET_RESEARCHER_SYSTEM, USE_CASE_SPECIALIST_SYSTEM,
    FEASIBILITY_ANALYST_SYSTEM, COMPLIANCE_PLANNER_SYSTEM, BRAND_VOICE_ARCHITECT_SYSTEM,
    AI_STRATEGIST_SYSTEM, TEST_STRATEGIST_SYSTEM,
    FRONTEND_ENGINEER_SYSTEM, BACKEND_ENGINEER_SYSTEM, DATA_SMITH_SYSTEM, CLEAN_CODE_SYSTEM,
    SECURITY_AUDITOR_SYSTEM, MIGRATIONS_ENGINEER_SYSTEM, API_INTEGRATOR_SYSTEM,
    ENVIRONMENT_SPECIALIST_SYSTEM, DEVOPS_ENGINEER_SYSTEM, MOBILE_ENGINEER_SYSTEM,
    AI_ML_ENGINEER_SYSTEM, WEB3_ENGINEER_SYSTEM, DATA_ENGINEER_SYSTEM, GAME_DEVELOPER_SYSTEM,
    FUSIONAR_SYSTEM, AUDITOR_CONTEXTO_SYSTEM,
    META_SUPERVISOR_SYSTEM, TASK_ROUTER_SYSTEM, WORKFLOW_OPTIMIZER_SYSTEM,
    DEPENDENCY_MANAGER_SYSTEM, AGENT_SPAWNER_SYSTEM, CONFLICT_ARBITRATOR_SYSTEM,
    STATE_MANAGER_SYSTEM, FALLBACK_STRATEGIST_SYSTEM, RESOURCE_OPTIMIZER_SYSTEM,
    SANDBOX_GUARDIAN_SYSTEM,
    QA_ANALYST_SYSTEM, UNIT_TESTER_SYSTEM, TYPE_CHECKER_SYSTEM, LINTER_AGENT_SYSTEM,
    BUILD_SPECIALIST_SYSTEM, FILE_ARCHITECT_SYSTEM, GIT_MANAGER_SYSTEM,
    DOC_GENERATOR_SYSTEM, DEPLOYMENT_SPECIALIST_SYSTEM,
    OBSERVABILITY_SPECIALIST_SYSTEM, RESOURCE_MANAGER_SYSTEM, COST_OPTIMIZER_SYSTEM,
    EXCEPTION_ANALYST_SYSTEM, LOG_SYNTHESIZER_SYSTEM, STATE_RECOVERY_AGENT_SYSTEM,
    DEPENDENCY_RESOLVER_SYSTEM, ARTIFACT_HARVESTER_SYSTEM, NETWORK_INTERCEPTOR_SYSTEM,
    MEMORY_COMPRESSION_SYSTEM, RAG_QUERY_SYNTHESIZER_SYSTEM, KNOWLEDGE_INTEGRATION_SYSTEM,
    CONTEXT_LIBRARIAN_SYSTEM, FEEDBACK_ANALYST_SYSTEM, KNOWLEDGE_PRUNER_SYSTEM,
    VECTOR_CHUNKING_STRATEGIST_SYSTEM, CROSS_REFERENCE_ENGINE_SYSTEM,
    GRAPHRAG_ARCHITECT_SYSTEM, CONFIDENCE_SCORER_SYSTEM, SEMANTIC_ROUTER_SYSTEM,
    COPILOT_SYSTEM, TERMINAL_NINJA_SYSTEM, CODE_EXPLAINER_SYSTEM,
    REFACTOR_MASTER_SYSTEM, DEBUG_DETECTIVE_SYSTEM, TEST_GENERATOR_SYSTEM,
    REGEX_WIZARD_SYSTEM, COMMIT_CRAFTER_SYSTEM, TYPE_ENFORCER_SYSTEM,
    PERFORMANCE_TUNER_SYSTEM, DB_QUERY_CRAFTER_SYSTEM, DOCS_WRITER_SYSTEM,
    MIGRATION_ASSISTANT_SYSTEM,
    WEBHOOK_PARSER_SYSTEM, WORKFLOW_STRATEGIST_SYSTEM, CRON_MASTER_SYSTEM,
    API_AUTH_SPECIALIST_SYSTEM, PAYLOAD_TRANSFORMER_SYSTEM, RESILIENCE_ENGINEER_SYSTEM,
    ROUTING_SPECIALIST_SYSTEM, ENRICHMENT_AGENT_SYSTEM, STATE_CACHE_MANAGER_SYSTEM,
    HUMAN_IN_THE_LOOP_SYSTEM, DOC_EXTRACTOR_SYSTEM, NOTIFICATION_DESIGNER_SYSTEM,
    AUTOMATION_COST_OPTIMIZER_SYSTEM, BATCH_PROCESSOR_SYSTEM, BROWSER_AUTOMATOR_SYSTEM,
    TPL_STRIPE_FAILED_PAYMENT, TPL_SHOPIFY_NEW_ORDER, TPL_GITHUB_PR_REVIEW,
    TPL_TYPEFORM_LEAD_SCORING, TPL_SLACK_APPROVAL_WORKFLOW, TPL_GMAIL_AI_CATEGORIZER,
    TPL_PDF_INVOICE_PROCESSOR, TPL_TWITTER_BRAND_MONITOR, TPL_CALENDLY_ZOOM_SYNC,
    TPL_DAILY_DB_BACKUP,
    LEAK_DETECTOR_SYSTEM, KEY_ROTATOR_SYSTEM, ACCESS_AUDITOR_SYSTEM,
    CRYPTO_GUARDIAN_SYSTEM, SECRET_INJECTOR_SYSTEM, ZERO_TRUST_ENFORCER_SYSTEM,
    COMPLIANCE_REPORTER_SYSTEM, ANOMALY_DETECTOR_SYSTEM, CERTIFICATE_MANAGER_SYSTEM,
    DYNAMIC_SECRETS_ISSUER_SYSTEM, SHAMIR_UNSEALER_SYSTEM, FLOW_GENERATOR_SYSTEM
)

router = APIRouter(prefix="/architecture", tags=["Architecture"])


@router.get("")
def get_architecture():
    """Mapa completo del flujo de Antigravity_OS + master prompt exacto en cada punto."""
    return {
        "app": "Antigravity_OS v2",
        "engine": {
            "name": "Motor Híbrido",
            "cloud": "openai/gpt-4o (vía Free.AI API)",
            "local": "hermes3:8b (vía Ollama, 127.0.0.1:11434)",
            "rule": "Nube primero si hay FREE_AI_API_KEY y conexión; fallback automático a local.",
        },
        "flow": [
            {
                "step": 1,
                "id": "atlas",
                "name": "Atlas — Biblioteca y Diseño de Intención",
                "page": "/atlas",
                "what": "El usuario describe el resultado que desea. La IA mejora su texto (enhance_query), "
                        "diseña el flujo recomendado con nodos+edges reales (suggest_flows) y ofrece 5 alternativas "
                        "del catálogo rankeadas por similitud TF-IDF. También es la biblioteca de 15,000+ prompts "
                        "categorizados que pueden encadenarse manualmente.",
                "prompts": [
                    {"key": "requirements_engineer", "used_at": "Fase Cero (Filtro de Ambigüedad)", "text": REQUIREMENTS_SYSTEM, "explanation": "Actúa antes de que el sistema procese nada. Analiza tu petición cruda y, si es ambigua, hace preguntas clave para definir usuarios, alcance y plataformas. Evita que la IA asuma cosas equivocadas."},
                    {"key": "system_architect", "used_at": "Fase Uno (Arquitectura Base)", "text": ARCHITECT_SYSTEM, "explanation": "Decide el stack tecnológico, el diseño de la base de datos (esquemas) y el patrón arquitectónico (ej. microservicios) antes de escribir código."},
                    {"key": "ui_ux_architect", "used_at": "Fase Dos (Reglas Visuales)", "text": UI_UX_SYSTEM, "explanation": "Toma el propósito de la app y define un manifiesto estricto de diseño (colores HEX, espaciados, tipografías y reglas de contraste). Obliga a los agentes constructores a respetar este manual visual."},
                    {"key": "product_strategist", "used_at": "Fase Tres (Estrategia)", "text": PRODUCT_STRATEGIST_SYSTEM, "explanation": "Evalúa la viabilidad del MVP y prioriza las funcionalidades clave."},
                    {"key": "market_researcher", "used_at": "Fase Tres (Estrategia)", "text": MARKET_RESEARCHER_SYSTEM, "explanation": "Investiga el mercado y la competencia para proponer diferenciadores."},
                    {"key": "use_case_specialist", "used_at": "Fase Tres (Estrategia)", "text": USE_CASE_SPECIALIST_SYSTEM, "explanation": "Identifica los actores del sistema y los flujos de interacción edge-case."},
                    {"key": "feasibility_analyst", "used_at": "Fase Cuatro (Viabilidad)", "text": FEASIBILITY_ANALYST_SYSTEM, "explanation": "Evalúa si la idea es técnicamente posible, detecta cuellos de botella y riesgos de infraestructura o costos."},
                    {"key": "compliance_planner", "used_at": "Fase Cuatro (Viabilidad)", "text": COMPLIANCE_PLANNER_SYSTEM, "explanation": "Asegura el cumplimiento legal (GDPR/HIPAA), protección de datos sensibles y manejo seguro de sesiones."},
                    {"key": "brand_voice_architect", "used_at": "Fase Cuatro (Viabilidad)", "text": BRAND_VOICE_ARCHITECT_SYSTEM, "explanation": "Define la personalidad de la app y las guías de copywriting (UX writing) para evitar textos robóticos."},
                    {"key": "ai_strategist", "used_at": "Fase Cinco (Especialistas)", "text": AI_STRATEGIST_SYSTEM, "explanation": "Diseña los pipelines de Machine Learning, RAG, y selecciona modelos LLM si el proyecto usa IA."},
                    {"key": "test_strategist", "used_at": "Fase Cinco (Especialistas)", "text": TEST_STRATEGIST_SYSTEM, "explanation": "Define la estrategia de pruebas (TDD/BDD) y los escenarios críticos obligatorios antes del desarrollo."},
                    {"key": "enhance_query", "used_at": "POST /api/v1/enhance_query", "text": ENHANCE_SYSTEM, "explanation": "Este prompt se encarga de analizar la petición inicial del usuario y reformularla con mayor detalle, claridad y precisión técnica, asegurando que el sistema entienda perfectamente el objetivo final."},
                    {"key": "suggest_flows", "used_at": "POST /api/v1/suggest_flows", "text": SUGGEST_SYSTEM, "explanation": "Toma la petición procesada y diseña una arquitectura recomendada. Define qué nodos (agentes) se necesitan y cómo deben conectarse (edges) para resolver el problema paso a paso."},
                ],
            },
            {
                "step": 2,
                "id": "builder",
                "name": "Builder — Canvas Visual de Agentes",
                "page": "/builder",
                "what": "Canvas ReactFlow donde cada nodo es un agente (title, role, master prompt, framework, "
                        "modelo, temperatura, variables). Los edges definen el flujo de datos. Panel de propiedades "
                        "con autocompletado AI por nodo y botones AI: Upgrade, Atomizar, Traducir, Editar, Lógica.",
                "prompts": [
                    {"key": "autocompletar", "used_at": "POST /api/v1/builder/suggest-node", "text": MASTER_PROMPTS["autocompletar"], "explanation": "Analiza el contexto del grafo y deduce automáticamente el título, rol y responsabilidades de un nodo recién creado para acelerar el diseño."},
                    {"key": "upgrade", "used_at": "POST /api/v1/builder/action (upgrade)", "text": MASTER_PROMPTS["upgrade"], "explanation": "Toma un prompt básico o pobre y lo reescribe utilizando técnicas de ingeniería de prompts avanzadas, dotándolo de instrucciones estructuradas y precisas."},
                    {"key": "atomizar", "used_at": "POST /api/v1/builder/action (atomizar)", "text": MASTER_PROMPTS["atomizar"], "explanation": "Detecta si un agente tiene demasiadas responsabilidades y propone dividirlo en múltiples sub-agentes más pequeños y altamente especializados."},
                    {"key": "traducir", "used_at": "POST /api/v1/builder/action (traducir)", "text": MASTER_PROMPTS["traducir"], "explanation": "Traduce de forma inteligente el rol y las instrucciones del agente al español o inglés, manteniendo el rigor técnico original."},
                    {"key": "editar", "used_at": "POST /api/v1/builder/action (editar)", "text": MASTER_PROMPTS["editar"], "explanation": "Aplica modificaciones precisas al código o prompt del agente basándose en las instrucciones directas proporcionadas por el usuario."},
                    {"key": "logica", "used_at": "POST /api/v1/builder/action (logica)", "text": MASTER_PROMPTS["logica"], "explanation": "Optimiza la capacidad deductiva y el razonamiento lógico del prompt, asegurando que el agente tome mejores decisiones algorítmicas."},
                    {"key": "frontend_engineer", "used_at": "Plantilla Builder", "text": FRONTEND_ENGINEER_SYSTEM, "explanation": "Especialista en React, Tailwind, interfaces reactivas y estado del cliente."},
                    {"key": "backend_engineer", "used_at": "Plantilla Builder", "text": BACKEND_ENGINEER_SYSTEM, "explanation": "Especialista en Python, Node.js, lógica de negocio y controladores."},
                    {"key": "data_smith", "used_at": "Plantilla Builder", "text": DATA_SMITH_SYSTEM, "explanation": "Diseña los esquemas, modelos de base de datos y flujos de información."},
                    {"key": "clean_code", "used_at": "Plantilla Builder", "text": CLEAN_CODE_SYSTEM, "explanation": "Se asegura de que se apliquen principios SOLID, DRY y arquitecturas limpias."},
                    {"key": "security_auditor", "used_at": "Plantilla Builder", "text": SECURITY_AUDITOR_SYSTEM, "explanation": "Escanea el código generado en tiempo real buscando vulnerabilidades."},
                    {"key": "migrations_engineer", "used_at": "Plantilla Builder", "text": MIGRATIONS_ENGINEER_SYSTEM, "explanation": "Escribe los scripts para crear tablas o modificar la base de datos sin romper nada."},
                    {"key": "api_integrator", "used_at": "Plantilla Builder", "text": API_INTEGRATOR_SYSTEM, "explanation": "Diseña los endpoints (REST/GraphQL) y asegura que los payloads sean correctos."},
                    {"key": "environment_specialist", "used_at": "Plantilla Builder", "text": ENVIRONMENT_SPECIALIST_SYSTEM, "explanation": "Configura Dockerfiles, variables de entorno (.env) y dependencias."},
                    {"key": "devops_engineer", "used_at": "Plantilla Builder", "text": DEVOPS_ENGINEER_SYSTEM, "explanation": "Diseña pipelines y prepara el código para ser desplegable."},
                    {"key": "mobile_engineer", "used_at": "Plantilla Builder", "text": MOBILE_ENGINEER_SYSTEM, "explanation": "Especialista en desarrollo móvil nativo (iOS/Android) y frameworks multiplataforma (React Native/Flutter)."},
                    {"key": "ai_ml_engineer", "used_at": "Plantilla Builder", "text": AI_ML_ENGINEER_SYSTEM, "explanation": "Escribe el código para LangChain, embeddings, llamadas a LLMs y bases de datos vectoriales."},
                    {"key": "web3_engineer", "used_at": "Plantilla Builder", "text": WEB3_ENGINEER_SYSTEM, "explanation": "Desarrollador de Smart Contracts (Solidity/Rust), experto en seguridad Web3 y gas optimization."},
                    {"key": "data_engineer", "used_at": "Plantilla Builder", "text": DATA_ENGINEER_SYSTEM, "explanation": "Construye pipelines de datos complejos (ETL/ELT), scripts en PySpark y orquestación masiva (Airflow)."},
                    {"key": "game_developer", "used_at": "Plantilla Builder", "text": GAME_DEVELOPER_SYSTEM, "explanation": "Especialista en desarrollo de videojuegos, Game Loops, físicas y Entity-Component-System (ECS)."},
                    {"key": "fusionar", "used_at": "POST /api/v1/builder/action (fusionar)", "text": FUSIONAR_SYSTEM, "explanation": "Optimizador de grafos. Comprime dos o más nodos pequeños en un solo agente altamente eficiente."},
                    {"key": "auditor_contexto", "used_at": "POST /api/v1/builder/action (auditor)", "text": AUDITOR_CONTEXTO_SYSTEM, "explanation": "Linker. Escanea el nodo y alerta si faltan variables o datos requeridos en el contexto o del nodo anterior."},
                ],
            },
            {
                "step": 3,
                "id": "orchestrator",
                "name": "Meta-Orquestador — El Cerebro",
                "page": "POST /api/v1/execute/task",
                "what": "Al presionar EJECUTAR: (a) Cohesión — la IA autoconfigura nodos vacíos o incompletos "
                        "garantizando que cada agente sepa qué recibe y qué entrega; (b) Orquestación — la IA analiza "
                        "el grafo completo, elige el framework óptimo (CrewAI/AutoGen/LangGraph) con criterios "
                        "ordenados y produce el plan de ejecución por fases con estrategia de fallos.",
                "prompts": [
                    {"key": "cohesion", "used_at": "execute/task (paso 1)", "text": COHESION_PROMPT_DOC, "explanation": "Inspecciona todos los nodos del grafo buscando aquellos que estén incompletos. Genera automáticamente las instrucciones faltantes para asegurar que todos los agentes se puedan comunicar sin errores."},
                    {"key": "meta_orchestrator", "used_at": "execute/task (paso 2)", "text": ORCHESTRATOR_PROMPT_DOC, "explanation": "Es el cerebro principal. Analiza la topología del grafo y determina qué framework de IA (como CrewAI o LangGraph) es el más adecuado para ejecutarlo de manera óptima."},
                    {"key": "meta_supervisor", "used_at": "execute/task (supervisión)", "text": META_SUPERVISOR_SYSTEM, "explanation": "El Project Manager que vigila que todos los agentes trabajen en armonía y no se desvíen del objetivo."},
                    {"key": "task_router", "used_at": "execute/task (enrutamiento)", "text": TASK_ROUTER_SYSTEM, "explanation": "Asigna cada fragmento de código o tarea al agente más capacitado para resolverla."},
                    {"key": "workflow_optimizer", "used_at": "execute/task (optimización)", "text": WORKFLOW_OPTIMIZER_SYSTEM, "explanation": "Diseña el Grafo (DAG) asegurando que no haya cuellos de botella ni dependencias circulares."},
                    {"key": "dependency_manager", "used_at": "execute/task (dependencias)", "text": DEPENDENCY_MANAGER_SYSTEM, "explanation": "Analiza qué tarea debe terminarse antes de que otra pueda comenzar."},
                    {"key": "agent_spawner", "used_at": "execute/task (clonación)", "text": AGENT_SPAWNER_SYSTEM, "explanation": "Es capaz de 'clonar' o spawnear micro-agentes dinámicos si una tarea resulta ser muy compleja."},
                    {"key": "conflict_arbitrator", "used_at": "execute/task (arbitraje)", "text": CONFLICT_ARBITRATOR_SYSTEM, "explanation": "Interviene cuando dos agentes generan soluciones incompatibles (ej. Frontend vs Backend) y fuerza una refactorización."},
                    {"key": "state_manager", "used_at": "execute/task (estado)", "text": STATE_MANAGER_SYSTEM, "explanation": "Gestiona la memoria compartida entre agentes y evita que los payloads grandes excedan la ventana de contexto."},
                    {"key": "fallback_strategist", "used_at": "execute/task (contingencia)", "text": FALLBACK_STRATEGIST_SYSTEM, "explanation": "Inyecta datos falsos de prueba (Mock Data) o toma rutas alternas si un agente falla repetidamente, evitando que el sistema se congele."},
                    {"key": "resource_optimizer", "used_at": "execute/task (finanzas)", "text": RESOURCE_OPTIMIZER_SYSTEM, "explanation": "Controla el consumo de tokens y asigna modelos más baratos a tareas triviales para evitar sobrecostos."},
                    {"key": "sandbox_guardian", "used_at": "execute/task (seguridad)", "text": SANDBOX_GUARDIAN_SYSTEM, "explanation": "Vigila la ejecución interceptando y bloqueando comandos destructivos antes de que afecten la máquina del usuario."},
                ],
            },
            {
                "step": 4,
                "id": "compiler",
                "name": "Compilador — Grafo → Código Python",
                "page": "POST /api/v1/compile/generate",
                "what": "Convierte el grafo en un runner.py ejecutable para el framework elegido, respetando las "
                        "conexiones reales del grafo y el modelo de cada nodo (gpt-4o nube / hermes3 local). "
                        "Guarda el resultado en backend/sandbox/runner.py.",
                "prompts": [
                    {"key": "compiler_backstory", "used_at": "compiler.py (backstory de cada agente)", "text": "You are {role}, a senior specialist operating inside a multi-agent pipeline. You receive structured input from upstream agents and must produce a precise, directly usable artifact. Rules: follow your instructions exactly, never fabricate data not present in the input, and if critical information is missing, state it explicitly instead of guessing.", "explanation": "Instrucción fundacional que se inyecta en cada agente al momento de compilar. Define reglas estrictas de comportamiento: ceñirse a las instrucciones, no inventar datos y reportar información faltante."},
                    {"key": "qa_analyst", "used_at": "compiler.py (Verificación)", "text": QA_ANALYST_SYSTEM, "explanation": "Revisa que el código cumpla al 100% con los requerimientos originales de Atlas."},
                    {"key": "unit_tester", "used_at": "compiler.py (Verificación)", "text": UNIT_TESTER_SYSTEM, "explanation": "Escribe tests (pytest/jest) para validar el código generado."},
                    {"key": "type_checker", "used_at": "compiler.py (Verificación)", "text": TYPE_CHECKER_SYSTEM, "explanation": "Revisa que TypeScript y Python (Pydantic) tengan tipado estricto."},
                    {"key": "linter_agent", "used_at": "compiler.py (Verificación)", "text": LINTER_AGENT_SYSTEM, "explanation": "Detecta errores tontos de sintaxis, imports faltantes o variables no usadas."},
                    {"key": "build_specialist", "used_at": "compiler.py (Verificación)", "text": BUILD_SPECIALIST_SYSTEM, "explanation": "Traduce los nodos visuales a scripts ejecutables listos para el Sandbox."},
                    {"key": "file_architect", "used_at": "compiler.py (Disco)", "text": FILE_ARCHITECT_SYSTEM, "explanation": "Escribe los archivos en disco duro manejando diffs precisos para no borrar código existente."},
                    {"key": "git_manager", "used_at": "compiler.py (Versiones)", "text": GIT_MANAGER_SYSTEM, "explanation": "Crea ramas y hace commits semánticos de todo el código generado de forma segura."},
                    {"key": "doc_generator", "used_at": "compiler.py (Documentación)", "text": DOC_GENERATOR_SYSTEM, "explanation": "Lee todo el código compilado y genera un README.md profesional y especificaciones de API."},
                    {"key": "deployment_specialist", "used_at": "compiler.py (Infraestructura)", "text": DEPLOYMENT_SPECIALIST_SYSTEM, "explanation": "Escribe los Dockerfiles y archivos de CI/CD para que el proyecto pueda subirse a producción."},
                ],
            },
            {
                "step": 5,
                "id": "runtime",
                "name": "Runtime — Ejecución + Auto-Curación",
                "page": "WS /api/v1/ws/execute",
                "what": "Ejecuta sandbox/runner.py como subproceso, streamea stdout línea a línea al Builder por "
                        "WebSocket, y si el proceso falla, el Auto-Healer IA repara el código (máx. 3 reintentos). "
                        "Cada ejecución queda registrada en SQLite (historial).",
                "prompts": [
                    {"key": "auto_healer_system", "used_at": "services/healer.py", "text": HEALER_SYSTEM, "explanation": "Define el rol crítico del sanador automático (Auto-Healer). Actúa como un ingeniero de software experto capaz de diagnosticar y corregir errores en el código Python generado."},
                    {"key": "auto_healer", "used_at": "services/healer.py (template)", "text": HEALER_PROMPT, "explanation": "Plantilla dinámica que inyecta el código fuente defectuoso y el mensaje de error (Traceback) para que la IA genere un parche inmediato e intente ejecutar el proceso nuevamente sin intervención humana."},
                    {"key": "observability_specialist", "used_at": "Runtime (Telemetría)", "text": OBSERVABILITY_SPECIALIST_SYSTEM, "explanation": "Instrumenta el código con logs, telemetría y métricas para saber qué está pasando adentro."},
                    {"key": "resource_manager", "used_at": "Runtime (Sandbox Guard)", "text": RESOURCE_MANAGER_SYSTEM, "explanation": "Vigila la memoria y el CPU del contenedor para evitar fugas o ciclos infinitos (OOM)."},
                    {"key": "cost_optimizer", "used_at": "Runtime (FinOps)", "text": COST_OPTIMIZER_SYSTEM, "explanation": "Analiza el consumo de tokens y llamadas a la API durante la ejecución para no gastar de más."},
                    {"key": "exception_analyst", "used_at": "Runtime (Clasificación)", "text": EXCEPTION_ANALYST_SYSTEM, "explanation": "Clasifica los errores en críticos o advertencias y decide si abortar o continuar."},
                    {"key": "log_synthesizer", "used_at": "Runtime (Consola)", "text": LOG_SYNTHESIZER_SYSTEM, "explanation": "Filtra la salida estándar (stdout) y muestra solo resúmenes limpios e inteligibles al usuario."},
                    {"key": "state_recovery_agent", "used_at": "Runtime (Memoria)", "text": STATE_RECOVERY_AGENT_SYSTEM, "explanation": "Guarda snapshots periódicos para reanudar la ejecución desde el fallo sin tener que empezar desde cero."},
                    {"key": "dependency_resolver", "used_at": "Runtime (Paquetes)", "text": DEPENDENCY_RESOLVER_SYSTEM, "explanation": "Auto-instala librerías o dependencias faltantes (Pip/NPM) al vuelo si ocurre un ModuleNotFoundError."},
                    {"key": "artifact_harvester", "used_at": "Runtime (Archivos)", "text": ARTIFACT_HARVESTER_SYSTEM, "explanation": "Extrae gráficos, PDFs o bases de datos generadas por el script y los manda directo a la UI."},
                    {"key": "network_interceptor", "used_at": "Runtime (Seguridad HTTP)", "text": NETWORK_INTERCEPTOR_SYSTEM, "explanation": "Vigila las peticiones HTTP del script, reintenta automáticamente los Timeouts y bloquea dominios sospechosos."},
                ],
            },
            {
                "step": 6,
                "id": "nexus",
                "name": "Nexus de Memoria y RAG",
                "page": "/nexus",
                "what": "Base de datos vectorial y grafo de conocimiento. Procesa el historial, extrae memorias a largo plazo (Long-Term Memory) y recupera contexto relevante (RAG) antes de cada iteración del motor.",
                "prompts": [
                    {
                        "key": "memory_compression",
                        "used_at": "Nexus > Almacenamiento",
                        "text": MEMORY_COMPRESSION_SYSTEM,
                        "explanation": "Este prompt se usa cuando la memoria a corto plazo se llena. Toma toda la conversación reciente y la comprime en hechos estructurados que luego se guardan en la base de datos vectorial para recordarlos semanas o meses después sin consumir tokens innecesarios."
                    },
                    {
                        "key": "rag_query_synthesizer",
                        "used_at": "Nexus > Búsqueda",
                        "text": RAG_QUERY_SYNTHESIZER_SYSTEM,
                        "explanation": "Cuando haces una pregunta compleja, este prompt reescribe tu pregunta en múltiples formatos (sinónimos, conceptos técnicos) para asegurar que la búsqueda en la base de datos vectorial (RAG) encuentre la información correcta y no se le escape nada."
                    },
                    {
                        "key": "knowledge_integration",
                        "used_at": "Nexus > Inyección",
                        "text": KNOWLEDGE_INTEGRATION_SYSTEM,
                        "explanation": "Después de buscar en la base de datos, este prompt filtra y unifica todos los fragmentos encontrados en un solo bloque de contexto súper relevante. Así, el agente de código recibe exactamente lo que necesita saber sin distraerse con información inútil."
                    },
                    {
                        "key": "context_librarian",
                        "used_at": "Nexus > Almacenamiento",
                        "text": CONTEXT_LIBRARIAN_SYSTEM,
                        "explanation": "Guarda las reglas globales, documentos maestros y el historial de la conversación."
                    },
                    {
                        "key": "feedback_analyst",
                        "used_at": "Nexus > Almacenamiento",
                        "text": FEEDBACK_ANALYST_SYSTEM,
                        "explanation": "Aprende de los errores de curación pasados y actualiza la base de conocimientos."
                    },
                    {"key": "knowledge_pruner", "used_at": "Nexus > Mantenimiento", "text": KNOWLEDGE_PRUNER_SYSTEM, "explanation": "Detecta y elimina reglas o memorias obsoletas para que los agentes no sigan escribiendo código con versiones viejas del proyecto."},
                    {"key": "vector_chunking_strategist", "used_at": "Nexus > Indexación", "text": VECTOR_CHUNKING_STRATEGIST_SYSTEM, "explanation": "Decide cómo dividir archivos gigantes y qué etiquetas ponerles antes de guardarlos en la BD Vectorial para maximizar la exactitud de búsqueda."},
                    {"key": "cross_reference_engine", "used_at": "Nexus > Deducción", "text": CROSS_REFERENCE_ENGINE_SYSTEM, "explanation": "Conecta los puntos. Cruza información de errores actuales con decisiones tomadas hace meses para encontrar la raíz profunda de un problema."},
                    {"key": "graphrag_architect", "used_at": "Nexus > Grafos", "text": GRAPHRAG_ARCHITECT_SYSTEM, "explanation": "Construye un mapa mental de relaciones (GraphRAG) para entender qué partes del código dependen de otras."},
                    {"key": "confidence_scorer", "used_at": "Nexus > Anti-Alucinación", "text": CONFIDENCE_SCORER_SYSTEM, "explanation": "Audita la información recuperada. Si no hay certeza matemática de que sea correcta, bloquea la respuesta y pide intervención humana."},
                    {"key": "semantic_router", "used_at": "Nexus > Enrutamiento", "text": SEMANTIC_ROUTER_SYSTEM, "explanation": "Analiza la intención del usuario y decide en qué base de datos buscar (historial, reglas, código o internet) para ahorrar tokens y tiempo."}
                ]
            }
        ],
        "apps": [
            {
                "id": "coding",
                "name": "Coding (IDE & Terminal)",
                "what": "El entorno de desarrollo integrado nativo de Antigravity OS con inteligencia contextual profunda.",
                "prompts": [
                    {"key": "copilot", "used_at": "IDE (Editor)", "text": COPILOT_SYSTEM, "explanation": "Programador de par que autocompleta código entendiendo el contexto completo del proyecto local."},
                    {"key": "terminal_ninja", "used_at": "Terminal", "text": TERMINAL_NINJA_SYSTEM, "explanation": "Intercepta errores de bash y sugiere el comando de reparación instantáneamente."},
                    {"key": "code_explainer", "used_at": "IDE (Inspector)", "text": CODE_EXPLAINER_SYSTEM, "explanation": "Analiza código ofuscado o sin documentar y explica su lógica (Big O, Control Flow)."},
                    {"key": "refactor_master", "used_at": "IDE (Actions)", "text": REFACTOR_MASTER_SYSTEM, "explanation": "Reescribe código desordenado aplicando SOLID y Clean Code sin romper la lógica de negocio."},
                    {"key": "debug_detective", "used_at": "Terminal / Logs", "text": DEBUG_DETECTIVE_SYSTEM, "explanation": "Analiza stack traces enormes y encuentra la línea exacta y la razón del fallo (Root Cause)."},
                    {"key": "test_generator", "used_at": "IDE (Actions)", "text": TEST_GENERATOR_SYSTEM, "explanation": "Crea suites de pruebas unitarias (Jest/PyTest) cubriendo edge cases automáticamente."},
                    {"key": "regex_wizard", "used_at": "IDE (Inline)", "text": REGEX_WIZARD_SYSTEM, "explanation": "Genera o explica expresiones regulares complejas, optimizando contra ReDoS."},
                    {"key": "commit_crafter", "used_at": "Source Control", "text": COMMIT_CRAFTER_SYSTEM, "explanation": "Lee el git diff y genera mensajes de commit semánticos y profesionales."},
                    {"key": "type_enforcer", "used_at": "IDE (TypeScript/Rust)", "text": TYPE_ENFORCER_SYSTEM, "explanation": "Infiere y genera interfaces estrictas o modelos a partir de JSONs o código dinámico."},
                    {"key": "performance_tuner", "used_at": "IDE (Linter)", "text": PERFORMANCE_TUNER_SYSTEM, "explanation": "Detecta cuellos de botella (O(n^2)) y sugiere estructuras de datos más rápidas (Sets/Maps)."},
                    {"key": "db_query_crafter", "used_at": "IDE (SQL)", "text": DB_QUERY_CRAFTER_SYSTEM, "explanation": "Escribe queries complejas y sugiere estrategias reales de indexación (B-Tree/Hash)."},
                    {"key": "docs_writer", "used_at": "IDE (Docs)", "text": DOCS_WRITER_SYSTEM, "explanation": "Autogenera JSDoc/Docstrings o archivos README con formato técnico y conciso."},
                    {"key": "migration_assistant", "used_at": "IDE (Refactor)", "text": MIGRATION_ASSISTANT_SYSTEM, "explanation": "Traduce código entre lenguajes o migra dependencias obsoletas usando modismos modernos."}
                ]
            },
            {
                "id": "automatizacion",
                "name": "Automatizaciones (Workflows)",
                "what": "Constructor visual estilo Zapier/n8n para orquestar tareas sin escribir código manual.",
                "prompts": [
                    {"key": "webhook_parser", "used_at": "Builder (Nodos)", "text": WEBHOOK_PARSER_SYSTEM, "explanation": "Extrae las llaves de alto valor de un JSON crudo (Stripe/Shopify) y las tipa para la base de datos."},
                    {"key": "workflow_strategist", "used_at": "Builder (Canvas)", "text": WORKFLOW_STRATEGIST_SYSTEM, "explanation": "Genera el grafo entero de integración basado en una orden de texto ('Cuando pase X, haz Y')."},
                    {"key": "cron_master", "used_at": "Scheduler", "text": CRON_MASTER_SYSTEM, "explanation": "Optimiza la sintaxis CRON y los tiempos de ejecución para procesos en segundo plano."},
                    {"key": "api_auth_specialist", "used_at": "Builder (Auth)", "text": API_AUTH_SPECIALIST_SYSTEM, "explanation": "Gestiona OAuth2, tokens y firmas HMAC sin que el flujo pierda su estado."},
                    {"key": "payload_transformer", "used_at": "Nodos (Mapping)", "text": PAYLOAD_TRANSFORMER_SYSTEM, "explanation": "Esculpe JSONs anidados a la medida usando mapeos estrictos (estilo jq)."},
                    {"key": "resilience_engineer", "used_at": "Engine (Core)", "text": RESILIENCE_ENGINEER_SYSTEM, "explanation": "Maneja Rate Limits (429) y caídas de servidor con Exponential Backoff y Circuit Breakers."},
                    {"key": "routing_specialist", "used_at": "Nodos (Lógica)", "text": ROUTING_SPECIALIST_SYSTEM, "explanation": "Decide el enrutamiento (Switches/IF) de los datos para evitar colisiones de ejecución."},
                    {"key": "enrichment_agent", "used_at": "Nodos (HTTP)", "text": ENRICHMENT_AGENT_SYSTEM, "explanation": "Hace llamadas a APIs secundarias para enriquecer perfiles incompletos en tiempo real."},
                    {"key": "state_cache_manager", "used_at": "Memoria (Redis)", "text": STATE_CACHE_MANAGER_SYSTEM, "explanation": "Guarda variables globales entre ciclos de ejecución de un workflow serverless."},
                    {"key": "human_in_the_loop", "used_at": "Nodos (Espera)", "text": HUMAN_IN_THE_LOOP_SYSTEM, "explanation": "Pausa el workflow hasta que un humano apruebe mediante un botón en Slack o Email."},
                    {"key": "doc_extractor", "used_at": "Nodos (Visión)", "text": DOC_EXTRACTOR_SYSTEM, "explanation": "Ingiere archivos PDF/Facturas y extrae key-values mediante OCR e IA estructurada."},
                    {"key": "notification_designer", "used_at": "Nodos (Salida)", "text": NOTIFICATION_DESIGNER_SYSTEM, "explanation": "Genera HTMLs transaccionales y Block Kits de Slack visualmente atractivos."},
                    {"key": "automation_cost_optimizer", "used_at": "Builder (Linter)", "text": AUTOMATION_COST_OPTIMIZER_SYSTEM, "explanation": "Alerta sobre nodos redundantes y bucles infinitos para ahorrar facturación de APIs."},
                    {"key": "batch_processor", "used_at": "Nodos (Bucle)", "text": BATCH_PROCESSOR_SYSTEM, "explanation": "Itera sobre arrays inmensos fragmentándolos en pequeños lotes para no tumbar servicios."},
                    {"key": "browser_automator", "used_at": "Nodos (Scraping)", "text": BROWSER_AUTOMATOR_SYSTEM, "explanation": "Controla navegadores headless (Playwright) para extraer datos de webs sin APIs públicas."},
                    {"key": "tpl_stripe_failed_payment", "used_at": "Template", "text": TPL_STRIPE_FAILED_PAYMENT, "explanation": "Recuperación de pagos fallidos en Stripe con correos secuenciales y pausas."},
                    {"key": "tpl_shopify_new_order", "used_at": "Template", "text": TPL_SHOPIFY_NEW_ORDER, "explanation": "Extrae órdenes de Shopify y las sincroniza directo a un ERP (SAP/Odoo)."},
                    {"key": "tpl_github_pr_review", "used_at": "Template", "text": TPL_GITHUB_PR_REVIEW, "explanation": "Orquesta DevOps: Crea tickets en Jira/Linear y notifica al abrirse un PR."},
                    {"key": "tpl_typeform_lead_scoring", "used_at": "Template", "text": TPL_TYPEFORM_LEAD_SCORING, "explanation": "Toma leads de Typeform, enriquece con Clearbit y envía a HubSpot."},
                    {"key": "tpl_slack_approval", "used_at": "Template", "text": TPL_SLACK_APPROVAL_WORKFLOW, "explanation": "Crea botones interactivos en Slack para aprobación de vacaciones (RRHH)."},
                    {"key": "tpl_gmail_categorizer", "used_at": "Template", "text": TPL_GMAIL_AI_CATEGORIZER, "explanation": "Lee correos de soporte, analiza sentimiento con IA y etiqueta en Zendesk."},
                    {"key": "tpl_pdf_invoice", "used_at": "Template", "text": TPL_PDF_INVOICE_PROCESSOR, "explanation": "Procesa facturas PDF con OCR y las guarda como datos estructurados en Airtable."},
                    {"key": "tpl_twitter_monitor", "used_at": "Template", "text": TPL_TWITTER_BRAND_MONITOR, "explanation": "Escucha social de menciones negativas en X y alerta a PagerDuty."},
                    {"key": "tpl_calendly_zoom", "used_at": "Template", "text": TPL_CALENDLY_ZOOM_SYNC, "explanation": "Genera sala de Zoom al agendar en Calendly y envía SMS recordatorio (Twilio)."},
                    {"key": "tpl_daily_backup", "used_at": "Template", "text": TPL_DAILY_DB_BACKUP, "explanation": "Cron job diario para backup de base de datos cifrado directo a AWS S3."}
                ]
            },
            {
                "id": "vault",
                "name": "Vault (Secrets Manager)",
                "what": "Gestor seguro de credenciales con defensas activas y monitoreo criptográfico.",
                "prompts": [
                    {"key": "leak_detector", "used_at": "IDE (Linter)", "text": LEAK_DETECTOR_SYSTEM, "explanation": "Escanea el código antes de cada commit buscando AWS keys o tokens hardcodeados."},
                    {"key": "key_rotator", "used_at": "Vault (Cron)", "text": KEY_ROTATOR_SYSTEM, "explanation": "Se conecta a APIs de terceros para revocar llaves viejas y emitir nuevas sin downtime."},
                    {"key": "access_auditor", "used_at": "Vault (Auditoría)", "text": ACCESS_AUDITOR_SYSTEM, "explanation": "Vigila el principio de menor privilegio (POLP) evitando que agentes pidan llaves que no necesitan."},
                    {"key": "crypto_guardian", "used_at": "Vault (Core)", "text": CRYPTO_GUARDIAN_SYSTEM, "explanation": "Encripta (AES-256) todo payload en reposo y en tránsito. Administra el KMS."},
                    {"key": "secret_injector", "used_at": "Runtime (Memoria)", "text": SECRET_INJECTOR_SYSTEM, "explanation": "Inyecta las credenciales directamente a la RAM sin escribir archivos en disco."},
                    {"key": "zero_trust_enforcer", "used_at": "Vault (RBAC)", "text": ZERO_TRUST_ENFORCER_SYSTEM, "explanation": "Rechaza cualquier petición que no pase estrictas reglas de identidad e IP (Zero Trust)."},
                    {"key": "compliance_reporter", "used_at": "Vault (Reportes)", "text": COMPLIANCE_REPORTER_SYSTEM, "explanation": "Genera evidencia inmutable para auditorías de cumplimiento normativo (SOC2/ISO27001)."},
                    {"key": "anomaly_detector", "used_at": "Vault (Escudo)", "text": ANOMALY_DETECTOR_SYSTEM, "explanation": "Bloquea claves instantáneamente si detecta uso desde IPs maliciosas o picos inusuales."},
                    {"key": "certificate_manager", "used_at": "Vault (SSL)", "text": CERTIFICATE_MANAGER_SYSTEM, "explanation": "Renueva certificados TLS de forma automática para evitar que dominios expiren."},
                    {"key": "dynamic_secrets_issuer", "used_at": "Vault (DBs)", "text": DYNAMIC_SECRETS_ISSUER_SYSTEM, "explanation": "Crea usuarios de Base de Datos efímeros (ej. válidos solo por 10 minutos) y luego los destruye."},
                    {"key": "shamir_unsealer", "used_at": "Vault (Root)", "text": SHAMIR_UNSEALER_SYSTEM, "explanation": "Divide la Master Key en 5 fragmentos. Exige quorum (3 de 5) para reiniciar el sistema en crisis."},
                    {"key": "flow_generator", "used_at": "Builder (Co-Piloto)", "text": FLOW_GENERATOR_SYSTEM, "explanation": "Arquitecto generador de flujos JSON (nodos y edges) a partir de lenguaje natural."}
                ]
            }
        ]
    }
