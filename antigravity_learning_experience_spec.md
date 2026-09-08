# Antigravity Academy — experiencia de aprendizaje real de Builder y FlowArchitect

## 1. Decisión de producto

Antigravity Academy no es un tour, una colección de vídeos, una lista de ayuda ni una secuencia de tooltips. Es un sistema de práctica deliberada integrado en el producto que enseña a diseñar, construir, depurar, validar, operar y explicar flujos de IA reales.

La progresión no se mide por pantallas vistas ni botones pulsados. Se mide por evidencia:

- el usuario construye un grafo correcto;
- entiende qué dato cruza cada nodo;
- maneja una condición y sus rutas;
- detecta y corrige un fallo;
- escribe y prueba prompts;
- compone agentes y capabilities;
- publica una revisión validada;
- interpreta trazas;
- crea subflows reutilizables;
- culmina con un sistema multiagente de más de 15 prompts, múltiples agentes, contratos, simulación, human-in-the-loop y observabilidad.

La experiencia acompaña al usuario desde “unir dos nodos” hasta “operar una arquitectura de agentes segura y mantenible”.

~~~text
Aprender concepto
  → verlo en un contexto real
  → construirlo con guía
  → explicarlo
  → depurarlo con evidencia
  → repetirlo con menos ayuda
  → aplicarlo en un proyecto distinto
  → publicar una solución verificable
~~~

## 2. Problema de aprendizaje que resuelve

Los tours tradicionales enseñan dónde hacer clic. No enseñan:

- por qué un flujo necesita contratos;
- cuándo un prompt debe ser agente, transform, decisión, tool o subflow;
- por qué un error de schema es más peligroso que un nodo “rojo”;
- qué significa una rama false no cubierta;
- cómo evitar duplicar un side effect;
- cómo diseñar una pausa humana;
- cómo descomponer una tarea grande en agentes;
- cómo probar, observar y mejorar una arquitectura.

El resultado de un tour es una persona que sabe mover bloques. El resultado de Antigravity Academy debe ser una persona capaz de diseñar sistemas de agentes de forma segura y explicar sus decisiones.

## 3. Principios pedagógicos no negociables

1. Aprender haciendo: toda lección obliga a construir, conectar, ejecutar o diagnosticar algo dentro del producto.
2. Progresión de responsabilidad: explicación breve → ejercicio guiado → práctica con pistas → desafío sin receta → aplicación en proyecto propio.
3. Evidencia antes de completar: no se completa una habilidad por abrir una pantalla. Debe existir un artifact, una simulación, una respuesta razonada o una corrección demostrable.
4. Andamiaje reversible: las ayudas se pueden revelar bajo demanda y se reducen gradualmente; el usuario puede revisarlas después.
5. Feedback sobre el trabajo: el mentor comenta el grafo, contratos, rutas y trazas del usuario; no entrega solo texto genérico.
6. Errores como material de aprendizaje: los laboratorios incluyen fallos intencionales de datos, herramientas, modelos, concurrencia y aprobaciones.
7. Transferencia: una habilidad se valida de nuevo en otro contexto. Conectar dos nodos en una lección no basta; hay que aplicarlo a un flujo diferente.
8. Seguridad desde el inicio: no se enseña una tool o un prompt como poder absoluto. Se enseña permiso, schema, idempotencia, redacción y ruta de fallo.
9. Aceptar incertidumbre: la IA del mentor puede proponer y explicar, pero el grafo, la simulación y las reglas deterministas validan.
10. El proyecto del usuario es el destino: cada misión desbloquea una pieza reutilizable que puede llevar a su propio flujo.

## 4. Modelo de aprendizaje

### 4.1 Los cinco modos

| Modo | Propósito | Nivel de ayuda | Evidencia requerida |
|---|---|---|---|
| Explorar | Entender un concepto dentro de un ejemplo vivo | alta | interacción breve y predicción |
| Guiado | Construir una solución paso a paso | alta, contextual | grafo/contrato parcial correcto |
| Práctica | Resolver variación del problema | media | simulación y explicación |
| Desafío | Resolver con restricciones y poca ayuda | baja | solución validada y tests |
| Proyecto | Aplicar varias habilidades en un objetivo real | adaptable | revisión integral publicada |

El usuario no avanza por tiempo invertido. Avanza cuando la evidencia de cada misión cumple la rúbrica.

### 4.2 Ciclo de una misión

