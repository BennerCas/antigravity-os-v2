# FlowArchitect — especificación nativa para Antigravity Builder

## Decisión de producto

FlowArchitect no es un generador de diagramas ni un exportador. Es la capa de arquitectura de Antigravity:

```text
Intención → requisitos verificables → Architecture Spec → validación/simulación
         → Builder Flow → grafo LangGraph ejecutable → Runtime y trazas
```

El Builder conserva su función: edición visual, composición y ejecución. FlowArchitect evita que el usuario llegue al canvas sin una decisión explícita sobre objetivos, datos, rutas, riesgos y criterios de éxito.

## Hallazgos que determinan el diseño

El Builder ya tiene cimientos útiles: canvas React Flow, nodos de agente, condición, variable, humano y subflujo; recuperación semántica de prompts/skills; generación de flujos; ejecución dinámica con `StateGraph`; streaming e interrupciones humanas.

Sin embargo, el canvas es actualmente el contrato de facto. Eso impide validar antes de ejecutar. Hay además pérdidas de significado entre UI y motor: `variableName` en UI frente a `var_name` en engine; el nodo condición muestra `condition` pero el engine evalúa `properties.prompt`; al ejecutar se descartan etiquetas/handles de edges, por lo que una rama True/False depende del orden; las tools se capturan como texto pero el engine solo expone mocks; subflow es un placeholder. FlowArchitect debe ser el lugar donde ese significado se hace explícito y se compila de forma determinista.

## Experiencia del usuario

No debe abrirse con un canvas. La pantalla es una sala de arquitectura con cuatro zonas persistentes:

1. **Conversación y brief.** El usuario expresa la intención. El asistente pregunta solo por incertidumbres que cambian la arquitectura: disparador, datos, resultado, permisos, SLA, riesgo y participación humana.
2. **Blueprint navegable.** Un mapa lógico compacto, no el canvas final. Muestra etapas, decisiones, contratos y rutas de fallo. Cada elemento enlaza a la evidencia del brief que lo originó.
3. **Panel de calidad.** Contratos, cobertura de fallos, seguridad, observabilidad, coste/latencia estimados y preguntas todavía bloqueantes.
4. **Laboratorio.** Casos de prueba, simulación paso a paso y resultado esperado. Nunca llama a herramientas externas en modo simulación.

El CTA cambia según el estado: `Completar requisitos`, `Resolver riesgos`, `Simular`, `Revisar cambios` y, solo cuando no haya bloqueos críticos, `Abrir en Builder`.

### Estados del ciclo de vida

| Estado | Significado | Acción permitida |
|---|---|---|
| `draft` | intención todavía incompleta | conversar y editar |
| `discovery` | hay decisiones arquitectónicas pendientes | responder, aceptar supuestos o posponer |
| `designed` | blueprint consistente, sin validación completa | inspeccionar y modificar |
| `blocked` | falta un dato, credencial, política o decisión humana | resolver bloqueo |
| `validated` | contratos y reglas estructurales válidos | simular |
| `simulated` | los escenarios mínimos han pasado | publicar al Builder |
| `published` | existe una versión inmutable del Builder Flow | abrir, crear una revisión o ejecutar |
| `runtime-drift` | el Runtime/Builder se apartó de la especificación | comparar, aceptar o reconciliar |

Los cambios no regeneran todo el diseño: se muestran como un diff de requisitos → elementos afectados → contratos/escenarios que deben revalidarse.

## Modelo intermedio: Architecture Spec (IR)

El producto necesita tres formatos distintos y versionados. Ninguno debe reutilizar directamente el JSON de React Flow.

```text
ArchitectureSpec v1   = intención y significado de negocio
BuilderFlow v1        = presentación y configuración visual consumida por Builder
RuntimeGraph v1       = topología LangGraph y ejecutables autorizados
```

`ArchitectureSpec` es la fuente de verdad. Una versión mínima:

```json
{
  "schema_version": "architect/v1",
  "id": "arch_...",
  "revision": 3,
  "intent": {"goal": "...", "success_criteria": ["..."]},
  "requirements": {"trigger": "manual|event|schedule", "assumptions": [], "constraints": []},
  "state_contract": {"input": {"$ref": "#/schemas/Input"}, "shared": {}, "output": {}},
  "steps": [
    {"id": "extract", "kind": "agent", "capability": "document.extract", "input": "Input.document", "output": "Invoice", "policy": {"model_profile": "structured"}},
    {"id": "route_amount", "kind": "decision", "expression": "Invoice.amount > 1000", "outputs": ["approval", "persist"]}
  ],
  "transitions": [
    {"from": "extract", "to": "route_amount", "mode": "success"},
    {"from": "route_amount", "to": "approval", "when": "true"}
  ],
  "failure_policy": {"retry": {}, "dead_letter": {}, "human_escalation": {}},
  "test_suite": [],
  "provenance": []
}
```

Cada paso debe tener `kind`, entrada/salida tipadas, responsable, efecto lateral, idempotency key, timeout, retry policy, nivel de riesgo, observabilidad y origen (`requirement_id`, decisión del usuario o recomendación del agente). Las transiciones codifican condiciones, handles y semántica de join; no las infieren por posición.

### Contrato de datos y estado de Runtime

Los contratos se expresan como JSON Schema/Pydantic y se validan en los límites. Una transición solo es válida si la salida del origen satisface la entrada del destino, o si existe un transform explícito.

El runtime debe adoptar un estado canónico, en lugar de usar `messages/context/variables` como un contenedor implícito:

```python
RuntimeState = {
  "run": {"id": str, "attempt": int, "idempotency_key": str},
  "input": dict,
  "artifacts": dict,
  "variables": dict,
  "messages": list,
  "control": {"route": str | None, "waiting_for": str | None},
  "trace": list
}
```

`messages` deja de ser el canal de datos entre agentes. Los agentes devuelven artefactos estructurados; un parser/validador los comprueba antes de exponerlos al siguiente nodo.

## Agentes de FlowArchitect

Son especialistas de diseño, no agentes que ejecutan el proceso del cliente:

| Agente | Entrada | Salida |
|---|---|---|
| Discovery | intención y contexto | preguntas mínimas y Requirement Map |
| Decomposer | requisitos aprobados | etapas, decisiones, paralelismo y límites |
| Capability matcher | etapa + búsqueda semántica actual | skill/prompt/tool propuesto y alternativa |
| Contract designer | pasos y esquemas | input/output schemas y transforms |
| Reliability auditor | spec | fallos, retries, compensaciones, HITL y alertas |
| Security reviewer | datos, tools y destinos | clasificación, mínimo privilegio y redacción |
| Test designer | spec | happy path, negativos, regresión y caos |
| Compiler | spec validada | BuilderFlow y RuntimeGraph deterministas |

La IA puede proponer y explicar; un compilador con reglas fijas crea el `BuilderFlow`. Ningún agente publica ni ejecuta por sí solo. Las elecciones de tool/model/credencial requieren confirmación cuando tengan coste, permiso o exposición de datos.

## Validación y casos límite

