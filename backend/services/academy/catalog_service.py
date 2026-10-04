from typing import Any

import db

from backend.schemas.academy import (HintItem, MissionDefinition, MissionStep,
                                     RubricCriterion, Skill, TransferChallenge)


class CatalogService:
    """
    Catalog Service provides the canonical definitions for Tracks, Skills,
    Missions, Rubrics, and Capstones in Antigravity Academy V3.
    """

    SKILLS: dict[str, Skill] = {
        "canvas_navigation": Skill(
            id="canvas_navigation",
            name="Navegación del Canvas",
            category="foundation",
            description="Moverse, hacer zoom, seleccionar y organizar elementos visualmente en el canvas.",
            track="builder",
            prerequisites=[],
            unlocked_by=["mission_00"],
        ),
        "graph_connections": Skill(
            id="graph_connections",
            name="Conexiones de Grafo",
            category="foundation",
            description="Distinguir nodos, puertos y edges. Unir nodos de forma semántica con flujo de datos explícito.",
            track="builder",
            prerequisites=["canvas_navigation"],
            unlocked_by=["mission_01", "mission_02"],
        ),
        "data_contracts": Skill(
            id="data_contracts",
            name="Contratos de Datos y Transforms",
            category="builder",
            description="Modelar schemas de entrada/salida, bindings y transforms para evitar incompatibilidades de tipo.",
            track="builder",
            prerequisites=["graph_connections"],
            unlocked_by=["mission_03", "mission_07"],
        ),
        "conditions": Skill(
            id="conditions",
            name="Decisiones Deterministas",
            category="builder",
            description="Construir condiciones lógicas con ramas True, False y de error completamente cubiertas.",
            track="builder",
            prerequisites=["graph_connections"],
            unlocked_by=["mission_04"],
        ),
        "ai_classification": Skill(
            id="ai_classification",
            name="Clasificación con IA",
            category="builder",
            description="Diferenciar decisiones deterministas de clasificadores probabilísticos con fallback para baja confianza.",
            track="builder",
            prerequisites=["conditions"],
            unlocked_by=["mission_05"],
        ),
        "prompt_design": Skill(
            id="prompt_design",
            name="Prompt Engineering como Código",
            category="builder",
            description="Configurar agentes con objetivo, contexto, restricciones, schemas de salida y tests de regresión.",
            track="builder",
            prerequisites=["data_contracts"],
            unlocked_by=["mission_06", "mission_17"],
        ),
        "tools_and_permissions": Skill(
            id="tools_and_permissions",
            name="Capabilities y Mínimo Privilegio",
            category="operator",
            description="Consumir herramientas autorizadas usando referencias a credenciales de sandbox sin filtrar secretos.",
            track="operator",
            prerequisites=["data_contracts"],
            unlocked_by=["mission_08"],
        ),
        "reliability": Skill(
            id="reliability",
            name="Fiabilidad, Retry e Idempotencia",
            category="operator",
            description="Evitar efectos secundarios duplicados con business keys, idempotency keys y backoff exponencial.",
            track="operator",
            prerequisites=["tools_and_permissions"],
            unlocked_by=["mission_09"],
        ),
        "human_in_loop": Skill(
            id="human_in_loop",
            name="Human-in-the-Loop Resiliente",
            category="operator",
            description="Diseñar pausas humanas duraderas con contrato de reanudación, roles y expiración controlada.",
            track="operator",
            prerequisites=["conditions", "reliability"],
            unlocked_by=["mission_10"],
        ),
        "observability": Skill(
            id="observability",
            name="Observabilidad e Inspección de Trazas",
            category="operator",
            description="Interpretar logs estructurados y el Run Inspector para localizar fallos en dead-letters.",
            track="operator",
            prerequisites=["reliability"],
            unlocked_by=["mission_11"],
        ),
        "flow_architect_discovery": Skill(
            id="flow_architect_discovery",
            name="Discovery Arquitectónico",
            category="architect",
            description="Separar intenciones de requisitos, rechazar suposiciones no verificadas y definir no-objetivos.",
            track="flow_architect",
            prerequisites=["prompt_design"],
            unlocked_by=["mission_12"],
        ),
        "blueprint_design": Skill(
            id="blueprint_design",
            name="Diseño de Blueprint y Rutas de Fallo",
            category="architect",
            description="Especificar ArchitectureSpec con rutas para archivo corrupto, schema inválido y timeouts.",
            track="architect",
            prerequisites=["flow_architect_discovery", "conditions"],
            unlocked_by=["mission_13"],
        ),
        "subflows": Skill(
            id="subflows",
            name="Subflows y Composición Modular",
            category="architect",
            description="Encapsular flujos reutilizables con interfaces versionadas y análisis de impacto ante cambios.",
            track="architect",
            prerequisites=["data_contracts", "blueprint_design"],
            unlocked_by=["mission_14"],
        ),
        "parallelism_and_joins": Skill(
            id="parallelism_and_joins",
            name="Paralelismo, Joins y Reducers",
            category="architect",
            description="Coordinar ramas concurrentes (Fork/Join) sin condiciones de carrera mediante reducers de artifacts.",
            track="architect",
            prerequisites=["subflows"],
            unlocked_by=["mission_15"],
        ),
        "multi_agent_teams": Skill(
            id="multi_agent_teams",
            name="Orquestación Multiagente",
            category="expert",
            description="Diseñar roles especializados, handoffs tipados y rutas de resolución ante contradicciones.",
            track="expert",
            prerequisites=["parallelism_and_joins", "prompt_design"],
            unlocked_by=["mission_16"],
        ),
        "prompt_lab_eval": Skill(
            id="prompt_lab_eval",
            name="Evaluación de Prompts en Masa",
            category="expert",
            description="Gestionar suites de más de 15 prompts versionados con fixtures de regresión y análisis de impacto.",
            track="expert",
            prerequisites=["multi_agent_teams"],
            unlocked_by=["mission_17"],
        ),
        "architecture_defense": Skill(
            id="architecture_defense",
            name="Defensa Técnica de Arquitectura",
            category="expert",
            description="Justificar trade-offs de diseño, estrategias de contención de fallos, costes, latencia y seguridad.",
            track="expert",
            prerequisites=["prompt_lab_eval", "observability"],
            unlocked_by=["mission_18"],
        ),
    }

    TRACKS: list[dict[str, Any]] = [
        {
            "id": "builder",
            "name": "Builder Track",
            "description": "Domina la construcción de grafos, contratos de datos, transforms y agentes individuales.",
            "target_level": "builder",
            "mission_ids": [
                "mission_00",
                "mission_01",
                "mission_02",
                "mission_03",
                "mission_04",
                "mission_05",
                "mission_06",
                "mission_07",
            ],
        },
        {
            "id": "operator",
            "name": "Operator Track",
            "description": "Opera flujos en producción con capabilities seguras, políticas de reintento, HITL y trazas.",
            "target_level": "operator",
            "mission_ids": ["mission_08", "mission_09", "mission_10", "mission_11"],
        },
        {
            "id": "flow_architect",
            "name": "FlowArchitect Track",
            "description": "Transforma requerimientos de negocio en especificaciones formales y blueprints con gestión de fallos.",
            "target_level": "architect",
            "mission_ids": ["mission_12", "mission_13"],
        },
        {
            "id": "architect",
            "name": "Architect Track",
            "description": "Composición de subflows modulares, paralelismo, forks/joins y reducers para flujos de alta escala.",
            "target_level": "architect",
            "mission_ids": ["mission_14", "mission_15"],
        },
        {
            "id": "expert",
            "name": "Expert Track",
            "description": "Sistemas multiagente complejos con 15+ prompts, mitigación de riesgos, capstone y defensa técnica.",
            "target_level": "expert",
            "mission_ids": ["mission_16", "mission_17", "mission_18"],
        },
    ]

    @classmethod
    def get_all_missions(cls) -> list[MissionDefinition]:
        missions = [
            # Mission 0
            MissionDefinition(
                id="mission_00",
                version="1.0.0",
                track="builder",
                stage=0,
                title="Elige tu destino: Diagnóstico e Intención",
                brief="Define tu objetivo de aprendizaje y autoevalúa tu experiencia previa para configurar tu ruta adaptativa.",
                mode="explore",
                learning_objectives=[
                    "Comprender la diferencia entre un asistente genérico y un sistema de automatización con agentes",
                    "Configurar el perfil de aprendizaje adaptativo",
                ],
                prerequisites=[],
                skills=["canvas_navigation"],
                difficulty="beginner",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Declaración de Objetivo",
                        instructions="Selecciona tu enfoque principal: soporte, operaciones, finanzas o arquitectura multiagente.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Autoevaluación de Habilidades",
                        instructions="Responde al cuestionario inicial para desbloquear atajos si ya tienes experiencia.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "welcome_note",
                            "type": "postIt",
                            "position": {"x": 100, "y": 100},
                            "data": {
                                "title": "Bienvenido a Academy",
                                "content": "Aquí aprenderás construyendo sistemas de producción reales.",
                            },
                        }
                    ],
                    "edges": [],
                },
                required_evidence=["reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m0_1",
                        title="Claridad de Objetivo",
                        description="El alumno definió un objetivo claro.",
                        dimension="comprehension",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Pista de Enfoque",
                        text="¿Qué proceso repetitivo consumes actualmente que requiera múltiples decisiones?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["profile_initialized"],
            ),
            # Mission 1
            MissionDefinition(
                id="mission_01",
                version="1.0.0",
                track="builder",
                stage=1,
                title="Primer flujo funcional: Clasifica una solicitud",
                brief="Construye un flujo Start → Agent → End. El agente debe recibir un mensaje de soporte y clasificar su categoría.",
                mode="guided",
                learning_objectives=[
                    "Conectar Start, Agent y End semánticamente",
                    "Comprender que el edge transporta datos tipados",
                    "Ejecutar una simulación exitosa",
                ],
                prerequisites=["mission_00"],
                skills=["graph_connections"],
                difficulty="beginner",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Configurar Nodo Start",
                        instructions="Verifica que el nodo Start tenga el input schema con el campo 'message' de tipo string.",
                        expected_artifact="StartNode",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Conectar Agent",
                        instructions="Añade un AgentNode y une Start.output con Agent.input.",
                        expected_artifact="AgentNode",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Conectar End y Simular",
                        instructions="Conecta Agent.success con EndNode y ejecuta la simulación.",
                        expected_artifact="EndNode",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "node_start",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {
                                "title": "Start",
                                "role": "start",
                                "content": "Entrada: { message: string }",
                            },
                        },
                        {
                            "id": "node_agent",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Clasificador",
                                "role": "agent",
                                "content": "Clasifica la solicitud en: tecnico, facturacion, general",
                            },
                        },
                        {
                            "id": "node_end",
                            "type": "action",
                            "position": {"x": 660, "y": 200},
                            "data": {
                                "title": "End",
                                "role": "end",
                                "content": "Fin del proceso",
                            },
                        },
                    ],
                    "edges": [
                        {"id": "edge_1", "source": "node_start", "target": "node_agent"}
                        # Falta edge_2 hacia node_end
                    ],
                },
                required_evidence=["graph", "runtime", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m1_1",
                        title="Topología Conectada",
                        description="Start conecta con Agent y Agent conecta con End.",
                        dimension="correctness",
                    ),
                    RubricCriterion(
                        id="rubric_m1_2",
                        title="Simulación Exitosa",
                        description="El flujo ejecuta y produce un resultado sin errores.",
                        dimension="reliability",
                    ),
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Inspección de Conexión",
                        text="¿Hacia dónde viaja la salida del agente clasificador?",
                        clue_type="question",
                    ),
                    HintItem(
                        level=2,
                        title="Ruta Terminal",
                        text="Todo flujo funcional necesita alcanzar un nodo terminal (End).",
                        clue_type="concept",
                    ),
                    HintItem(
                        level=3,
                        title="Conexión Específica",
                        text="Une el puerto de salida del nodo 'Clasificador' con el puerto de entrada del nodo 'End'.",
                        clue_type="specific",
                    ),
                ],
                transfer_challenge=TransferChallenge(
                    id="transfer_m1",
                    title="Transferencia: Clasificación de Tickets VIP",
                    scenario_description="Aplica la misma topología para clasificar solicitudes agregando un nodo de enriquecimiento previo.",
                    variation_focus="graph_connections",
                    success_criteria=[
                        "Start conecta con Enricher, Enricher con Agent, Agent con End"
                    ],
                ),
                unlock_rewards=["pattern/linear_agent_v1"],
            ),
            # Mission 2
            MissionDefinition(
                id="mission_02",
                version="1.0.0",
                track="builder",
                stage=1,
                title="Lee antes de construir: Encuentra el flujo roto",
                brief="Un agente está conectado a dos destinos sin un nodo de decisión explícito. Encuentra la ambigüedad y resuélvela.",
                mode="practice",
                learning_objectives=[
                    "Identificar bifurcaciones ambiguas no controladas",
                    "Aprender a leer topologías antes de escribir código",
                    "Añadir un nodo de decisión determinista",
                ],
                prerequisites=["mission_01"],
                skills=["graph_connections", "conditions"],
                difficulty="beginner",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Identificar Ambigüedad",
                        instructions="Observa las dos salidas no condicionadas del nodo de análisis.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Insertar Decisión",
                        instructions="Inserta un nodo Condition entre el agente y los destinos.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Etiquetar Rutas",
                        instructions="Asigna True a la ruta VIP y False a la ruta Normal.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "start_2",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Start", "role": "start"},
                        },
                        {
                            "id": "agent_eval",
                            "type": "action",
                            "position": {"x": 300, "y": 200},
                            "data": {"title": "Evaluar Score", "role": "agent"},
                        },
                        {
                            "id": "escalate",
                            "type": "action",
                            "position": {"x": 580, "y": 100},
                            "data": {"title": "Escalar a Senior", "role": "agent"},
                        },
                        {
                            "id": "standard",
                            "type": "action",
                            "position": {"x": 580, "y": 300},
                            "data": {"title": "Respuesta Estándar", "role": "agent"},
                        },
                    ],
                    "edges": [
                        {"id": "e_s_a", "source": "start_2", "target": "agent_eval"},
                        {"id": "e_amb_1", "source": "agent_eval", "target": "escalate"},
                        {"id": "e_amb_2", "source": "agent_eval", "target": "standard"},
                    ],
                },
                required_evidence=["graph", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m2_1",
                        title="Eliminación de Ambigüedad",
                        description="La bifurcación tiene condiciones explícitas.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Ambigüedad de Ejecución",
                        text="Si un nodo emite datos a dos agentes a la vez sin condición, ¿cuál de los dos debe ejecutarse?",
                        clue_type="question",
                    ),
                    HintItem(
                        level=2,
                        title="Uso de ConditionNode",
                        text="Reemplaza los edges directos por un ConditionNode con ramas True y False.",
                        clue_type="concept",
                    ),
                ],
                unlock_rewards=["pattern/deterministic_branch_v1"],
            ),
            # Mission 3
            MissionDefinition(
                id="mission_03",
                version="1.0.0",
                track="builder",
                stage=2,
                title="Variables y transforms: De texto a dato útil",
                brief="Llega un string textual 'USD 1,250.00' y la decisión contable requiere un número float. Inserta un Transform de parseo.",
                mode="guided",
                learning_objectives=[
                    "Detectar discrepancias de tipos en tiempo de diseño",
                    "Usar nodos Transform para sanitizar y parsear datos",
                    "Validar contratos de entrada y salida",
                ],
                prerequisites=["mission_02"],
                skills=["data_contracts"],
                difficulty="beginner",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Inspeccionar Incompatibilidad",
                        instructions="Observa que la salida es string y la entrada destino es float.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Insertar TransformNode",
                        instructions="Agrega un nodo parse_amount para convertir 'USD 1,250.00' a 1250.00.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Simular Casos Válidos e Inválidos",
                        instructions="Comprueba el comportamiento ante montos bien formados y mal formados.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "start_3",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {
                                "title": "Recibir Factura",
                                "role": "start",
                                "output_type": "string",
                            },
                        },
                        {
                            "id": "decision_amount",
                            "type": "condition",
                            "position": {"x": 550, "y": 200},
                            "data": {
                                "title": "Monto > 1000?",
                                "input_type": "number",
                                "expression": "amount > 1000",
                            },
                        },
                        {
                            "id": "end_audit",
                            "type": "action",
                            "position": {"x": 800, "y": 200},
                            "data": {"title": "Auditoría", "role": "end"},
                        },
                    ],
                    "edges": [
                        {
                            "id": "e_incompat",
                            "source": "start_3",
                            "target": "decision_amount",
                        }
                    ],
                },
                required_evidence=["contract", "runtime"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m3_1",
                        title="Transformación Correcta",
                        description="Se insertó un transform que emite number.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Error de Tipo",
                        text="¿Qué tipo de dato espera el nodo de decisión y qué tipo entrega el nodo Start?",
                        clue_type="question",
                    ),
                    HintItem(
                        level=2,
                        title="Inserción de Transform",
                        text="Inserta un nodo Transform entre Start y Condition para limpiar símbolos y convertir a float.",
                        clue_type="concept",
                    ),
                ],
                unlock_rewards=["transform/currency_parser_v1"],
            ),
            # Mission 4
            MissionDefinition(
                id="mission_04",
                version="1.0.0",
                track="builder",
                stage=2,
                title="Decisiones deterministas: Ruta de prioridad",
                brief="Configura una condición con urgencia >= 8 para escalar, de lo contrario responder normal, cubriendo la ruta de error.",
                mode="guided",
                learning_objectives=[
                    "Configurar expresiones lógicas seguras",
                    "Garantizar cobertura del 100% de los outcomes (True, False, Error)",
                    "Diferenciar decision de classifier",
                ],
                prerequisites=["mission_03"],
                skills=["conditions"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Configurar Expresión",
                        instructions="Establece 'urgency_score >= 8' en el nodo de condición.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Conectar Rama True y False",
                        instructions="Conecta True a 'Escalar' y False a 'Respuesta Normal'.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Cubrir Rama de Error",
                        instructions="Conecta ErrorSink para atrapar variables nulas o no evaluables.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "start_4",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Ticket Recibido", "role": "start"},
                        },
                        {
                            "id": "cond_4",
                            "type": "condition",
                            "position": {"x": 350, "y": 200},
                            "data": {
                                "title": "Urgencia >= 8",
                                "expression": "urgency_score >= 8",
                            },
                        },
                        {
                            "id": "escalate_4",
                            "type": "action",
                            "position": {"x": 650, "y": 100},
                            "data": {"title": "Escalar Ticket", "role": "agent"},
                        },
                        {
                            "id": "normal_4",
                            "type": "action",
                            "position": {"x": 650, "y": 300},
                            "data": {"title": "Atención Normal", "role": "agent"},
                        },
                    ],
                    "edges": [
                        {"id": "e_start_cond", "source": "start_4", "target": "cond_4"}
                    ],
                },
                required_evidence=["graph", "test", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m4_1",
                        title="Rutas Completas",
                        description="Ambas ramas True y False están conectadas y etiquetadas.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Manejo Exhaustivo",
                        text="¿Qué ocurre si el urgency_score es 5? ¿Hacia qué nodo se dirige?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["pattern/exhaustive_condition_v1"],
            ),
            # Mission 5
            MissionDefinition(
                id="mission_05",
                version="1.0.0",
                track="builder",
                stage=2,
                title="Clasificación con IA: Cuando la regla no basta",
                brief="Clasifica el tono de un cliente en 'enojado', 'neutral', 'positivo' o 'incierto'. Si la confianza es menor a 0.7, desvía a revisión humana.",
                mode="practice",
                learning_objectives=[
                    "Implementar clasificación con salida estructurada JSON Enum",
                    "Definir un umbral de confianza mínimo",
                    "Añadir ruta de contingencia para baja confianza",
                ],
                prerequisites=["mission_04"],
                skills=["ai_classification"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Configurar Enum de Salida",
                        instructions="Limita la salida a los cuatro valores permitidos.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Configurar Umbral",
                        instructions="Establece threshold = 0.70.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Ruta Incierta",
                        instructions="Conecta la salida uncertain a una cola de revisión.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "start_5",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {"title": "Input Cliente", "role": "start"},
                        },
                        {
                            "id": "classifier_5",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Tono Classifier",
                                "role": "classifier",
                                "threshold": 0.7,
                            },
                        },
                        {
                            "id": "review_5",
                            "type": "human",
                            "position": {"x": 680, "y": 320},
                            "data": {"title": "Revisión Humana", "role": "human_gate"},
                        },
                        {
                            "id": "end_5",
                            "type": "action",
                            "position": {"x": 680, "y": 120},
                            "data": {"title": "Procesar Automático", "role": "end"},
                        },
                    ],
                    "edges": [
                        {"id": "e_5_1", "source": "start_5", "target": "classifier_5"}
                    ],
                },
                required_evidence=["contract", "runtime", "transfer"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m5_1",
                        title="Manejo de Incertidumbre",
                        description="Las salidas de baja confianza van a revisión humana.",
                        dimension="reliability",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Salida Probabilística",
                        text="Un LLM puede alucinar o no estar seguro. ¿Tiene el clasificador una rama 'uncertain'?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["pattern/safe_classifier_v1"],
            ),
            # Mission 6
            MissionDefinition(
                id="mission_06",
                version="1.0.0",
                track="builder",
                stage=2,
                title="Prompt como contrato: Agente de respuesta segura",
                brief="Construye un agente de soporte con propósito, contexto, restricciones y schema estricto que no invente políticas.",
                mode="challenge",
                learning_objectives=[
                    "Estructurar prompts en objetivo, contexto, restricciones y contrato de salida",
                    "Ejecutar fixtures de regresión para validar que el prompt no alucine",
                    "Versionar prompts como artefactos de código",
                ],
                prerequisites=["mission_05"],
                skills=["prompt_design"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Escribir System Prompt Estructurado",
                        instructions="Incluye las 4 secciones innegociables.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Definir JSON Output Schema",
                        instructions="Exige { answer: string, policy_cited: string, confidence: float }.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Pasar Fixtures de Prueba",
                        instructions="Ejecuta la suite de 3 casos de prueba sin fallos.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "agent_prompt",
                            "type": "action",
                            "position": {"x": 250, "y": 180},
                            "data": {
                                "title": "Soporte Bot",
                                "role": "agent",
                                "prompt": "Responde al usuario amablemente",
                            },
                        }
                    ],
                    "edges": [],
                },
                required_evidence=["test", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m6_1",
                        title="Contrato del Prompt",
                        description="El prompt cuenta con restricciones de política explícitas y schema JSON.",
                        dimension="safety",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Restricción de Alucinación",
                        text="Agrega la instrucción explícita: 'Si la información no está en el contexto, declara que lo desconoces en lugar de inventar'.",
                        clue_type="specific",
                    )
                ],
                unlock_rewards=["prompt_template/support_strict_v1"],
            ),
            # Mission 7
            MissionDefinition(
                id="mission_07",
                version="1.0.0",
                track="builder",
                stage=2,
                title="Revisión por evidencia: Corrige un contrato roto",
                brief="Un agente devuelve amount como string y una tool de ERP exige number. Usa Contract Inspector para localizar y subsanar.",
                mode="practice",
                learning_objectives=[
                    "Usar Contract Inspector para depuración preventiva",
                    "Corregir incompatibilidades de esquema sin ensayo y error",
                    "Demostrar resolución mediante nueva evidencia",
                ],
                prerequisites=["mission_06"],
                skills=["data_contracts"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Abrir Contract Inspector",
                        instructions="Observa el finding VAL-CON-004.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Aplicar Transform o Ajustar Agente",
                        instructions="Modifica el output schema del agente o inserta Transform.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Revalidar",
                        instructions="Ejecuta la validación determinista hasta obtener 0 blockers.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "ag_gen",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {
                                "title": "Extractor",
                                "role": "agent",
                                "output_schema": '{"amount": "string"}',
                            },
                        },
                        {
                            "id": "tool_erp",
                            "type": "action",
                            "position": {"x": 450, "y": 200},
                            "data": {
                                "title": "ERP Tool",
                                "role": "tool",
                                "input_schema": '{"amount": "number"}',
                            },
                        },
                    ],
                    "edges": [
                        {"id": "e_broken", "source": "ag_gen", "target": "tool_erp"}
                    ],
                },
                required_evidence=["contract", "review"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m7_1",
                        title="Resolución de Contrato",
                        description="El contrato entre agente y ERP está validado y es compatible.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Inspector de Contrato",
                        text="Revisa los tipos de los puertos de ag_gen y tool_erp.",
                        clue_type="specific",
                    )
                ],
                unlock_rewards=["pattern/contract_validation_v1"],
            ),
            # Mission 8
            MissionDefinition(
                id="mission_08",
                version="1.0.0",
                track="operator",
                stage=3,
                title="Capabilities y permisos: Enviar sin exponer secretos",
                brief="Envía un mensaje de Slack a partir de un ticket escalado usando una referencia de credencial segura de sandbox.",
                mode="guided",
                learning_objectives=[
                    "Consumir tools registradas en CapabilityRegistry",
                    "Usar credenciales por referencia (zero-trust, sin exponer API keys)",
                    "Configurar rutas de fallo auth_error y network_error",
                ],
                prerequisites=["mission_07"],
                skills=["tools_and_permissions"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Seleccionar Capability",
                        instructions="Elige 'fake.slack.notify' del registro.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Conectar Credential Reference",
                        instructions="Usa 'vault://credentials/slack_sandbox'.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Configurar Timeout y Fallos",
                        instructions="Establece timeout en 5000ms y ruta de error.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "start_8",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Alerta Ticket", "role": "start"},
                        },
                        {
                            "id": "slack_tool",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Slack Capability",
                                "role": "tool",
                                "capability_id": "fake.slack.notify",
                            },
                        },
                        {
                            "id": "end_8",
                            "type": "action",
                            "position": {"x": 680, "y": 200},
                            "data": {"title": "Completado", "role": "end"},
                        },
                    ],
                    "edges": [
                        {"id": "e_8_1", "source": "start_8", "target": "slack_tool"}
                    ],
                },
                required_evidence=["security", "runtime"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m8_1",
                        title="Seguridad de Credenciales",
                        description="No se insertaron tokens en texto plano y se referenció el vault.",
                        dimension="safety",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Zero Secrets in Code",
                        text="Nunca pegues un bot token en el canvas. Selecciona la credencial guardada en el vault.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=["capability/slack_notify_sandbox_v1"],
            ),
            # Mission 9
            MissionDefinition(
                id="mission_09",
                version="1.0.0",
                track="operator",
                stage=3,
                title="Retry e idempotencia: No envíes dos veces",
                brief="Un webhook responde timeout tras aceptar la orden. Declara idempotency_key y demuestra que eventos duplicados no causan doble cobro.",
                mode="challenge",
                learning_objectives=[
                    "Implementar llaves de idempotencia en nodos con efectos secundarios",
                    "Configurar política de reintento con backoff exponencial",
                    "Validar el ledger de ejecución ante eventos duplicados",
                ],
                prerequisites=["mission_08"],
                skills=["reliability"],
                difficulty="advanced",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Declarar Idempotency Key",
                        instructions="Configura idempotency_scope = 'order_id' en la política de ejecución.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Configurar Retry Policy",
                        instructions="Establece max_attempts = 3, backoff = exponential.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Simular Reenvío Duplicado",
                        instructions="Verifica que el segundo intento devuelve estado existente sin re-ejecutar el cobro.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "order_in",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Orden Recibida", "role": "start"},
                        },
                        {
                            "id": "payment_node",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Procesar Pago",
                                "role": "tool",
                                "side_effect": True,
                            },
                        },
                        {
                            "id": "receipt_end",
                            "type": "action",
                            "position": {"x": 680, "y": 200},
                            "data": {"title": "Recibo Emitido", "role": "end"},
                        },
                    ],
                    "edges": [
                        {"id": "e_9_1", "source": "order_in", "target": "payment_node"},
                        {
                            "id": "e_9_2",
                            "source": "payment_node",
                            "target": "receipt_end",
                        },
                    ],
                },
                required_evidence=["reliability", "runtime", "test"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m9_1",
                        title="Idempotencia Verificada",
                        description="La llamada duplicada es absorbida sin ejecutar el efecto secundario dos veces.",
                        dimension="reliability",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Llave de Negocio",
                        text="¿Qué identificador único identifica a esta transacción para garantizar que no se cobre dos veces?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["policy/idempotent_payment_v1"],
            ),
            # Mission 10
            MissionDefinition(
                id="mission_10",
                version="1.0.0",
                track="operator",
                stage=3,
                title="Human-in-the-loop: Aprobación con vencimiento",
                brief="Una solicitud de reembolso mayor a 500 USD requiere aprobación de un supervisor con límite de 24h y ruta ante expiración.",
                mode="guided",
                learning_objectives=[
                    "Modelar pausas humanas como contratos durables",
                    "Configurar roles de aprobación y contrato de reanudación",
                    "Manejar la ruta de expiración / timeout",
                ],
                prerequisites=["mission_09"],
                skills=["human_in_loop"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Añadir HumanGateNode",
                        instructions="Inserta el nodo de pausa humana con rol 'finance_supervisor'.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Configurar Expiración",
                        instructions="Establece expiry_ms = 86400000 (24h) y ruta timeout.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Conectar Resultados",
                        instructions="Conecta approved, rejected y expired a sus destinos correspondientes.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "refund_req",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Solicitud Reembolso", "role": "start"},
                        },
                        {
                            "id": "gate_supervisor",
                            "type": "human",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Aprobación Supervisor",
                                "role": "human_gate",
                                "timeout_action": "escalate",
                            },
                        },
                        {
                            "id": "process_payout",
                            "type": "action",
                            "position": {"x": 700, "y": 100},
                            "data": {"title": "Emitir Pago", "role": "tool"},
                        },
                        {
                            "id": "reject_notice",
                            "type": "action",
                            "position": {"x": 700, "y": 300},
                            "data": {"title": "Notificar Rechazo", "role": "agent"},
                        },
                    ],
                    "edges": [
                        {
                            "id": "e_10_1",
                            "source": "refund_req",
                            "target": "gate_supervisor",
                        }
                    ],
                },
                required_evidence=["graph", "runtime", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m10_1",
                        title="Pausas Durables",
                        description="El Human Gate cuenta con rutas explícitas de aprobación, rechazo y expiración.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Expiración del Gate",
                        text="Si el supervisor se encuentra fuera de la oficina y el gate vence, ¿qué camino toma el flujo?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["pattern/durable_hitl_v1"],
            ),
            # Mission 11
            MissionDefinition(
                id="mission_11",
                version="1.0.0",
                track="operator",
                stage=3,
                title="Observabilidad: Explica qué ocurrió",
                brief="Un flujo terminó en dead-letter. Usa el Run Inspector para encontrar el nodo culpable, clase de error y causa raíz.",
                mode="practice",
                learning_objectives=[
                    "Interpretar la traza temporal de un Run Inspector",
                    "Localizar payloads redactados y errores de ejecución",
                    "Redactar una explicación causal demostrable",
                ],
                prerequisites=["mission_10"],
                skills=["observability"],
                difficulty="intermediate",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Examinar Traza de Ejecución",
                        instructions="Abre la traza run_dead_letter_901.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Identificar Nodo Fallido",
                        instructions="Localiza el evento step_failed.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Subir Explicación",
                        instructions="Envía tu reflexión sobre la causa raíz en el panel de misión.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "obs_node_1",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {"title": "Paso 1: OK", "role": "agent"},
                        },
                        {
                            "id": "obs_node_2",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {
                                "title": "Paso 2: Fallido (429 RateLimit)",
                                "role": "tool",
                            },
                        },
                        {
                            "id": "dead_letter",
                            "type": "action",
                            "position": {"x": 680, "y": 200},
                            "data": {
                                "title": "Dead Letter Queue",
                                "role": "error_sink",
                            },
                        },
                    ],
                    "edges": [
                        {
                            "id": "e_obs_1",
                            "source": "obs_node_1",
                            "target": "obs_node_2",
                        },
                        {
                            "id": "e_obs_2",
                            "source": "obs_node_2",
                            "target": "dead_letter",
                        },
                    ],
                },
                required_evidence=["reasoning", "runtime"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m11_1",
                        title="Diagnóstico de Traza",
                        description="El diagnóstico identifica correctamente la causa raíz y propone solución.",
                        dimension="comprehension",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Revisión de Código de Error",
                        text="Revisa los metadatos del evento en el Run Inspector: ¿se agotaron los retries?",
                        clue_type="specific",
                    )
                ],
                unlock_rewards=["pattern/observability_dash_v1"],
            ),
            # Mission 12
            MissionDefinition(
                id="mission_12",
                version="1.0.0",
                track="flow_architect",
                stage=4,
                title="FlowArchitect Discovery: De idea a requisito",
                brief="Convierte un requerimiento informal de procesamiento de proveedores en un Requirement Map formal, rechazando suposiciones inseguras.",
                mode="explore",
                learning_objectives=[
                    "Separar intenciones ambiguas de requisitos técnicos",
                    "Identificar y descartar assumptions inseguras",
                    "Generar un Requirement Map inmutable",
                ],
                prerequisites=["mission_11"],
                skills=["flow_architect_discovery"],
                difficulty="advanced",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Conversación con Discovery",
                        instructions="Describe el objetivo y valida la comprensión del asistente.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Rechazar Suposición Insegura",
                        instructions="Rechaza la sugerencia de almacenar API keys en parámetros.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Confirmar Requirement Map",
                        instructions="Genera el mapa de requerimientos definitivo.",
                    ),
                ],
                starter_architecture_spec={
                    "intent": {
                        "goal": "Automatizar onboarding y validación de proveedores"
                    },
                    "requirements": {
                        "trigger": "webhook.vendor_registered",
                        "assumptions": [
                            {
                                "id": "assump_1",
                                "text": "El proveedor envía el Tax ID sin firmar",
                                "status": "rejected",
                            }
                        ],
                        "constraints": [
                            {"id": "c1", "text": "Validar contra base de datos oficial"}
                        ],
                    },
                },
                required_evidence=["architecture", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m12_1",
                        title="Rigurosidad en Requisitos",
                        description="Se identificaron y neutralizaron supuestos peligrosos.",
                        dimension="comprehension",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Pregunta de Validación",
                        text="¿Qué pasa si el webhook de registro de proveedor no incluye firma de autenticidad?",
                        clue_type="question",
                    )
                ],
                unlock_rewards=["architect_template/vendor_onboarding_v1"],
            ),
            # Mission 13
            MissionDefinition(
                id="mission_13",
                version="1.0.0",
                track="flow_architect",
                stage=4,
                title="Blueprint y rutas de fallo: Diseña antes de dibujar",
                brief="Especifica el ArchitectureSpec completo para procesamiento de facturas con rutas para archivo corrupto, schema inválido y timeout.",
                mode="guided",
                learning_objectives=[
                    "Construir la especificación arquitectónica antes de tocar el canvas",
                    "Definir políticas de fallo (retry, dead-letter, human-escalation)",
                    "Publicar preview a Builder conservando trazabilidad",
                ],
                prerequisites=["mission_12"],
                skills=["blueprint_design"],
                difficulty="advanced",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Modelar Pasos del Blueprint",
                        instructions="Define steps: Recibir PDF, Extraer OCR, Validar Monto, Aprobar.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Definir Transiciones de Error",
                        instructions="Añade transitions para corrupt_file, invalid_schema y timeout.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Publicar a Builder",
                        instructions="Empuja el blueprint al canvas de Builder y verifica la conversión 1:1.",
                    ),
                ],
                starter_architecture_spec={
                    "intent": {"goal": "Procesar facturas con PDFs e importes"},
                    "requirements": {
                        "trigger": "email.invoice_received",
                        "constraints": [],
                    },
                    "state_contract": {
                        "input": {"file_url": "string"},
                        "output": {"invoice_id": "string"},
                    },
                    "steps": [],
                    "transitions": [],
                },
                required_evidence=["architecture", "graph"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m13_1",
                        title="Especificación Exhaustiva",
                        description="El blueprint cubre happy path y todos los failure paths requeridos.",
                        dimension="correctness",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Mapeo de Errores",
                        text="Asegúrate de agregar un step de tipo 'error_sink' para capturar facturas corruptas.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=["blueprint/invoice_processing_v1"],
            ),
            # Mission 14
            MissionDefinition(
                id="mission_14",
                version="1.0.0",
                track="architect",
                stage=4,
                title="Subflows reutilizables: Una capacidad, varios equipos",
                brief="Encapsula el proceso 'Validar Proveedor' en un subflow con schema versionado y utilízalo en dos flujos diferentes.",
                mode="practice",
                learning_objectives=[
                    "Diseñar interfaces versionadas para subflows (v1 -> v2)",
                    "Componer flujos mayores reutilizando subflows existentes",
                    "Evaluar impacto de cambios y diff de esquemas",
                ],
                prerequisites=["mission_13"],
                skills=["subflows"],
                difficulty="advanced",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Definir Subflow Node",
                        instructions="Crea un SubflowNode con input 'tax_id' y output 'is_valid'.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Publicar v1",
                        instructions="Publica la revisión inmutable en el repositorio de subflows.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Insertar en Flujo Principal",
                        instructions="Conecta el subflow en el flujo de Onboarding y verifica que compile.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "sub_host",
                            "type": "subflow",
                            "position": {"x": 300, "y": 200},
                            "data": {
                                "title": "Subflow: Validar Proveedor",
                                "subflow_version": "1.0.0",
                            },
                        }
                    ],
                    "edges": [],
                },
                required_evidence=["graph", "contract"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m14_1",
                        title="Modularidad y Versionado",
                        description="El subflow cuenta con interfaz versionada y se integra limpiamente.",
                        dimension="complexity",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Contrato de Subflow",
                        text="Los subflows deben tener input_schema y output_schema explícitos para no generar drift.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=["subflow/validate_vendor_v1"],
            ),
            # Mission 15
            MissionDefinition(
                id="mission_15",
                version="1.0.0",
                track="architect",
                stage=4,
                title="Paralelismo y joins: Investiga sin pisar datos",
                brief="Crea un Fork que lance investigación de cliente, producto y riesgo en paralelo, luego un Join all con Reducer para unificar los reportes.",
                mode="challenge",
                learning_objectives=[
                    "Modelar bifurcaciones concurrentes (Fork)",
                    "Configurar políticas de Join (all, any, quorum)",
                    "Evitar condiciones de carrera usando un Reducer explícito",
                ],
                prerequisites=["mission_14"],
                skills=["parallelism_and_joins"],
                difficulty="advanced",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Crear ForkNode",
                        instructions="Conecta la entrada al ForkNode con 3 ramas de salida.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Crear 3 Agentes de Investigación",
                        instructions="Cliente, Producto y Riesgo operan en paralelo.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Configurar Join con Reducer",
                        instructions="Join reúne las 3 salidas y el Reducer genera el artifact unificado.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "fork_node",
                            "type": "action",
                            "position": {"x": 100, "y": 200},
                            "data": {"title": "Fork", "role": "fork"},
                        },
                        {
                            "id": "ag_client",
                            "type": "action",
                            "position": {"x": 380, "y": 80},
                            "data": {"title": "Investigar Cliente", "role": "agent"},
                        },
                        {
                            "id": "ag_product",
                            "type": "action",
                            "position": {"x": 380, "y": 200},
                            "data": {"title": "Investigar Producto", "role": "agent"},
                        },
                        {
                            "id": "ag_risk",
                            "type": "action",
                            "position": {"x": 380, "y": 320},
                            "data": {"title": "Investigar Riesgo", "role": "agent"},
                        },
                        {
                            "id": "join_node",
                            "type": "action",
                            "position": {"x": 680, "y": 200},
                            "data": {"title": "Join all + Reducer", "role": "join"},
                        },
                    ],
                    "edges": [
                        {"id": "ef1", "source": "fork_node", "target": "ag_client"},
                        {"id": "ef2", "source": "fork_node", "target": "ag_product"},
                        {"id": "ef3", "source": "fork_node", "target": "ag_risk"},
                        {"id": "ej1", "source": "ag_client", "target": "join_node"},
                        {"id": "ej2", "source": "ag_product", "target": "join_node"},
                        {"id": "ej3", "source": "ag_risk", "target": "join_node"},
                    ],
                },
                required_evidence=["graph", "runtime", "contract"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m15_1",
                        title="Concurrencia Segura",
                        description="Las 3 ramas se consolidan mediante un reducer sin sobrescribir datos.",
                        dimension="reliability",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Uso del Reducer",
                        text="Dos agentes no deben escribir en la misma clave de variable global; el Reducer combina sus outputs.",
                        clue_type="specific",
                    )
                ],
                unlock_rewards=["pattern/fork_join_reducer_v1"],
            ),
            # Mission 16
            MissionDefinition(
                id="mission_16",
                version="1.0.0",
                track="expert",
                stage=5,
                title="Equipo de agentes: Orquesta una investigación",
                brief="Diseña un equipo de 6 agentes (Investigador 1, Investigador 2, Crítico, Sintetizador, Verificador, Redactor) con handoffs tipados y ruta de contradicción.",
                mode="challenge",
                learning_objectives=[
                    "Orquestar equipos de agentes con responsabilidades no superpuestas",
                    "Diseñar handoffs con tipado estricto entre agentes",
                    "Manejar contradicciones entre agentes con rutas de resolución",
                ],
                prerequisites=["mission_15"],
                skills=["multi_agent_teams"],
                difficulty="expert",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Definir 6 Roles Únicos",
                        instructions="Crea los 6 agentes sin responsabilidades duplicadas.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Establecer Handoffs Tipados",
                        instructions="Cada edge entre agentes debe tener schema validado.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Ruta de Contradicción",
                        instructions="Si el Crítico detecta discrepancias, desvía al Verificador para desempate.",
                    ),
                ],
                starter_flow={
                    "nodes": [
                        {
                            "id": "lead_agent",
                            "type": "action",
                            "position": {"x": 80, "y": 200},
                            "data": {"title": "Orquestador Principal", "role": "agent"},
                        }
                    ],
                    "edges": [],
                },
                required_evidence=["graph", "contract", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m16_1",
                        title="Arquitectura Multiagente",
                        description="Al menos 6 agentes con roles ortogonales y contratos entre handoffs.",
                        dimension="complexity",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Prevención de Context Bloat",
                        text="No pases toda la conversación histórica a cada agente; cada uno debe recibir solo su input necesario.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=["pattern/six_agent_team_v1"],
            ),
            # Mission 17
            MissionDefinition(
                id="mission_17",
                version="1.0.0",
                track="expert",
                stage=5,
                title="Laboratorio de prompts y evaluación: Mejora sin romper",
                brief="Gestiona un sistema documental con 15+ prompts versionados, ejecutando suites de regresión para garantizar que ninguna mejora cause drift aguas abajo.",
                mode="challenge",
                learning_objectives=[
                    "Gestionar suites complejas de más de 15 prompts como código",
                    "Ejecutar pruebas de regresión contra fixtures deterministas",
                    "Analizar impacto de cambios en contratos downstream",
                ],
                prerequisites=["mission_16"],
                skills=["prompt_lab_eval"],
                difficulty="expert",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Inventariar 15+ Prompts",
                        instructions="Agrupa los prompts por rol y versión.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Ejecutar Regresión Previa",
                        instructions="Corre la suite de pruebas baseline.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Ajustar y Probar",
                        instructions="Optimiza un prompt clave sin romper las aserciones de salida.",
                    ),
                ],
                starter_flow={"nodes": [], "edges": []},
                required_evidence=["test", "review", "reasoning"],
                rubric=[
                    RubricCriterion(
                        id="rubric_m17_1",
                        title="Control de Calidad de Prompts",
                        description="La suite de 15+ prompts mantiene 100% de aserciones de regresión.",
                        dimension="reliability",
                    )
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Versionado Semántico",
                        text="Trata cada prompt como una función pura con contrato de entrada y salida.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=["tool/prompt_regression_runner_v1"],
            ),
            # Mission 18: Expert Capstone
            MissionDefinition(
                id="mission_18",
                version="1.0.0",
                track="expert",
                stage=5,
                title="Capstone Expert: Centro de Operaciones de Agentes (Operations Intelligence Desk)",
                brief="Construye un sistema multiagente de grado industrial: 15+ prompts, 8+ agentes, 3+ capabilities, 2+ subflows, Fork/Join, Human Gate, retries, 10 escenarios de caos y defensa técnica oral.",
                mode="project",
                learning_objectives=[
                    "Integrar el ciclo completo: FlowArchitect → Builder → Runtime",
                    "Cumplir con las 12 restricciones técnicas del estándar Expert",
                    "Defender técnicamente las decisiones de arquitectura ante el evaluador",
                ],
                prerequisites=["mission_17"],
                skills=[
                    "architecture_defense",
                    "multi_agent_teams",
                    "parallelism_and_joins",
                    "reliability",
                    "human_in_loop",
                ],
                difficulty="expert",
                instructions=[
                    MissionStep(
                        step_number=1,
                        title="Discovery & Blueprint",
                        instructions="Diseña el ArchitectureSpec en FlowArchitect con requisitos y rutas de fallo.",
                    ),
                    MissionStep(
                        step_number=2,
                        title="Construcción en Builder",
                        instructions="Implementa los 8+ agentes, 15+ prompts, 3 capabilities, 2 subflows y Fork/Join.",
                    ),
                    MissionStep(
                        step_number=3,
                        title="Pruebas de Caos y Simulación",
                        instructions="Supera los 10 escenarios adversariales en el simulador.",
                    ),
                    MissionStep(
                        step_number=4,
                        title="Defensa Técnica",
                        instructions="Responde a las 5 preguntas del tribunal de evaluación sobre trade-offs y recuperación.",
                    ),
                ],
                starter_flow={"nodes": [], "edges": []},
                required_evidence=[
                    "architecture",
                    "graph",
                    "contract",
                    "runtime",
                    "security",
                    "reliability",
                    "reasoning",
                    "project",
                ],
                rubric=[
                    RubricCriterion(
                        id="rubric_m18_1",
                        title="Inventario Completo (15+ prompts, 8+ agentes)",
                        description="Cumple los requisitos cuantitativos del capstone.",
                        dimension="complexity",
                    ),
                    RubricCriterion(
                        id="rubric_m18_2",
                        title="Resiliencia Operativa",
                        description="El sistema supera timeouts, rate limits y aprobaciones caducadas sin caerse.",
                        dimension="reliability",
                    ),
                    RubricCriterion(
                        id="rubric_m18_3",
                        title="Defensa Técnica Exitosa",
                        description="El alumno justifica coherentemente cada trade-off de latencia, coste y seguridad.",
                        dimension="comprehension",
                    ),
                ],
                hints=[
                    HintItem(
                        level=1,
                        title="Estructura del Capstone",
                        text="Consulta el mapa de requisitos del spec: desglosa primero los subflows antes de integrarlos al flujo principal.",
                        clue_type="concept",
                    )
                ],
                unlock_rewards=[
                    "certification/expert_credential",
                    "portfolio/expert_capstone_badge",
                ],
            ),
        ]
        return missions

    @classmethod
    def seed_catalog(cls) -> None:
        """Seed all missions into SQLite database."""
        missions = cls.get_all_missions()
        for m in missions:
            db.mission_def_upsert(m.model_dump())

    @classmethod
    def get_mission(cls, mission_id: str) -> MissionDefinition | None:
        data = db.mission_def_get(mission_id)
        if data:
            return MissionDefinition(**data)
        # Fallback to in-memory catalog
        for m in cls.get_all_missions():
            if m.id == mission_id:
                return m
        return None

    @classmethod
    def get_tracks(cls) -> list[dict[str, Any]]:
        return cls.TRACKS

    @classmethod
    def get_skills(cls) -> dict[str, Skill]:
        return cls.SKILLS