1. Brief: una situación realista, objetivo, restricciones y definición de éxito.
2. Predicción: antes de construir, el usuario responde qué cree que ocurrirá o qué componente necesita.
3. Construcción: el usuario edita un canvas sandbox o una ArchitectureSpec de laboratorio.
4. Ejecución/simulación: se muestran las rutas y artifacts con datos sintéticos.
5. Diagnóstico: se introduce un resultado válido o fallido que debe interpretar.
6. Reflexión: el usuario explica una decisión importante en sus palabras.
7. Evaluación: reglas deterministas y una rúbrica validan la solución.
8. Transferencia: un mini cambio obliga a aplicar la misma habilidad de otra manera.
9. Recompensa útil: se desbloquea una capability, template, subflow, reto o pieza reutilizable; nunca solo una insignia decorativa.

### 4.3 Tipos de evidencia

- graph evidence: nodos, edges, handles, rutas, grupos y subflows;
- contract evidence: schemas, bindings y transforms;
- runtime evidence: eventos, rutas tomadas, retry, pause/resume y outputs redactados;
- test evidence: escenarios, fixtures, assertions y resultados;
- reasoning evidence: respuesta breve a “por qué existe esta decisión”;
- review evidence: corrección aplicada después de un finding;
- project evidence: revisión publicada, manifest y documentación.

## 5. Perfil de aprendizaje y progresión

### 5.1 LearningProfile

Cada usuario tiene un perfil versionado:

~~~json
{
  "user_id": "user_123",
  "workspace_id": "ws_01",
  "level": "foundation",
  "skill_mastery": {
    "canvas_navigation": 0.0,
    "graph_connections": 0.0,
    "data_contracts": 0.0,
    "conditions": 0.0,
    "prompt_design": 0.0,
    "tools_and_permissions": 0.0,
    "reliability": 0.0,
    "human_in_loop": 0.0,
    "subflows": 0.0,
    "multi_agent_architecture": 0.0,
    "observability": 0.0,
    "security": 0.0
  },
  "completed_missions": [],
  "hint_preferences": {"mode": "adaptive"},
  "accessibility_preferences": {},
  "active_project_id": null
}
~~~

Mastery no es una simple puntuación autodeclarada. Se calcula por tareas correctas, transferencia, corrección de errores, complejidad de los artifacts y repetición espaciada. Una solución copiada sin reflexión no entrega dominio pleno.

### 5.2 Niveles

| Nivel | Resultado real |
|---|---|
| Foundation | crea y lee flujos simples con dos a cinco nodos |
| Builder | usa contratos, variables, transforms, decisiones y simulaciones básicas |
| Operator | usa tools, policies de error, HITL, trazas y publicaciones |
| Architect | diseña subflows, paralelismo, roles de agentes y requisitos con FlowArchitect |
| Expert | construye y opera sistemas multiagente con más de 15 prompts y mecanismos de calidad |

No existe un salto por “ver todo el contenido”. Para desbloquear Expert hay que terminar los proyectos de transferencia y superar una revisión técnica.

## 6. Mapa de habilidades

### 6.1 Habilidades fundamentales

- navegar canvas, seleccionar, mover, agrupar y leer flujos;
- distinguir nodo, puerto, edge y ruta;
- conectar dos nodos compatibles;
- entender que el edge transporta intención y no solo una línea visual;
- identificar start, end y una ruta terminal.

### 6.2 Habilidades de construcción

- modelar inputs y outputs;
- usar variables y artifacts;
- insertar transforms;
- configurar prompts/agentes con objetivo, contexto, restricciones y output contract;
- crear decisiones deterministas;
- diferenciar decision de classifier;
- construir rutas de success, failure y fallback.

### 6.3 Habilidades de operación

- configurar timeout, retry, idempotencia y dead letter;
- usar capabilities y credenciales por referencia;
- leer Run Inspector;
- interpretar una traza;
- pausar/reanudar Human Gate;
- versionar y publicar.

### 6.4 Habilidades de arquitectura

- formular requisitos y no objetivos;
- usar FlowArchitect para discovery;
- descomponer un problema en pasos/agentes;
- definir contratos y ownership de artifacts;
- componer subflows versionados;
- modelar forks, joins, loops y reducers;
- diseñar observabilidad y seguridad.

### 6.5 Habilidades expertas

- coordinar múltiples agentes y más de 15 prompts;
- versionar, evaluar y comparar prompts;
- diseñar reglas de delegación y handoffs;
- crear un grafo tolerante a fallos;
- simular escenarios adversariales;
- detectar drift Builder ↔ Architect;
- optimizar coste, latencia, calidad y seguridad con evidencia.

## 7. Ruta de aprendizaje completa

La ruta tiene 18 misiones principales, laboratorios de práctica y dos capstones. La duración no se presenta como una promesa rígida; el usuario avanza por habilidad demostrada.

### Etapa 0 — Bienvenida basada en intención