El validador debe bloquear publicación por: IDs duplicados, nodos inalcanzables, ciclo no acotado, ruta sin fin, rama de decisión sin cobertura, schema incompatible, output obligatorio ausente, side effect sin idempotencia, secreto en prompt, tool sin permiso o HITL sin criterio de reanudación.

La auditoría genera problemas accionables, no solo una puntuación. Ejemplos: evento duplicado; LLM devuelve JSON inválido; archivo vacío/corrupto; timeout, 429 y 5xx; aprobación vencida; reintento que duplica un correo; concurrencia que pisa el mismo registro; bifurcación que llega a un join incompleto; fallback de modelo que cambia el schema; y subflujo con contrato incompatible.

El `Architecture Score` es una vista, no un permiso implícito: 25% contratos, 25% resiliencia, 20% seguridad, 15% observabilidad y 15% pruebas. Todo bloqueo crítico prevalece sobre el score.

## Simulación y pruebas

La simulación interpreta el `ArchitectureSpec`, con adaptadores falsos, reloj controlado y semillas repetibles. Para cada escenario muestra ruta, valores enmascarados, artefactos, decisión y resultado esperado/real.

Mínimo por flujo: un happy path, un dato inválido, un error recuperable, un error terminal y una prueba de duplicado/idempotencia. Para decisiones LLM, se prueban respuestas estructuradas válidas, inválidas y de baja confianza. Para cada publicación, guardar los fixtures, versión de spec y resultados; el Runtime puede convertir ejecuciones reales anonimizadas en candidatos de regresión con consentimiento.

## Integración con el Builder existente

FlowArchitect publica una revisión inmutable mediante `POST /architectures/{id}/publish`. El backend valida, compila y responde:

```json
{
  "architecture_revision": 3,
  "builder_flow": {"schema_version": "builder/v1", "nodes": [], "edges": [], "viewport": {}},
  "runtime_graph_ref": "rg_...",
  "validation_report": {"blocking": [], "warnings": []}
}
```

El Builder ya acepta `templateFlow`, `restoreFlow` e inyecciones. Debe abrir una vista de previsualización y ofrecer explícitamente: reemplazar canvas, insertar como subflow o comparar. Una publicación nunca debe sobrescribir silenciosamente el trabajo local.

El adaptador `ArchitectureSpec → BuilderFlow` asigna posiciones solo para legibilidad; conserva los metadatos de arquitectura en `data.architect` y añade `architecture_revision`. El Builder reporta cambios manuales como `BuilderPatch`; FlowArchitect los clasifica en cambios cosméticos, configuración segura o drift semántico.

## Compilación LangGraph

El compilador debe emitir nodos y rutas explícitas desde `RuntimeGraph`, no reconstruir la semántica a partir de un canvas.

- Un `decision` determinista se compila como router sobre una expresión validada. La clasificación por LLM es un tipo distinto (`classifier`) y exige schema, umbral de confianza y fallback.
- Un `human_gate` usa `interrupt_before`, devuelve `waiting_for` y conserva el ID del paso pendiente; al reanudar, valida el payload humano contra su contrato.
- Un `subflow` es un grafo compilado con interfaz versionada (`input_schema`, `output_schema`, `error_contract`), no un mensaje de placeholder.
- Un `tool` se resuelve desde un registro de capacidades, con credenciales por referencia, allowlist y política de red. No se crean tools mock en producción.
- Los ciclos necesitan `max_iterations`, condición de salida y métrica; los side effects usan idempotency key y, si aplica, compensación.
- Los joins declaran estrategia (`all`, `any`, `quorum`) y reducer para evitar escrituras concurrentes ambiguas.

Antes de activar el runtime, el backend compara el `RuntimeGraph` compilado contra la revisión de Architecture Spec y firma su manifest.

## Cambios prioritarios al código actual

1. Preservar `edge.label`, `sourceHandle` y `targetHandle` al llamar `/engine/run`; hoy se omiten en los caminos de ejecución y la condición termina usando orden implícito.
2. Unificar el schema de nodo. Por ejemplo, traducir de `data.variableName` a `properties.var_name`, y de `data.condition` a una expresión/`properties.prompt` explícita. Idealmente, eliminar esa traducción dispersa con `BuilderFlow v1`.
3. Hacer que `/engine/run` devuelva `pending_node` y `resume_contract`; la UI ya lo intenta mostrar pero el motor solo devuelve `thread_id`.
4. Respetar `llm_model` o declarar claramente un `model_profile`; actualmente el motor debe evitar forzar un modelo distinto del solicitado sin indicarlo.
5. Convertir `tools` de texto libre a IDs de capability; el runtime no debe activar herramientas mock en producción.
6. Aplicar schema validation antes/después de cada paso y persistir checkpointer/trazas fuera de memoria del proceso para que `resume` sobreviva a un reinicio.
7. Separar nodos de presentación (`postIt`, dibujo, regla) de BuilderFlow ejecutable. No deben llegar jamás al compilador.

## Componentes UI

`ArchitectWorkspace`, `DiscoveryConversation`, `RequirementMap`, `BlueprintTree`, `ContractInspector`, `ReliabilityPanel`, `ScenarioLab`, `DecisionProvenanceDrawer`, `ValidationGate`, `PublishDiffModal`, `RuntimeTraceViewer` y `DriftResolver`.

En Builder, añadir `ArchitectureBadge`, `ContractPorts`, `RouteLabel`, `HumanGatePanel`, `RunInspector` y `ArchitectureDiffDrawer`. El canvas sigue siendo libre, pero cada nodo publicado expone su contrato y su origen.

## Roadmap técnico

### MVP (4–6 semanas)

ArchitectureSpec v1; discovery guiado; generador de blueprint; compilador a BuilderFlow; validación estructural; preview/reemplazo explícito en Builder; preservación de labels de edges; cinco simulaciones deterministas; versionado de revisiones.

### V1

Contratos JSON Schema completos; registro de capabilities; auditoría de confiabilidad y seguridad; HITL con contratos; subflows reales; trazas persistentes; diff y reconciliación Builder ↔ Architect; pruebas de regresión.

### V2

Optimización por datos de producción; coste/latencia estimados; políticas organizacionales; colaboración y aprobaciones; generación de observabilidad; chaos testing programado; marketplace interno de blueprints/capabilities.

## Métrica de éxito

Medir tiempo de idea a primera ejecución válida, porcentaje de publicaciones que pasan simulación, fallos detectados antes de Runtime, reanudaciones HITL exitosas, tasa de drift y tasa de regresión tras cambios. El indicador principal no es “nodos generados”: es el porcentaje de flujos que llegan a Runtime con contratos, pruebas y rutas de fallo definidas.

# Especificación de implementación detallada

Esta sección convierte la visión anterior en un contrato de implementación. No es opcional, no es una lista de ideas y no debe reducirse a un generador de nodos. Todo componente, endpoint y flujo descrito aquí existe para que FlowArchitect pueda ser una fuente de verdad verificable antes de que Builder o Runtime ejecuten un flujo.

## 1. Alcance, límites y principios obligatorios

### 1.1 Alcance de FlowArchitect

FlowArchitect debe:

- convertir una intención en requisitos estructurados;
- descubrir datos faltantes que tengan impacto arquitectónico;
- proponer una arquitectura trazable y modificable;
- tipar el estado y los contratos de cada transición;
- auditar riesgos técnicos, operativos, de datos, IA y negocio;
- simular escenarios sin usar efectos externos reales;
- crear una revisión inmutable de arquitectura;
- compilar esa revisión a un BuilderFlow que el Builder pueda mostrar y editar;
- compilar esa misma revisión a un RuntimeGraph que LangGraph pueda ejecutar;
- conservar la relación entre requisito, decisión, nodo, arista, prueba y ejecución;
- detectar y reconciliar diferencias introducidas posteriormente en Builder.

### 1.2 Límites de FlowArchitect

FlowArchitect no debe:

- exportar a n8n, Make, Zapier u otra plataforma competidora;
- guardar secretos, tokens, claves API o contraseñas en un prompt, JSON de flow, fixture, log o traza;
- ejecutar una capability real mientras está descubriendo, validando o simulando;
- publicar o ejecutar un flujo porque un LLM lo haya sugerido;
- deducir una ruta True o False a partir de la posición visual de un edge, el orden de creación o el orden de una lista;
- reemplazar silenciosamente un canvas que tenga cambios locales;
- ocultar una incompatibilidad de schemas convirtiendo datos implícitamente;
- considerar un score como autorización para ignorar un error crítico.

### 1.3 Invariantes de plataforma

1. ArchitectureSpec v1 es la fuente de verdad del significado de negocio.
2. BuilderFlow v1 es la fuente de verdad de la representación editable del Builder.
3. RuntimeGraph v1 es la fuente de verdad de lo que compila y ejecuta LangGraph.
4. Una ejecución siempre tiene una sola revisión publicada y un manifest hasheado.
5. Cada efecto externo tiene timeout, idempotencia, política de retry y ruta de fallo.
6. Cada dato que cambia de forma o tipo tiene un transform explícito.
7. Cada pausa humana tiene contrato de reanudación, responsable, vencimiento y evento de auditoría.
8. Cada arista ejecutable tiene una semántica explícita y persistida.
9. Cada recomendación de IA debe declarar si proviene de evidencia del usuario, de una inferencia o de una suposición.
10. Una revisión publicada no se edita. Se crea una revisión nueva.

## 2. Usuarios, permisos y responsabilidades

| Rol | Puede hacer | No puede hacer sin elevación |
|---|---|---|
| Autor de flujo | crear borradores, responder discovery, editar requisitos, simular | publicar en entornos protegidos, administrar credenciales |
| Arquitecto | modificar blueprint, contratos, políticas y pruebas | cambiar políticas organizacionales o secretos |
| Operador | iniciar runs y ver trazas autorizadas | editar una revisión publicada |
| Aprobador humano | responder una tarea HITL asignada | modificar el flujo o ver datos no autorizados |
| Administrador de workspace | registrar capabilities, permisos y retención | leer el valor de secretos en vault |
| Auditor | leer revisiones, eventos y evidencia redactada | ejecutar, publicar o alterar registros |

Permisos mínimos de dominio: architecture:create, architecture:edit, architecture:publish, builder:edit, builder:publish, run:start, run:resume, capability:manage, credential:bind, audit:read. Los permisos se comprueban en backend, nunca solo en la UI.

## 3. Recorridos de usuario completos

### 3.1 Crear un flujo desde una idea

1. El usuario pulsa Crear arquitectura y escribe una descripción libre.
2. FlowArchitect crea una arquitectura en estado draft y extrae únicamente hechos explícitos. No inventa tools, modelos ni nodos.
3. Discovery clasifica la información ya disponible en objetivo, trigger, inputs, outputs, reglas, restricciones, sistemas, roles humanos y criterios de éxito.
4. El sistema calcula incertidumbres arquitectónicas y formula una sola pregunta de mayor valor informativo. Ejemplo: antes de preguntar el modelo LLM, debe preguntar qué dato entra o qué resultado es válido.
5. El usuario responde, acepta una suposición propuesta o marca una decisión como pendiente.
6. Tras cada respuesta, el sistema muestra un diff del Requirement Map y del Blueprint: qué cambió, qué pasos aparecieron, qué test dejó de ser válido y qué riesgos se abrieron/cerraron.
7. Cuando no existan preguntas bloqueantes, el sistema genera ArchitectureSpec preliminar en estado designed.
8. El usuario inspecciona el blueprint, modifica decisiones o acepta sugerencias. Todas las sugerencias muestran rationale y provenance.

### 3.2 Resolver una ambigüedad

Una ambigüedad nunca debe resolverse mediante una pregunta genérica del tipo “¿quieres más detalles?”. El agente debe especificar:

- la decisión que está bloqueada;
- las opciones que cambian el diseño;
- la consecuencia de cada opción;
- el supuesto reversible recomendado, si es seguro;
- los nodos, policies y tests que serán afectados.

Ejemplo: “No está definido si una factura duplicada debe ignorarse, actualizarse o enviarse a revisión. Esa decisión cambia la idempotencia, la ruta de error y los escenarios de prueba. Recomiendo enviar a revisión hasta que exista una clave de deduplicación aprobada.”

### 3.3 Validar y simular

1. El usuario pulsa Validar.
2. El validador ejecuta reglas deterministas sin usar modelos ni capabilities externas.
3. Cada finding se agrupa por severidad, paso afectado y acción posible: corregir manualmente, aplicar patch propuesto, posponer con excepción aprobada o abrir evidencia.
4. Si existen bloqueos, Publicar queda deshabilitado.
5. Si no existen bloqueos, el usuario abre Scenario Lab.
6. Scenario Lab ofrece una suite mínima creada automáticamente y permite agregar fixtures.
7. Cada simulación corre contra adaptadores fake, un reloj controlado y una seed guardada.
8. El resultado muestra valores de entrada/salida redactados, ruta tomada, retries, pausas, asserts y diferencias con la expectativa.
9. Un flujo solo pasa a simulated si la suite mínima requerida aprueba.

### 3.4 Publicar al Builder

1. El usuario con permiso solicita publicar una revisión exacta.
2. El backend verifica versión, permisos, findings bloqueantes, pruebas mínimas, disponibilidad de capabilities y referencias de credencial requeridas.
3. Compiler genera BuilderFlow v1 y RuntimeGraph v1 de forma determinista.
4. El backend guarda hashes, reportes, manifest y provenance.
5. Builder recibe una previsualización con tres opciones obligatorias: reemplazar canvas, insertar como subflow o comparar.
6. Reemplazar requiere confirmación y crea un snapshot recuperable del canvas local.
7. Insertar como subflow crea un nodo con la interfaz versionada del flujo publicado.
8. Comparar muestra cambios semánticos, no solo posiciones o texto.

### 3.5 Volver desde Builder con cambios

1. Builder detecta una edición de un nodo con provenance de Architect.
2. Crea un BuilderPatch que describe el cambio.
3. Patch Classifier lo marca como visual, configuración no semántica, semántico compatible o drift.
4. Cambios visuales no invalidan pruebas. Cambios de modelo/prompt pueden requerir revalidación. Cambios de edge, schema, policy, capability o ruta siempre invalidan validación/simulación.
5. FlowArchitect muestra la reconciliación: aceptar cambio en la ArchitectureSpec, rechazar/revertir en Builder o bifurcar una arquitectura nueva.