#### Misión 0: Elige tu destino

El usuario elige un objetivo: automatización personal, operaciones, investigación, soporte, contenido, análisis de documentos o agentes internos. Academy adapta ejemplos y vocabulario, pero no rebaja las habilidades técnicas.

Actividad: el usuario describe un proceso que le gustaría automatizar. El mentor lo convierte en un ejemplo de Requirement Map de solo lectura y señala qué aprenderá para construirlo.

Evidencia: objetivo guardado y autoevaluación de experiencia previa.

### Etapa 1 — Fundamentos del grafo

#### Misión 1: Primer flujo funcional — “Clasifica una solicitud”

Objetivo: crear un flujo Start → Agent → End.

Escenario: llega una solicitud de cliente y se debe obtener una categoría estructurada.

El usuario:

1. crea Start con input schema básico;
2. añade Agent;
3. conecta Start.output con Agent.input;
4. define una salida enum simple;
5. conecta Agent.success a End;
6. ejecuta una simulación.

Habilidad evaluada: unir dos nodos de forma semántica, no solo visual.

Evidencia: edge compatible, schema de entrada/salida, una simulación correcta y respuesta a “¿qué viaja por el edge?”.

#### Misión 2: Lee antes de construir — “Encuentra el flujo roto”

Objetivo: aprender a leer rutas, no solo crearlas.

Escenario: un flow con Agent conectado a dos destinos sin una decisión. El usuario debe encontrar la ambigüedad, explicar el problema y corregirlo mediante Decision o Fork adecuado.

Habilidad evaluada: topología, alcance de un edge y rutas terminales.

#### Misión 3: Variables y transforms — “De texto a dato útil”

Objetivo: convertir un importe textual en número validado.

Escenario: llega “USD 1,250.00”; una decisión necesita un number.

El usuario crea binding, inserta Transform parse_number, inspecciona input/output schema y ejecuta casos válidos/invalidos.

Habilidad evaluada: no conectar tipos incompatibles ni confiar en parse implícito.

### Etapa 2 — Lógica, contratos y prompts

#### Misión 4: Decisiones deterministas — “Ruta de prioridad”

Objetivo: crear una condición con rutas True/False explícitas.

Escenario: si urgency_score es mayor o igual a 8, escalar; de lo contrario, responder normalmente.

El usuario:

- configura expression segura;
- etiqueta handles true y false;
- crea las dos rutas;
- añade ruta ante evaluation error;
- simula ambos casos.

Habilidad evaluada: entender que decision no es un prompt y que ambos outcomes deben estar cubiertos.

#### Misión 5: Clasificación con IA — “Cuando la regla no basta”

Objetivo: diferenciar classifier de decision.

Escenario: clasificar tono de un mensaje en angry, neutral, positive o uncertain.

El usuario define enum, prompt de clasificación, output schema, confidence threshold y ruta uncertain. Debe comparar una respuesta válida, un JSON inválido y baja confianza.

Habilidad evaluada: output estructurado, fallback y límites de LLM.

#### Misión 6: Prompt como contrato — “Agente de respuesta segura”

Objetivo: construir un Agent con propósito, contexto, restricciones y output schema.

Escenario: redactar una respuesta de soporte que no invente políticas.

El usuario crea tres versiones de prompt, define ejemplos, ejecuta fixtures de regresión y compara resultados. Academy enseña a versionar prompts y explica que un prompt es código.

Habilidad evaluada: diseño de prompt validable, no “prompt bonito”.

#### Misión 7: Revisión por evidencia — “Corrige un contrato roto”

Objetivo: usar Contract Inspector y Run Inspector.

Escenario: un agente devuelve amount como string y una tool de ERP exige number. La simulación falla.

El usuario debe localizar el finding, decidir si transformar o cambiar el agente, aplicar corrección y volver a correr las pruebas.

Habilidad evaluada: depuración basada en contract, no ensayo y error.

### Etapa 3 — Fiabilidad, tools y operación

#### Misión 8: Capabilities y permisos — “Enviar sin exponer secretos”

Objetivo: usar una tool autorizada.

Escenario: enviar un mensaje de Slack a partir de un ticket escalado.

El usuario elige capability, conecta credential reference de sandbox, revisa scopes y output schema, define timeout, ruta auth_error y falla de red. El sandbox no contiene credenciales reales.

Habilidad evaluada: capability frente a texto libre, mínimo privilegio y trazabilidad.

#### Misión 9: Retry e idempotencia — “No envíes dos veces”

Objetivo: evitar duplicar un side effect.

Escenario: un envío de notificación responde timeout después de haber sido aceptado remotamente.