## 4. Módulos de interfaz y comportamiento exacto

### 4.1 ArchitectWorkspace

Tiene barra superior con nombre, workspace, revisión, autor de última modificación, estado, botón Validar, botón Simular, botón Publicar y menú de historial. Debe advertir edición concurrente antes de sobrescribir una revisión base distinta.

Las columnas son redimensionables y persistentes por usuario:

- izquierda: DiscoveryConversation y RequirementMap;
- centro: BlueprintTree o vista gráfica compacta;
- derecha: ValidationGate, ReliabilityPanel y ScenarioLab.

En pantallas pequeñas se convierte en tabs, sin ocultar la existencia de problemas bloqueantes.

### 4.2 DiscoveryConversation

Cada mensaje de la IA tiene una etiqueta: Pregunta, Confirmación, Suposición, Riesgo, Recomendación o Explicación. Cada declaración estructurada expone el requisito que creará o modificará. El usuario puede editar directamente un dato extraído sin reescribir la conversación.

El modelo no debe ofrecer una secuencia de preguntas larga. Usa el siguiente orden de prioridad: trigger y entrada; resultado y criterio de éxito; reglas de negocio; efectos externos; datos sensibles; aprobación humana; fiabilidad y observabilidad; optimización de modelo/coste.

### 4.3 RequirementMap

Contiene categorías fijas:

- objetivo;
- no objetivos;
- trigger;
- entradas;
- salidas;
- reglas de negocio;
- datos y clasificación;
- capabilities/sistemas;
- usuarios y aprobadores;
- resiliencia;
- observabilidad;
- seguridad y cumplimiento;
- criterios de éxito;
- supuestos;
- decisiones pendientes.

Cada requisito tiene id estable, texto, tipo, estado confirmado/inferido/pendiente/rechazado, fuente, autor, timestamp, riesgo e impacto. No se debe borrar un requisito utilizado por pasos activos; el sistema debe proponer retirar o modificar los elementos dependientes.

### 4.4 BlueprintTree

Muestra la ruta feliz y, a la misma altura, los fallos relevantes. Cada tarjeta incluye:

- nombre y kind;
- input/output contract;
- capability/model profile si aplica;
- timeout/retry;
- riesgo de datos;
- cantidad de tests asociados;
- provenance;
- estado de validación.

Se puede plegar una etapa, pero nunca ocultar que tiene fallos o un human gate en su interior.

### 4.5 DecisionProvenanceDrawer

Al seleccionar un paso o edge responde cuatro preguntas: qué hace, por qué existe, de qué requisito proviene y qué cambia si se elimina. Debe listar pasos downstream, schemas, policies y pruebas afectados. Si la recomendación procede de IA, explica confianza y alternativas.

### 4.6 ReliabilityPanel

Organiza findings por Input, Dependency, Model, Business Rule, Concurrency, Security, Observability y Human Workflow. Cada finding incluye impacto, probabilidad, severidad, evidencia, ruta actual, remediation y si el usuario ha aceptado un riesgo formalmente.

### 4.7 ScenarioLab

Un escenario tiene nombre, propósito, clase, fixture, overrides de adapter, seed, hora simulada, expected route, expected artifacts, expected events y assertions. Las clases son happy_path, invalid_input, dependency_failure, model_failure, duplicate_event, authorization, concurrency, human_timeout y regression.

No comparar outputs LLM como strings exactos cuando la tarea sea generativa. Para esos casos usar schema, propiedades requeridas, restricciones de contenido, evaluación determinista o fixture de respuesta fake.

## 5. Modelo de dominio completo

### 5.1 Requirement

~~~json
{
  "id": "req_amount_approval",
  "category": "business_rule",
  "statement": "Las facturas superiores a 1000 USD necesitan aprobación financiera.",
  "status": "confirmed",
  "source": {"kind": "user_message", "reference": "message_14"},
  "confidence": 1.0,
  "risk": "high",
  "linked_entities": ["step.route_amount", "step.approve_invoice", "test.high_amount"],
  "created_at": "2026-09-08T10:00:00Z",
  "updated_at": "2026-09-08T10:05:00Z"
}
~~~

### 5.2 Step

~~~json
{
  "id": "extract_invoice",
  "kind": "agent",
  "name": "Extraer datos de factura",
  "description": "Extrae campos estructurados desde un adjunto PDF.",
  "input_bindings": [{"target": "document", "source": "$.input.attachment"}],
  "input_schema_ref": "#/$defs/Document",
  "output_schema_ref": "#/$defs/Invoice",
  "configuration": {
    "capability": "ai.document_extraction",
    "model_profile": "structured_private",
    "output_format": "json_schema"
  },
  "execution_policy": {
    "timeout_ms": 30000,
    "retry": {"max_attempts": 2, "strategy": "exponential", "initial_delay_ms": 500},
    "idempotency_scope": "run"
  },
  "failure_policy": {
    "retryable": ["timeout", "rate_limit", "temporary_dependency"],
    "on_schema_error": "manual_review",
    "on_terminal_error": "dead_letter"
  },
  "security_policy": {
    "data_classification": "confidential",
    "allow_providers": ["approved-private-provider"],
    "redact_paths": ["$.vendor.tax_id"]
  },
  "observability": {"log_input": "redacted", "log_output": "redacted", "metric_tags": ["invoice"]},
  "provenance": [{"requirement_id": "req_extract_fields", "rationale": "Se necesita registrar una factura."}]
}
~~~

### 5.3 Transition

~~~json
{
  "id": "tr_amount_true",
  "from": "route_amount",
  "to": "approval_gate",
  "kind": "route",
  "route": {
    "selector": "true",
    "expression": "artifacts.invoice.amount > 1000"
  },
  "source_handle": "true",
  "target_handle": "input",
  "provenance": [{"requirement_id": "req_amount_approval"}]
}
~~~

Una transición solo puede referirse a IDs existentes. Un source_handle está vinculado a un puerto declarado por el tipo de nodo. Un decision necesita una ruta por cada valor posible; un classifier necesita ruta para cada enum más una ruta de fallback. Una transición de failure no puede compartir implícitamente la política de success.

### 5.4 DataContract

Todo contrato usa JSON Schema 2020-12 o equivalente Pydantic con versión. Debe incluir nombres de artifact estables, clasificación de datos y semántica de ausencia:

- required: el campo debe existir y no puede ser null;
- nullable: puede existir con null;
- optional: puede omitirse;
- unknown: el producer no garantiza su tipo;
- redacted: existe pero no se expone a UI/logs no autorizados.

Ejemplo de Invoice:

~~~json
{
  "$id": "antigravity://schemas/invoice/v1",
  "type": "object",
  "required": ["invoice_number", "vendor", "amount", "currency"],
  "properties": {
    "invoice_number": {"type": "string", "minLength": 1},
    "vendor": {"type": "string", "minLength": 1},
    "amount": {"type": "number", "minimum": 0},
    "currency": {"type": "string", "pattern": "^[A-Z]{3}$"},
    "issue_date": {"type": ["string", "null"], "format": "date"}
  },
  "additionalProperties": false
}
~~~