El usuario declara business key, idempotency key, retry/backoff y lee el ledger del adapter fake. Luego recibe un evento duplicado y debe demostrar que solo hay un envío.

Habilidad evaluada: fiabilidad operativa real.

#### Misión 10: Human-in-the-loop — “Aprobación con vencimiento”

Objetivo: diseñar una pausa humana completa.

Escenario: una solicitud de reembolso superior a un umbral necesita aprobación.

El usuario configura roles, resume contract, approve/reject/request_changes, expiry y ruta expired. Academy reinicia el sandbox intencionalmente antes de reanudar para demostrar la diferencia entre memoria temporal y checkpoint durable.

Habilidad evaluada: HITL como contrato de proceso, no botón de pausa.

#### Misión 11: Observabilidad — “Explica qué ocurrió”

Objetivo: interpretar una ejecución de varios nodos.

Escenario: un flujo terminó con dead letter. El usuario usa Run Inspector para encontrar el nodo, input redactado, error class, retry aplicado, ruta seleccionada y revisión ejecutada.

Habilidad evaluada: operar sin depender de logs opacos.

### Etapa 4 — Arquitectura y reutilización

#### Misión 12: FlowArchitect Discovery — “De idea a requisito”

Objetivo: aprender a no saltar al canvas.

Escenario: automatizar procesamiento de solicitudes de proveedores.

El usuario conversa con Discovery, confirma hechos, rechaza una assumption insegura, define no objetivos y revisa Requirement Map. Debe explicar qué pregunta cambió más la arquitectura.

Habilidad evaluada: separar intención, requisito y decisión de implementación.

#### Misión 13: Blueprint y rutas de fallo — “Diseña antes de dibujar”

Objetivo: construir ArchitectureSpec antes de Builder.

Escenario: procesar una factura con PDFs, importes, duplicados y aprobación.

El usuario revisa blueprint, agrega rutas para archivo corrupto, schema inválido, timeout y duplicado; define observabilidad y escenarios. Después publica preview a Builder.

Habilidad evaluada: happy path más failure path.

#### Misión 14: Subflows reutilizables — “Una capacidad, varios equipos”

Objetivo: encapsular un proceso con interfaz versionada.

Escenario: crear subflow “Validar proveedor” usado por onboarding y facturas.

El usuario define input/output/error schemas, publica v1, inserta en dos flows, cambia una versión de prueba y analiza compatibilidad/diff.

Habilidad evaluada: composición, versionado y reutilización segura.

#### Misión 15: Paralelismo y joins — “Investiga sin pisar datos”

Objetivo: coordinar ramas múltiples.

Escenario: una solicitud requiere investigación de cliente, producto y riesgo en paralelo.

El usuario crea Fork, tres Agents, Join all y un reducer para consolidar artifacts. Academy inyecta el retraso de una rama y un conflicto de escritura. El usuario decide timeout y policy de join.

Habilidad evaluada: concurrencia, reducers y completitud.

### Etapa 5 — Multiagente y nivel experto

#### Misión 16: Equipo de agentes — “Orquesta una investigación”

Objetivo: diseñar roles, handoffs y contratos entre agentes.

Escenario: producir un informe de investigación con investigadores, crítico, sintetizador y verificador.

El usuario debe crear al menos seis agentes con objetivos no redundantes, inputs/outputs tipados, una estrategia de revisión y una ruta de contradicción. Academy evalúa si los agentes tienen responsabilidades duplicadas, si existen handoffs opacos o si un agente recibe contexto excesivo.

Habilidad evaluada: diseño de equipos, no simple acumulación de prompts.

#### Misión 17: Laboratorio de prompts y evaluación — “Mejora sin romper”

Objetivo: manejar más de 15 prompts como artefactos versionados y evaluados.

Escenario: un sistema de análisis documental con 18 prompts distribuidos entre extracción, clasificación, verificación, redacción y control de calidad.

El usuario:

- organiza prompts por rol y versión;
- define fixtures y criterios por prompt;
- ejecuta regresión antes/después de cambiar uno;
- identifica qué downstream contracts podrían romperse;
- usa una variante A/B solo dentro de un experimento controlado;
- documenta la decisión de promover o revertir.

Habilidad evaluada: prompt engineering como ingeniería de producto.

#### Misión 18: Capstone Expert — “Centro de operaciones de agentes”

Objetivo: construir un sistema realista de nivel experto.

Escenario recomendado: “Operations Intelligence Desk”. Recibe solicitudes multicanal, clasifica, extrae datos, consulta fuentes autorizadas, asigna especialistas, consolida evidencia, pasa por revisión humana cuando corresponde y produce una respuesta/acción auditable.

Restricciones obligatorias:

- al menos 15 prompts versionados;
- al menos 8 agentes con roles distintos;
- al menos 3 capabilities autorizadas;
- al menos 2 subflows publicados;
- al menos 1 Fork/Join;
- al menos 2 decisiones deterministas y 1 classifier;
- al menos 1 Human Gate con expiración;
- contratos en todos los handoffs;
- retries/idempotencia para side effects;
- mínimo 10 escenarios, incluyendo caos;
- Run Inspector y documentación operativa;
- publicación desde FlowArchitect → Builder → Runtime;
- revisión de seguridad, coste, latencia y drift.

La certificación Expert exige defender la arquitectura: el usuario responde preguntas sobre una ruta, un contrato, una policy, una prueba y una decisión de diseño. No se aprueba solo porque el flujo “corre”.

## 8. Laboratorios de fallo intencional

Los laboratorios no solo enseñan el happy path. Deben existir ejercicios de:

- edge True/False invertido;
- variable no declarada;
- string enviado a nodo que requiere number;
- JSON inválido de un classifier;
- low confidence sin ruta uncertain;
- timeout y rate limit;
- credential expirada;
- retry que duplica un side effect;
- evento duplicado;
- Human Gate vencido;
- subflow con schema v2 incompatible;
- fork que nunca llega a join;
- dos agentes que escriben el mismo artifact sin reducer;
- prompt injection dentro de documento de entrada;
- cambio de prompt que rompe una regresión;
- drift manual en Builder después de aprobar ArchitectureSpec.

Cada fallo debe ser reproducible, seguro y visible en la traza. El mentor nunca “arregla” el flujo sin que el usuario comprenda y acepte la corrección.

## 9. Mentoría asistida por IA

### 9.1 Roles del mentor

El sistema usa especialistas pedagógicos, no un único chatbot omnisciente:

| Mentor | Función |
|---|---|
| Coach de misión | plantea objetivo, restricciones y siguiente paso |
| Explicador conceptual | enseña el porqué de un contrato, policy o patrón |
| Revisor de grafo | analiza topología, edges, rutas y redundancias |
| Tutor de datos | revisa schemas, bindings y transforms |
| Tutor de prompts | revisa objetivo, restricciones, output schema y tests |
| Revisor de fiabilidad | detecta retries, idempotencia, errores y observabilidad |
| Revisor de seguridad | detecta exposición de datos, permisos y capabilities |
| Tutor de depuración | guía lectura de Run Inspector sin revelar la respuesta inmediata |
| Evaluador | aplica rúbrica con evidencia determinista y explica brechas |

### 9.2 Reglas del mentor

- primero pregunta o da pista; no da la solución completa salvo en modo Explicar;
- nunca modifica el flow del alumno sin una aceptación explícita;
- cada sugerencia enlaza al nodo, edge, contract, trace o finding que la fundamenta;
- separa hecho, inferencia y recomendación;
- usa salida estructurada validada;
- adapta el nivel de ayuda al rendimiento, no a una suposición de inteligencia;
- detecta frustración repetida y ofrece cambiar de modo, revisar un ejemplo o recibir una microlección;
- evita premiar soluciones inseguras solo porque pasan un caso feliz.

### 9.3 Escalera de pistas

Pista 1: recuerda el objetivo y señala la zona afectada.

Pista 2: nombra el concepto relevante, por ejemplo “la salida amount aún es string”.

Pista 3: explica la consecuencia y muestra un ejemplo mínimo.

Pista 4: destaca componentes compatibles sin aplicar el cambio.

Pista 5: ofrece un patch en preview; el usuario debe revisarlo y aceptarlo.

Usar un presupuesto de pistas por misión solo para motivar reflexión, nunca como castigo. El usuario siempre puede pedir explicación completa por accesibilidad o necesidad.

## 10. Evaluación y rúbricas

### 10.1 Evaluación determinista primero

La calificación primaria procede de:

- validación del BuilderFlow/ArchitectureSpec;
- comparación de topología esperada;
- contracts y bindings;
- simulaciones/assertions;
- estado de publicación;
- eventos de Runtime;
- prueba de transferencia.

Un LLM puede evaluar una explicación o dar feedback de claridad, pero no debe decidir por sí solo si una arquitectura insegura aprueba.

### 10.2 Rúbrica de misión

| Dimensión | Pregunta | Evidencia |
|---|---|---|
| Correctitud | ¿El flujo satisface el objetivo? | assertions y ruta |
| Contratos | ¿Los datos son compatibles y explícitos? | schemas/bindings/transforms |
| Fiabilidad | ¿Maneja fallos y duplicados? | policies, simulación y trace |
| Seguridad | ¿Respeta permisos y redacción? | registry, policies y validación |
| Comprensión | ¿Puede explicar una decisión? | reflexión y trazabilidad |
| Transferencia | ¿Resuelve una variación? | reto posterior |