### 5.5 BuilderFlow

BuilderFlow conserva UI y significado ejecutable, pero mantiene la configuración tipada dentro de config. No debe depender de claves arbitrarias como content, prompt o variableName sin normalización.

~~~json
{
  "schema_version": "builder/v1",
  "id": "flow_123",
  "revision": 4,
  "metadata": {"name": "Facturas", "source": "architect", "architecture_revision_id": "ar_7"},
  "state_contract": {"input_schema_ref": "InboundEmail/v1", "output_schema_ref": "Result/v1"},
  "nodes": [],
  "edges": [],
  "viewport": {"x": 0, "y": 0, "zoom": 1},
  "policies": {"default_timeout_ms": 30000, "default_retry_policy_ref": "retry/default/v1"}
}
~~~

### 5.6 RuntimeGraph

RuntimeGraph es el resultado normalizado. Contiene solo lo necesario para ejecutar: versiones exactas de schemas/capabilities/model profiles, nodos, transitions, reducers, manifest de permisos y hashes. No contiene coordenadas, estilos, post-its ni texto de UI irrelevante.

## 6. Arquitectura de servicios

### 6.1 Frontend

Crear módulos separados:

- architect-api-client: cliente de endpoints con control de revisión;
- architect-store: estado local de draft, selección, diff y estados de loading;
- discovery-ui: conversación y checklist;
- blueprint-ui: árbol, grafo compacto y provenance;
- validation-ui: findings, score, fixes y exclusiones aprobadas;
- simulation-ui: suites, fixtures y playback;
- builder-bridge: abre, compara, inserta subflow y recibe BuilderPatch;
- run-inspector-ui: consume eventos de Runtime y aplica redacción local defensiva.

No mezclar DTO de backend con componentes React. Usar mappers tipados.

### 6.2 Backend

Servicios lógicos:

- ArchitectureService: crear, editar, versionar y publicar ArchitectureSpec;
- DiscoveryService: extraer requisitos, administrar preguntas y provenance;
- PlanningService: generar propuesta de blueprint estructurada;
- ValidationService: ejecutar validadores deterministas;
- SimulationService: correr interpretador con adapters fake;
- CompilerService: ArchitectureSpec a BuilderFlow y RuntimeGraph;
- BuilderIntegrationService: patches, diffs y reconciliación;
- CapabilityRegistryService: catálogo, versiones, scopes y disponibilidad;
- RuntimeService: iniciar, reanudar, detener, checkpoint y emitir eventos;
- AuditService: eventos append-only, acceso y cambios críticos.

Discovery y Planning pueden usar LLM; Validation, Simulation y Compiler deben ser deterministas respecto a una misma revisión y configuración.

### 6.3 Almacenamiento

Usar una base relacional para metadatos, revisiones y permisos; object storage para artifacts grandes; vault para secretos; almacenamiento durable para checkpoints LangGraph; y un sistema de eventos/timeseries para trazas. Todas las tablas de revisión deben tener workspace_id y controles de tenant isolation.

La base debe usar transacciones para publicar: guardar revision, validation report, BuilderFlow, RuntimeGraph, hashes y audit event como una operación lógica. Si el compilador falla, no crear una revisión parcialmente publicada.

## 7. APIs y contratos de error

### 7.1 Crear y editar arquitectura

POST /api/v1/architectures recibe name, initial_intent y context opcional. Devuelve architecture_id, draft_revision_id, requirements detectados y preguntas pendientes.

PATCH /api/v1/architectures/{id}/drafts/{revision} recibe un patch con base_revision. Si base_revision no coincide, devuelve 409 REVISION_CONFLICT junto con diff resumido. Nunca aplica last-write-wins a un spec semántico.

### 7.2 Discovery

POST /api/v1/architectures/{id}/discovery/messages recibe message, base_revision y opcionalmente answered_question_id. Devuelve response, proposed_requirement_changes, proposed_assumptions, pending_questions, blueprint_diff y confidence. La respuesta no puede incluir una decisión publicada ni una credencial.

### 7.3 Validación

POST /api/v1/architectures/{id}/validate recibe revision. Devuelve:

~~~json
{
  "revision": 3,
  "status": "blocked",
  "findings": [
    {
      "id": "VAL-EDGE-001",
      "severity": "blocking",
      "category": "control_flow",
      "entity_ref": "transition.tr_amount_true",
      "message": "La condición no tiene ruta false.",
      "evidence": ["step.route_amount"],
      "suggested_actions": ["add_false_route"]
    }
  ],
  "score": {"contracts": 90, "reliability": 50, "security": 100, "observability": 40, "tests": 20}
}
~~~

### 7.4 Simulación

POST /api/v1/architectures/{id}/simulations recibe revision, suite_id, scenario_ids opcionalmente y overrides explícitos. Rechaza cualquier capability configurada como real. Devuelve run_id y stream de eventos. Cada evento incluye run_id, sequence, simulated_time, node_id, event_type, artifact_summary_redacted y assertion result.

### 7.5 Publicación

POST /api/v1/architectures/{id}/publish recibe revision, expected_content_hash y mode. Rechaza con 422 si quedan findings blocking o falta la suite requerida. Rechaza con 409 si el hash cambió. Devuelve referencias para abrir en Builder y el manifest hash.

### 7.6 Códigos de dominio

400 INVALID_SCHEMA; 401 UNAUTHENTICATED; 403 CAPABILITY_NOT_AUTHORIZED; 404 REVISION_NOT_FOUND; 409 REVISION_CONFLICT; 409 IDEMPOTENCY_CONFLICT; 422 VALIDATION_BLOCKED; 422 SIMULATION_REQUIRED; 423 PUBLISHED_REVISION_IMMUTABLE; 429 DISCOVERY_RATE_LIMIT; 503 MODEL_UNAVAILABLE; 504 CAPABILITY_TIMEOUT.

Los mensajes de error deben informar entidad, regla y remedio seguro, sin filtrar secretos, prompts privados ni datos sensibles.

## 8. Orquestación de agentes de arquitectura

### 8.1 Principio de mínimo agente

No usar un enjambre de LLMs para cada interacción. Activar un especialista solo si reduce incertidumbre material. Los resultados pasan por schemas estrictos y se guardan como propuestas, no como cambios definitivos.

### 8.2 Secuencia

1. Intent Extractor produce hechos y entidades extraídas.
2. Discovery Planner calcula preguntas faltantes.
3. Requirement Normalizer crea requisitos tipados.
4. Blueprint Planner propone pasos y transiciones.
5. Capability Matcher consulta la búsqueda semántica y el registro autorizado.
6. Contract Designer genera contracts/transforms.
7. Reliability Auditor crea findings y failure policies.
8. Security Reviewer revisa clasificación, proveedores, permisos y redacción.
9. Test Designer crea escenarios.
10. Deterministic Validator y Compiler verifican el resultado.

No ejecutar 4 a 9 hasta que trigger, input principal y objetivo de salida tengan suficiente definición. No usar resultados de búsqueda semántica como permiso automático para incluir una capability.

### 8.3 Contrato de salida de un agente

Cada agente devuelve JSON validable con:

- agent_name y version;
- input_revision;
- proposal_type;
- entities/proposals;
- evidence_refs;
- assumptions;
- confidence;
- alternatives;
- risks;
- requires_human_confirmation.

Si no puede producir JSON válido, el resultado no llega a ArchitectureSpec; se convierte en un finding de sistema y se intenta un fallback controlado o se informa al usuario.

### 8.4 Algoritmo de selección de preguntas

Para cada incertidumbre calcular:

Impacto arquitectónico = número de decisiones, pasos, schemas o policies que cambiarían.
Riesgo = sensibilidad de datos, efecto externo, coste o irreversibilidad.
Información disponible = confianza del hecho ya obtenido.
Fricción = número de datos que el usuario debe aportar.

Priorizar alto impacto y alto riesgo con menor fricción. Nunca preguntar por detalles cosméticos antes de resolver datos, salida, efecto externo o política de error.

## 9. Reglas de validación exhaustivas

### 9.1 Topología

- exactamente un start lógico por runtime entrypoint;
- todos los nodos ejecutables son alcanzables desde start;
- todos los caminos llegan a end, error_sink o human gate con vencimiento;
- no hay edges a IDs inexistentes;
- no hay nodos ejecutables desconectados;
- no hay ciclo sin condición de salida y max_iterations;
- cualquier fork tiene estrategia de join o terminales explícitos;
- cualquier join declara all, any o quorum y reducer;
- decision tiene ramas exhaustivas; classifier cubre enum, parse error y baja confianza.

### 9.2 Contratos

- input binding source existe;
- source schema es asignable al target schema;
- required fields se satisfacen;
- transform tiene input/output schema compatible;
- el output de un agent/classifier/tool se valida antes de persistirse;
- ningún schema ambiguo cruza una boundary de seguridad sin aprobación;
- artifacts con mismo nombre y tipos distintos requieren namespace o transform.

### 9.3 Fiabilidad

- capability con side effect tiene idempotency;
- retry solo se permite en errores marcados retryable;
- retry no puede duplicar efecto externo;
- timeout está definido;
- error terminal tiene ruta;
- dead letter incluye datos redactados, tipo de error, run/revision y correlación;
- compensación está declarada si se ejecutan operaciones reversibles en secuencia;
- policy de concurrency está definida para recursos compartidos.

### 9.4 Seguridad

- no hay secreto detectado en texto/configuración;
- capability tiene credential reference compatible;
- provider/model cumple data classification;
- network destination cumple allowlist;
- redaction cubre logs, trace y UI de usuarios no autorizados;
- human approver tiene rol requerido;
- no se usa capability de alto riesgo sin confirmación/publicación autorizada.

### 9.5 Observabilidad y prueba

- cada paso importante tiene nombre, metric tags y evento;
- existe al menos un escenario por ruta de negocio principal;
- existe escenario de input inválido, dependencia fallida, modelo inválido cuando hay IA, duplicado si existe side effect y HITL timeout si existe human gate;
- escenarios tienen assertions, no solo fixtures;
- una modificación semántica invalida escenarios afectados.

## 10. Motor de simulación

### 10.1 Reglas

SimulationService interpreta RuntimeGraph sin llamar providers reales, sistema de correos, base de datos productiva, navegador, filesystem de cliente ni secretos. Todas las capabilities se resuelven contra SimulationAdapters por capability id/version.

### 10.2 Adapters

Cada adapter declara:

- schema de input/output;
- respuesta happy path;
- respuestas por error: timeout, 401, 403, 404, 409, 429, 500, 503;
- latencia simulada;
- side effect ledger en memoria;
- capacidad de inyectar output schema inválido.

El ledger permite probar idempotencia y compensación sin afectar sistemas reales.

### 10.3 Reproducibilidad

Guardar revision, manifest hash, scenario fixture hash, seed, simulated clock, adapter versions y outputs. Un resultado se considera reproducible si una nueva simulación con los mismos valores produce la misma ruta, assertions y eventos estructurales.

### 10.4 Chaos testing

Chaos mode altera una variable por ejecución dentro de límites declarados: caídas de dependency, retraso, orden de events, output inválido, rate limit, duplicado, respuesta humana tardía y concurrent writes. No ejecutar chaos en producción sin una policy explícita posterior.

## 11. Compilación hacia BuilderFlow y RuntimeGraph

### 11.1 Compiler ArchitectureSpec a BuilderFlow

El compilador:

1. valida la ArchitectureSpec;
2. asigna un tipo BuilderNode según kind;
3. crea puertos desde input/output/failure contracts;
4. genera edges con kind, label, source_handle y target_handle;
5. almacena provenance en data.architect;
6. aplica layout legible únicamente como información UI;
7. mantiene IDs estables cuando un paso no ha cambiado semánticamente;
8. nunca agrega un nodo para “rellenar” un canvas.

Layout recomendado: flujo principal de izquierda a derecha; ramas true/false arriba/abajo con etiquetas visibles; error routes debajo de la ruta feliz; human gates en una columna distinta; subflows plegables. Layout no participa en compilación.

### 11.2 Compiler BuilderFlow a RuntimeGraph

Solo se permite para BuilderFlow validado. Primero se elimina metadata UI y se normalizan configs. Después se valida que cada nodo tenga kind/config requerido. Por último se genera manifest con:

- graph nodes y transitions normalizados;
- schema versions;
- capability versions y credential references;
- model profiles;
- execution/failure/security policies;
- reducers;
- runtime entrypoints;
- source revision/hash;
- fecha y compiler version.

### 11.3 Mapeo a LangGraph

| Kind | Resultado en LangGraph |
|---|---|
| start | edge START hacia entrypoint |
| agent | async node que valida bindings, invoca provider y valida output |
| transform | async/sync node puro sin side effect |
| decision | conditional edge con router determinista |
| classifier | node de LLM estructurado más conditional edge enum |
| tool | node que invoca capability autorizada |
| human_gate | interrupt_before y ApprovalTask persistente |
| subflow | wrapper que invoca grafo hijo publicado |
| join | reducer y barrera declarada |
| end | edge hacia END y serializer de output |
| error_sink | persistencia de dead letter y END |

No usar eval para expresiones. Implementar un lenguaje pequeño con paths de artifacts/input, comparadores, booleanos, operaciones numéricas básicas, contains, exists y funciones whitelist. Toda expresión se analiza y valida antes de publicar.

## 12. Integración detallada con el Builder actual

El Builder actual ya dispone de React Flow, templateFlow, restoreFlow e inyecciones. Crear un BuilderBridge que recibe BuilderFlow v1 y no raw ArchitectureSpec.

### 12.1 Inconsistencias que deben corregirse