Para nivel Foundation basta una solución guiada correcta más una reflexión. Para Expert se exige solución robusta, defensa técnica y transferencia a un problema nuevo.

### 10.3 Revisión de capstone

El capstone recibe:

- informe de arquitectura;
- inventario de agentes/prompts/capabilities;
- mapa de contratos;
- resultados de simulación;
- tabla de riesgos;
- Run Inspector de una ejecución;
- análisis de coste/latencia;
- explicación de decisiones;
- pruebas de drift/migración si aplica.

El evaluador presenta hallazgos y el usuario debe corregir blockers. No hay “aprobado por esfuerzo”.

## 11. Gamificación responsable

La motivación debe premiar competencia, no volumen:

- skill badges basadas en evidencia;
- “debugging streak” por encontrar causas reales;
- biblioteca de patterns desbloqueada por aplicación correcta;
- credenciales Foundation, Builder, Operator, Architect y Expert;
- portfolio de subflows/templates publicados en sandbox;
- retos opcionales de tiempo solo después de dominar calidad.

No usar mecánicas que incentiven saltar validaciones, copiar flows o acumular nodos innecesarios.

## 12. Integración con Builder y FlowArchitect

### 12.1 Learning Sandbox

Cada misión se ejecuta en un workspace sandbox aislado:

- no contiene secrets reales;
- capabilities resuelven a adapters fake;
- checkpoints y runs no se mezclan con producción;
- el usuario puede resetear la misión;
- los artifacts usan datos sintéticos/redactados;
- el usuario puede clonar un resultado completado hacia su workspace personal, pero se revalida antes de publicar.

### 12.2 Modo Aprender dentro del Builder

Builder muestra un panel de misión que sabe qué nodo/edge/schema está trabajando el usuario. No bloquea toda la interfaz; resalta elementos relevantes y permite exploración. Las restricciones de misión solo se aplican al sandbox.

Ejemplos:

- al crear una Decision, se ofrece “practicar ramas explícitas”;
- al conectar schemas incompatibles, se ofrece misión corta de Transform;
- al aparecer un run duplicado, se sugiere laboratorio de idempotencia;
- al crear muchos prompts, se propone Prompt Lab y regresión;
- al crear un subflow, se desbloquea lección de interfaces/versiones.

### 12.3 Modo Aprender dentro de FlowArchitect

Discovery explica por qué pregunta algo y permite activar “mostrar razonamiento pedagógico” sin revelar chain-of-thought del modelo. Requirement Map resalta cómo una respuesta cambia pasos, riesgos y tests. Blueprint permite comparar una ruta feliz con failure map.

## 13. Modelo de datos de Academy

### 13.1 LearningPath

~~~json
{
  "id": "path_builder_expert_v1",
  "version": "1.0.0",
  "title": "De primer flujo a arquitectura multiagente",
  "skill_targets": ["graph_connections", "data_contracts", "multi_agent_architecture"],
  "modules": ["mission_01", "mission_02"],
  "prerequisites": [],
  "completion_policy": {"required_missions": 18, "minimum_mastery": 0.8}
}
~~~

### 13.2 MissionDefinition

~~~json
{
  "id": "mission_04_deterministic_decision",
  "version": "1.0.0",
  "mode": "guided",
  "brief": "Escala tickets urgentes.",
  "learning_objectives": ["Crear una decisión determinista", "Cubrir ambas ramas"],
  "starter_artifact_ref": "sandbox://flows/ticket-priority/v1",
  "required_evidence": ["graph", "simulation", "reflection"],
  "rubric_ref": "rubric/decision/v1",
  "hints": [],
  "transfer_challenge_ref": "challenge/refund-priority/v1",
  "unlock_rewards": ["pattern/decision-with-failure/v1"]
}
~~~

### 13.3 LearnerAttempt

Guardar mission_id, artifact revision, graph snapshot hash, simulator run IDs, hints used, reflections, rubric result, mentor feedback, status, started_at y completed_at. La evidencia debe ser inmutable por intento para permitir revisión y regresión de contenido.

### 13.4 SkillMastery

Actualizar con una política transparente. Un ejemplo:

~~~text
mastery = evidencia correcta ponderada
         + transferencia correcta
         + corrección autónoma de fallo
         + repetición espaciada
         - dependencia recurrente de solución completa
~~~

No exponer una fórmula “mágica” como verdad absoluta. Mostrar al usuario qué evidencia le falta para progresar.

## 14. Servicios, APIs y arquitectura técnica