| Estado actual | Corrección obligatoria |
|---|---|
| Variable UI usa variableName y motor espera var_name | Normalizador BuilderFlow define config.var_name único |
| Condition UI almacena condition y motor lee prompt | Decision config usa expression; classifier usa prompt/output enum |
| Edges enviados sin label/handles | Persistir y enviar kind, label, source_handle y target_handle |
| Tool es texto libre y runtime activa mocks | Selector de capability con ID/version/credential reference |
| Modelo puede ser ignorado por engine | Resolver model_profile y registrar resolución real |
| Subflow responde texto placeholder | Wrapper de flow revision con input/output/error schemas |
| UI espera pending_node no incluido en backend | Runtime devuelve pending_node, approval_task y resume_contract |
| MemorySaver de proceso | checkpoint store durable y run state recuperable |

### 12.2 UI Builder nueva

Añadir ArchitectureBadge, ContractPorts, RouteLabel, NodeInspector tabs, HumanGatePanel, SubflowInterfacePanel, ValidationDrawer, PublishDrawer, ArchitectureDiffDrawer y RunInspector.

El Builder permite editar, pero si un cambio afecta semántica debe marcar el flujo como modified, invalidar publish/simulation y crear BuilderPatch. Los cambios solo de posición/tamaño/estilo no necesitan invalidación.

### 12.3 Datos de ejecución

Builder debe enviar exactamente:

~~~json
{
  "flow_revision_id": "fr_123",
  "input": {},
  "idempotency_key": "optional-key",
  "requested_by": "user_123"
}
~~~

No debe reconstruir nodesData desde componentes locales para ejecutar una revisión publicada. En modo Draft Test puede usar compile dry-run/simulation, pero debe avisar que no representa un runtime publicado.

## 13. Runtime, HITL, trazas y recuperación

### 13.1 Estado de ejecución

El estado serializable mínimo:

~~~python
class RuntimeState(TypedDict):
    run: dict
    input: dict
    artifacts: dict
    variables: dict
    messages: list
    control: dict
    trace_context: dict
~~~

Artifacts guardan datos tipados; variables solo valores simples declarados; messages conservan interacción conversacional cuando sea necesaria; control almacena route, current node, waiting_for, loop counters y cancellation state.

### 13.2 Pausa humana

Al llegar a human_gate:

1. Runtime valida que exista responsable/rol/vencimiento.
2. Crea ApprovalTask durable con payload redactado y resume_contract versionado.
3. Emite human_paused.
4. Compila/usa interrupt_before y guarda checkpoint.
5. Devuelve run_id, thread_id, pending_node, approval_task_id y resume_contract summary.

Al reanudar:

1. autenticar solicitante;
2. confirmar asignación/rol;
3. verificar que no expiró o aplicar política de expiración;
4. validar response contra resume_contract;
5. guardar audit event y actualizar checkpoint;
6. inyectar output humano como artifact tipado;
7. continuar por transition declarada.

### 13.3 Eventos

Emitir eventos append-only, con sequence monotónica por run:

run_started, node_started, input_validated, tool_called, tool_returned, agent_completed, schema_failed, route_selected, node_retried, node_failed, human_paused, human_resumed, subflow_started, subflow_completed, dead_lettered, run_succeeded, run_failed, run_cancelled.

No registrar razonamiento interno del LLM. Registrar resumen seguro, modelo, token/coste si se obtiene, schema status, duration y error class.

## 14. Seguridad, privacidad, cumplimiento y datos

### 14.1 Secretos

Secretos solo llegan al proceso de capability en tiempo de ejecución desde vault. Se referencian con credential_reference_id. No se serializan a BuilderFlow, RuntimeGraph, event payload, logs, cache, fixtures ni frontend.

### 14.2 Clasificación

Niveles: public, internal, confidential, restricted. Cada artifact/schema puede tener classification por campo. La política decide providers/model profiles autorizados, retención, log level y masking. Restricted no puede ir a un provider no autorizado ni a un prompt sin redacción aprobada.

### 14.3 Redacción

Redaction engine aplica paths de schema antes de persistir, transmitir a UI o emitir telemetry. Debe mostrar que un campo fue redactado sin revelar su valor. Agregar tests de detección de patrones de API key, JWT, emails, documentos de identidad y campos configurados de negocio.

### 14.4 Auditoría

Registrar actor, acción, recurso, revisión, IP/sesión cuando corresponda, momento, resultado y reason. Eventos auditables: cambio de policy, asociación de credential, publicación, ejecución, cancelación, respuesta humana, exportación de trace, aceptación de risk exception y reconciliación de drift.

## 15. Matriz de edge cases

| Caso | Detección | Comportamiento obligatorio |
|---|---|---|
| Evento duplicado | idempotency key o fingerprint | retornar run existente o enviar a ruta declarada; nunca duplicar side effect |
| PDF corrupto | adapter/agent schema o parser error | retry solo si policy lo declara; si no, manual review/dead letter |
| LLM devuelve JSON inválido | schema validation | retry estructurado o ruta model_failure; nunca continuar con texto libre |
| LLM baja confianza | threshold | ruta uncertainty o human gate |
| Timeout de capability | timeout policy | retry/backoff o failure route |
| Rate limit | error class 429 | retry con backoff y límites |
| Credencial expirada | capability auth error | detener antes de side effect, alertar a operador |
| Rama sin destino | validator | bloquear publicación |
| Join incompleto | validator/runtime timeout | bloquear o ejecutar policy explícita |
| Aprobación vencida | ApprovalTask expiry | route expired/reject; no reanudar automáticamente |
| Reinicio del servicio | durable checkpoint | recuperar estado y permitir resume |
| Cambio de schema de subflow | version compatibility | bloquear update hasta transform/upgrade explícito |
| Concurrent writes | declared reducer/locking | serializar, usar idempotencia o route conflict |
| Cambio manual en Builder | BuilderPatch | marcar drift, invalidar pruebas afectadas |
| Provider fallback cambia output | output validation | ir a failure route, no degradar contrato |

## 16. Requisitos no funcionales

- Determinismo: validation/compiler/simulation reproducibles para misma revisión, seed y versiones.
- Rendimiento: discovery no bloquea UI; validación de flows normales en menos de dos segundos sin LLM; simulación reporta progreso incremental.
- Disponibilidad: una pausa HITL y ejecución publicada deben sobrevivir reinicio de proceso.
- Observabilidad: cada run se correlaciona con arquitectura, flow revision, manifest hash y usuario.
- Accesibilidad: estados no comunicados solo por color; navegación por teclado en canvas/inspector; labels legibles.
- Internacionalización: contenido de usuario puede estar en español; schemas, IDs y eventos internos mantienen nombres estables.
- Compatibilidad: legacy flows se abren en modo compatible y se migran explícitamente.
- Integridad: publicar usa optimistic concurrency, hashes y transacciones.

## 17. Plan de migración y rollout

### 17.1 Preparación

Inventariar todos los canvas guardados; respaldarlos con timestamp y hash; identificar nodos legacy, edges de condition sin label, variables, tools libres y subflows. No ejecutar migración destructiva.

### 17.2 Adaptador LegacyFlowAdapter

- content se mapea a agent.config.prompt;
- variableName se mapea a variable.config.var_name;
- condition natural se marca como migración pendiente: no se convierte automáticamente en expression;
- tools libres se mapean a unresolved_capabilities;
- edges desde condition sin label se marcan ambiguous_branch;
- post-it/drawing/ruler se preservan como metadata de UI, excluidos de RuntimeGraph.

La publicación de un flow legacy con ambigüedades debe bloquearse y explicar los pasos para migrar. El usuario puede seguir abriendo y editando en modo legacy hasta completar actualización.

### 17.3 Flags de entrega

Activar por feature flags: contracts_v1, semantic_edges, persistent_hitl, flow_publish, run_inspector, architect_discovery, simulation_lab, subflows_v1. Medir errores y migraciones antes de habilitar por defecto en todos los workspaces.

## 18. Pruebas obligatorias

### 18.1 Unitarias

- parse/serialize de ArchitectureSpec, BuilderFlow y RuntimeGraph;
- normalización de todos los node kinds legacy;
- validación de schemas required, nullable, optional y transforms;
- router true/false, enum classifier, parse error, expression inválida;
- idempotencia/retry/backoff;
- redacción de secretos y PII;
- clasificación de BuilderPatch.

### 18.2 Integración

- Architect publica una revisión y Builder recibe BuilderFlow íntegro;
- condition conserva label y handles desde UI hasta Runtime;
- human gate pausa, servicio se reinicia, response válido reanuda;
- subflow con schemas compatibles ejecuta y propaga error contract;
- capability fake simula success, timeout, 429, output inválido y auth failure;
- publicación rechaza schema incompatible, edge ambiguo, cycle ilimitado, secret, capability no autorizada e idempotency ausente.

### 18.3 End to end de referencia

Construir el flujo “factura por email” con PDF válido, importe menor/mayor, archivo inválido, API timeout, evento duplicado y aprobación vencida. Debe atravesar discovery, validate, five simulations, publish, Builder preview, Runtime start, HITL resume tras reinicio y Run Inspector.

### 18.4 Seguridad

Buscar secretos deliberadamente sembrados en prompt, config, input, output y logs. El test debe fallar si cualquier valor secreto llega a respuesta de API, UI, trace persistido o error. Probar un usuario sin rol de aprobador, una capability sin scope, una credencial expirada y un proveedor de modelo no permitido por clasificación.

## 19. Criterios de aceptación finales

El producto no está terminado hasta que se cumpla todo:

1. Una condición con True y False llega correctamente al destino especificado en Builder y Runtime.
2. Un flujo no puede publicarse con rutas ambiguas, nodes inalcanzables, schemas incompatibles, loops ilimitados, secretos, capability no autorizada o side effect no idempotente.
3. Cada nodo ejecutable expone contrato, policy de error, provenance y estado de validación.
4. Cada run permite identificar revisión, manifest hash, capability/model version, ruta, resultado, retries y error redactado.
5. Una aprobación HITL valida contrato, rol y vencimiento y sobrevive a reinicio.
6. La simulación mínima cubre happy path, input inválido, dependency failure, model failure cuando aplique y duplicado/idempotencia.
7. ArchitectureSpec puede abrirse en Builder como preview sin borrar canvas local.
8. Un cambio semántico posterior se detecta como drift y obliga a revalidar antes de publicar.
9. Todas las pruebas unitarias, integración, seguridad y E2E definidas pasan en CI.
10. La documentación de API/schema/migración se entrega junto con el código.

## 20. Prompt maestro de implementación autónoma

~~~text
Eres el Director Técnico y Orquestador de Implementación de Antigravity. Debes implementar FlowArchitect como capa nativa entre intención, Builder y Runtime LangGraph. Tu salida no es una propuesta: es código integrado, pruebas verificadas, migraciones seguras y documentación operativa.

CONTRATO ABSOLUTO

1. No exportes a n8n, Make, Zapier ni plataformas externas. La cadena obligatoria es Idea → FlowArchitect → ArchitectureSpec v1 → BuilderFlow v1 → RuntimeGraph v1 → LangGraph Runtime.
2. No uses JSON crudo de React Flow como contrato de ejecución.
3. No publiques ni ejecutes un flujo con findings bloqueantes.
4. No infieras True/False por orden/posición. Todo edge tiene kind, label y handles explícitos.
5. No permitas intercambio de datos sin schema compatible o transform explícito.
6. No guardes secretos en prompts, logs, fixtures, events, JSON de flujo ni frontend.
7. No permitas tools de texto libre ni mocks en producción. Usa un capability registry autorizado.
8. No permitas side effects sin timeout, retry/backoff, idempotency y failure path.
9. No permitas una pausa humana sin task persistente, rol, expiry y resume_contract validado.
10. No declares una fase terminada sin ejecutar pruebas y registrar evidencia.

OBJETIVOS DE IMPLEMENTACIÓN

Implementa ArchitectureSpec v1, BuilderFlow v1 y RuntimeGraph v1 con schemas compartidos TypeScript/Pydantic. Implementa Discovery, Requirement Map, Blueprint, provenance, validación, Reliability Audit, Security Review, Scenario Lab, publicación, Bridge con Builder, compiler LangGraph, capability registry, HITL persistente, Run Inspector, versionado, diff y drift reconciliation.

CORRECCIONES INMEDIATAS DEL BUILDER

Preserva edge label/sourceHandle/targetHandle hasta Runtime. Normaliza variableName hacia config.var_name. Separa condition determinista de classifier LLM. Devuelve pending_node, approval_task y resume_contract. Respeta model profile/model resuelto. Elimina mocks de tools productivos. Persiste checkpoints/traces. Implementa subflows versionados con contracts.

ENJAMBRE AUTORIZADO

Puedes delegar trabajo paralelo en: schema-contracts; runtime-langgraph; builder-ux; flowarchitect-ux; capabilities-security; quality-verification. El agente principal conserva integración, decisiones de producto y aceptación final.

PROTOCOLO DEL ENJAMBRE

- schema-contracts trabaja primero y publica los contratos compartidos.
- Ningún otro especialista inventa DTO/schema paralelo.
- Cada especialista declara archivos, dependencias, cambios y riesgos antes de editar.
- Cada entrega incluye tests propios y evidencia.
- quality-verification prueba integración total y seguridad, no solo sus archivos.
- Si existe conflicto, prevalecen las reglas del CONTRATO ABSOLUTO.

ORDEN DE IMPLEMENTACIÓN

Fase 0: contratos v1, LegacyFlowAdapter, normalizador, edges semánticos, validación topológica, HITL payload y pruebas de branching/migración.
Fase 1: Contract Inspector, puertos tipados, policies de error, publicación inmutable, checkpoint persistente y Run Inspector inicial.
Fase 2: Discovery completo, blueprint/provenance, publish Architect→Builder, capability registry, subflows, Simulation Lab y drift reconciliation.
Fase 3: regresión, costes/latencias, collaboration/policies organizacionales y chaos testing.

REPORTE POR FASE

Antes de cambiar código, inspecciona repositorio y tests. Expón plan de archivos, contratos y riesgos. Tras cada fase informa: cambios implementados, migraciones, API/schema, validaciones realizadas, resultado de pruebas, limitaciones y siguiente fase. Si falta una decisión humana o existe un conflicto de requisitos, detente, muestra evidencia y solicita decisión. Nunca debilites silenciosamente el contrato.
~~~