### 14.1 Servicios

- LearningCatalogService: rutas, módulos, versiones y prerequisitos;
- LearningProfileService: progreso, preferencias y mastery;
- MissionSessionService: sesiones, sandbox y estado;
- LearningArtifactService: clone/reset/snapshots;
- LearningAssessmentService: evaluadores deterministas, rúbricas y feedback;
- LearningMentorService: especialistas pedagógicos con outputs estructurados;
- LearningAnalyticsService: calidad de misión, dificultad, abandono y transferencia;
- LearningIntegrationBridge: eventos desde Builder y FlowArchitect.

### 14.2 Endpoints

POST /api/v1/learning/profiles inicializa perfil.

GET /api/v1/learning/paths devuelve rutas y prerequisitos.

POST /api/v1/learning/missions/{id}/start crea sandbox y LearnerAttempt.

GET /api/v1/learning/sessions/{id} devuelve brief, estado, evidencia, hints y objetivos.

POST /api/v1/learning/sessions/{id}/evaluate ejecuta validadores y devuelve findings/rúbrica.

POST /api/v1/learning/sessions/{id}/hint devuelve siguiente pista apta para el contexto.

POST /api/v1/learning/sessions/{id}/reflect recibe explicación del usuario y devuelve feedback no vinculante más evidencia de comprensión.

POST /api/v1/learning/sessions/{id}/complete verifica rúbrica, transferencia y actualiza mastery.

POST /api/v1/learning/sessions/{id}/clone-to-workspace crea un borrador en el workspace del usuario y fuerza revalidación.

GET /api/v1/learning/portfolio devuelve artifacts/certificaciones obtenidas.

### 14.3 Eventos de integración

Builder y FlowArchitect emiten eventos de aprendizaje con referencias, no datos sensibles:

- builder.node_created;
- builder.edge_connected;
- builder.validation_failed;
- builder.validation_fixed;
- builder.simulation_completed;
- builder.flow_published;
- builder.run_inspected;
- architect.requirement_confirmed;
- architect.assumption_rejected;
- architect.blueprint_changed;
- architect.simulation_passed;
- runtime.human_resumed.

LearningIntegrationBridge decide si ofrecer una misión contextual; no interrumpe una tarea de producción ni muestra modales insistentes.

## 15. Seguridad, privacidad y accesibilidad

### 15.1 Privacidad

Por defecto, Academy no usa flows de producción como material de entrenamiento ni muestra datos reales en ejercicios. Un usuario puede elegir crear una misión de revisión sobre una copia redactada de su flow, con consentimiento y reglas de acceso.

### 15.2 Seguridad

Todos los laboratorios usan fake capabilities y credential references de sandbox. Nunca enseñar prácticas inseguras como pegar API keys en un nodo. Cuando se necesita mostrar un secreto, usar valores ficticios y explicar por qué no deben existir en configuración.

### 15.3 Accesibilidad

- todas las misiones se pueden realizar por teclado;
- todos los estados tienen texto y no dependen de color;
- modo documento alternativo al canvas;
- transcripciones de simulación;
- velocidad de tutorial configurable;
- mentor puede dar explicación completa a petición;
- evitar límites de tiempo obligatorios para completar rutas principales.

## 16. Analítica responsable

Medir para mejorar el currículo, no para vigilar:

- tiempo por misión;
- uso de pistas por tipo;
- findings frecuentes;
- tasa de corrección;
- transferencia entre contextos;
- abandono por paso;
- misiones con falsa sensación de éxito;
- calidad de capstones;
- progreso de mastery agregado y anónimo.

No usar métricas de “número de nodos” o “cantidad de prompts” como señal principal de aprendizaje. Un flow más largo puede ser peor.

## 17. Roadmap de implementación

### Fase L0 — Fundamentos de contenido y sandbox

Implementar LearningProfile, LearningPath, MissionDefinition, MissionSession, sandbox aislado, tres misiones Foundation, validadores de graph/schema y panel básico de misión en Builder.

### Fase L1 — Práctica real y evaluación

Implementar 11 misiones hasta Operator, escalera de pistas, rúbricas, Run Inspector educativo, reflección, transfer challenges, portfolio y clonación segura al workspace.

### Fase L2 — Arquitectura y experto

Implementar misiones FlowArchitect, subflows, paralelismo, multiagente, Prompt Lab, capstone de más de 15 prompts y revisión Expert.

### Fase L3 — Adaptación y comunidad interna

Implementar rutas adaptativas, repetición espaciada, revisión entre pares con permisos, biblioteca de patterns aprobados, analítica de currículo y desafíos organizacionales.

## 18. Criterios de aceptación

Academy no se considera implementada hasta que:

1. un usuario nuevo pueda construir y simular correctamente un flujo de dos nodos;
2. pueda demostrar que sabe corregir una incompatibilidad de datos;
3. pueda crear una Decision con true/false/failure explícitos;
4. pueda diferenciar Decision y Classifier a partir de una situación real;
5. pueda configurar tool, retry, idempotencia y Human Gate en sandbox;
6. pueda interpretar una traza y localizar una causa de fallo;
7. pueda pasar de FlowArchitect a Builder sin perder provenance;
8. pueda publicar e insertar un subflow con contrato;
9. pueda completar un flow paralelo con join/reducer;
10. pueda construir, probar y defender un capstone con más de 15 prompts y múltiples agentes;
11. cada misión tenga evidencia objetiva, simulación segura y feedback contextual;
12. los laboratorios no expongan secretos, datos de producción ni capabilities reales;
13. el progreso no pueda obtenerse solo navegando pantallas;
14. el sistema pueda explicar al usuario qué habilidad logró y qué evidencia falta para subir de nivel.

## 19. Prompt maestro de implementación de Antigravity Academy

~~~text
Eres el líder de producto educativo y arquitecto de aprendizaje de Antigravity Academy. Debes implementar una experiencia práctica integrada a FlowArchitect y Antigravity Builder que lleve al usuario desde conectar dos nodos hasta construir, validar, publicar y operar sistemas multiagente de nivel experto.

CONTRATO INNEGOCIABLE

1. No implementes un simple tour, lista de ayuda, colección de vídeos ni secuencia de tooltips.
2. Cada módulo debe exigir práctica real dentro de Builder o FlowArchitect.
3. El progreso debe requerir evidencia objetiva: graph, schemas, simulaciones, trazas, correcciones, reflexiones y transferencia.
4. No otorgues completitud solo por abrir una pantalla, pulsar un botón, pasar tiempo o copiar un template.
5. El aprendizaje se realiza en sandbox aislado con fake capabilities, datos sintéticos y sin secretos reales.
6. No dejes que un mentor IA modifique flows sin aceptación explícita del usuario.
7. El mentor debe comentar el artifact/contexto del usuario, no ofrecer feedback genérico.
8. Las evaluaciones deterministas de graph, contracts, tests y runtime prevalecen sobre una evaluación subjetiva de LLM.
9. Toda recomendación del mentor usa salida estructurada validada y distingue hecho, inferencia y sugerencia.
10. No enseñes prácticas inseguras: tools requieren capability registry, credenciales por referencia, schemas, permisos, redacción e idempotencia.
11. La ruta Expert debe exigir más de 15 prompts versionados, múltiples agentes, subflows, decisiones, classifier, Human Gate, capabilities, simulaciones, observabilidad y defensa técnica.
12. La experiencia debe ser accesible por teclado, no depender solo de color y tener modo documento.

IMPLEMENTAR

- LearningProfile, LearningPath, MissionDefinition, MissionSession, LearnerAttempt, SkillMastery y Portfolio.
- Cinco modos: Explorar, Guiado, Práctica, Desafío y Proyecto.
- Dieciocho misiones y los dos capstones especificados en el documento fuente.
- Coach de misión, Explicador conceptual, Revisor de grafo, Tutor de datos, Tutor de prompts, Revisor de fiabilidad, Revisor de seguridad, Tutor de depuración y Evaluador.
- Escalera de pistas, reflection prompts, transfer challenges, rúbricas y evidencia versionada.
- Learning Sandbox con adapters fake, fixture controlado, reset y clone-to-workspace con revalidación.
- Integración contextual con eventos de Builder, FlowArchitect y Runtime.
- Evaluación determinista, feedback LLM validado, analítica responsable y controles de privacidad.

FASES

L0: dominio de aprendizaje, sandbox, tres misiones Foundation, validadores y panel Builder.
L1: misiones hasta Operator, rúbricas, hints, transfer, Run Inspector educativo y portfolio.
L2: rutas Architect/Expert, Prompt Lab, multiagente, capstone de más de 15 prompts y defensa.
L3: adaptación, repetición, colaboración autorizada y analítica de currículo.

DEFINITION OF DONE

No declares Academy terminada hasta que el usuario pueda demostrar las trece condiciones de aceptación del documento fuente. Ejecuta pruebas de contenido, validadores, sandbox, accesibilidad, seguridad, integración Builder/Architect/Runtime y capstone E2E. Reporta evidencia por misión y por habilidad. Si cualquier requisito entra en conflicto con contratos de FlowArchitect o Builder, detente y solicita decisión; no reduzcas el nivel de aprendizaje ni debilites la seguridad.
~~~
