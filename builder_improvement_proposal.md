# Antigravity Builder — propuesta de mejora completa y especificación de implementación

## 1. Decisión de producto

Antigravity Builder no debe ser solamente un canvas donde se conectan prompts. Debe convertirse en el editor visual, validado y operable del ecosistema Antigravity.

Su posición en el producto es:

~~~text
Idea
  ↓
FlowArchitect: entiende, diseña, audita y simula
  ↓
ArchitectureSpec v1
  ↓
Antigravity Builder: representa, permite ajustar, valida y publica
  ↓
BuilderFlow v1 y RuntimeGraph v1
  ↓
LangGraph Runtime: ejecuta, pausa, reintenta y deja trazas
~~~

Builder debe servir a dos tipos de usuario sin crear dos productos:

- usuario que llega desde FlowArchitect con una arquitectura ya validada;
- usuario experto que quiere construir o modificar directamente un flujo visual.

En ambos casos, el resultado debe ser el mismo: una revisión publicada, tipada, reproducible y segura. El canvas es una interfaz, no el contrato ejecutable.

## 2. Diagnóstico concreto del Builder compartido

### 2.1 Activos existentes que deben conservarse

El Builder actual ya tiene capacidades valiosas:

- canvas construido sobre React Flow;
- tipos visuales de nodo: main prompt, action, lógica, traducir, editar, variable, condición, humano y subflujo;
- paneles de biblioteca de agentes y prompts;
- búsqueda semántica sobre prompts y skills;
- generación de flujos por IA;
- propiedades editables de nodo y sugerencias por IA;
- guardado local y endpoints de flows;
- ejecución de un grafo dinámico mediante LangGraph StateGraph;
- streaming de eventos y resaltado visual de nodos;
- intención de human-in-the-loop y reanudación.

La propuesta no reemplaza estos activos. Los reorganiza alrededor de contratos confiables.

### 2.2 Problemas técnicos observados

| Área | Estado actual | Riesgo | Corrección de diseño |
|---|---|---|---|
| Semántica de nodo | La UI y el engine usan claves diferentes, por ejemplo variableName frente a var_name y condition frente a prompt | El usuario configura una cosa y Runtime interpreta otra | BuilderFlow v1 con config tipado y un normalizador central |
| Condiciones | Los handles muestran True/False, pero la ejecución puede enviar edges sin labels/handles | Ruta incorrecta o no determinista | Edge semántico persistido desde canvas hasta Runtime |
| Datos | Variables y output schema son texto libre | Conexiones inválidas y fallos silenciosos | JSON Schema/Pydantic y Contract Inspector |
| Tools | El campo tools es texto libre y el runtime activa tools mock ante cualquier valor | Seguridad y expectativa falsa de ejecución | Capability Registry con IDs/versiones/credenciales por referencia |
| Modelos | Un nodo puede capturar llm_model, pero Runtime puede forzar otro modelo | Configuración no transparente | Model profile y registro de modelo resuelto/fallback |
| Human-in-the-loop | La UI intenta mostrar pending_node, pero el engine no entrega el contrato completo | Pausas difíciles de entender o reanudar | ApprovalTask persistente y resume_contract |
| Subflow | El nodo visual existe, pero Runtime devuelve un texto placeholder | No hay reutilización real | Subflow publicado, versionado y tipado |
| Persistencia | Canvas depende en parte de localStorage y checkpoints en memoria de proceso | Pérdida de trabajo, ejecuciones no recuperables | Draft/revision store y checkpoint durable |
| Ejecución | Hay rutas de ejecución que mapean nodos/edges de manera distinta | Drift entre vista y Runtime | Un solo pipeline Compile → Publish → Run |
| Observabilidad | El resultado privilegia el último mensaje | Difícil depurar un flujo | Run Inspector con timeline, rutas y artifacts redactados |

### 2.3 Principio correctivo

El Builder debe dejar de convertir componentes React directamente en payload de LangGraph. La secuencia correcta es:

~~~text
React Flow Canvas
  ↕
BuilderFlow v1 validado
  ↓
Compiler determinista
  ↓
RuntimeGraph v1 hasheado
  ↓
LangGraph
~~~

## 3. Objetivos y no objetivos

### 3.1 Objetivos obligatorios

1. Hacer visible el significado de cada nodo, puerto y arista.
2. Detectar incompatibilidades antes de ejecutar.
3. Mantener ruta de negocio, rutas de error y decisiones explícitas.
4. Publicar revisiones inmutables y ejecutar solo revisiones publicadas.
5. Poder pausar y reanudar un flujo humano tras reiniciar el servicio.
6. Permitir subflows reutilizables con contratos.
7. Hacer trazable una ejecución de principio a fin.
8. Preservar compatibilidad con canvas existentes mediante migración explícita.
9. Integrarse con FlowArchitect sin sobrescribir trabajo local.
10. Seguir permitiendo composición visual libre, pero sin permitir publicación peligrosa.

### 3.2 No objetivos

- No construir exportadores para plataformas externas.
- No usar el canvas como una superficie para ejecutar código arbitrario.
- No guardar secretos dentro de nodos.
- No sustituir procesos críticos por prompts sin schemas y policies.
- No forzar al usuario básico a conocer todos los controles avanzados de LangGraph.
- No ocultar warnings críticos detrás de una puntuación o una animación atractiva.

## 4. Estados del Builder y transiciones

### 4.1 Estado del flujo

| Estado | Significado | Acciones disponibles |
|---|---|---|
| new_draft | Canvas nuevo sin origen | editar, guardar, validar |
| imported_legacy | Canvas heredado sin migrar por completo | editar en modo compatible, migrar, no publicar si es ambiguo |
| architect_preview | BuilderFlow recibido desde FlowArchitect sin aplicar | comparar, insertar, reemplazar, descartar |
| draft_dirty | Borrador con cambios no validados | guardar, validar, simular |
| validation_blocked | Existen errores bloqueantes | corregir, ver evidencia, aplicar patch sugerido |
| validation_warning | Sin bloqueos, con warnings | simular, publicar con decisión documentada |
| simulation_required | Cambio semántico invalidó escenarios | simular |
| simulation_passed | Suite requerida aprobada | publicar |
| publishing | Backend compila y firma manifest | esperar o cancelar antes de commit final |
| published | Existe una Flow Revision inmutable | ejecutar, duplicar, comparar, crear borrador |
| runtime_drift | Runtime o Builder difiere de base Architect | reconciliar, bifurcar, revertir patch |
| archived | Flujo retirado | leer, duplicar, restaurar por policy |

### 4.2 Estado de un nodo

Cada nodo ejecutable debe exponer estado separado del flow:

- unconfigured: falta configuración requerida;
- invalid: no cumple schema/policy;
- warning: válido pero con riesgo no bloqueante;
- valid: configuración y contratos correctos;
- simulated: pasó escenarios asociados;
- published: pertenece a revisión publicada;
- running: ejecutándose en un run activo;
- paused: esperando input humano;
- succeeded: último run terminó correctamente;
- failed: último run falló;
- drifted: cambió respecto de Architect.

No usar color como única señal. Incluir icono, tooltip, texto y navegación por teclado.

## 5. Arquitectura de información y UX completa

### 5.1 Estructura visual

La aplicación tiene cinco regiones:

1. Barra superior de flujo: nombre, origen, estado, revisión, historial, Validar, Simular, Publicar y Ejecutar.
2. Biblioteca izquierda: nodos, capabilities, prompts, agentes, subflows y templates.
3. Canvas central: representación visual, minimapa y controles de navegación.
4. Inspector derecho: configuración, datos, errores, seguridad, pruebas, ejecuciones y provenance.
5. Bandeja inferior opcional: Run Inspector, consola segura, resultados de simulación y findings.

El usuario puede ocultar regiones, pero cuando hay blockers deben permanecer accesibles por un indicador permanente.

### 5.2 Primer contacto

Al crear un canvas, preguntar:

- ¿Quieres iniciar en blanco, desde FlowArchitect, desde template o desde subflow?
- Si inicia en blanco, mostrar un Start node y una guía breve sobre contratos y rutas.
- Si llega desde FlowArchitect, abrir primero la comparación, no aplicar automáticamente.
- Si importa legacy, abrir Migration Assistant y no ocultar ambigüedades.

### 5.3 Canvas semántico

Cada nodo tiene puertos declarados. Ejemplos:

- Agent: input, success, failure.
- Decision: input, true, false, failure.
- Classifier: input, una salida por enum, uncertain, failure.
- Tool: input, success, timeout, auth_error, failure.
- Human Gate: input, approve, reject, expired.
- Fork: input, branch_1..N.
- Join: input_1..N, success, timeout/failure.
- Subflow: input, success, failure.

Al arrastrar desde un puerto, el canvas filtra visualmente los targets incompatibles. Si el usuario intenta conectar dos schemas incompatibles, no crea la arista; abre una propuesta de transform con preview.

### 5.4 Comandos rápidos

El command menu permite:

- añadir nodo por capability o tipo;
- insertar transform entre dos nodos;
- convertir una condición en classifier y viceversa cuando sea permitido;
- agrupar una selección en subflow candidato;
- generar tests para selección;
- ejecutar simulación desde nodo seleccionado;
- abrir historial/diff;
- centrar rutas de failure;
- crear comentario no ejecutable.

No debe ejecutar IA ni reconfigurar nodos sin mostrar primero un diff.

### 5.5 Modo documento

Además del canvas, proporcionar una vista estructurada:

~~~text
Trigger
  └── Validar entrada
        ├── Error → Dead letter
        └── Válido → Extraer factura
                     ├── Schema inválido → Manual review
                     └── Válido → ¿Importe > 1000?
                                      ├── Sí → Aprobar
                                      └── No → Guardar
~~~

La vista documento es la forma predeterminada para revisar lógica y accesibilidad. Debe respetar las mismas entidades y no crear un modelo paralelo.

## 6. Taxonomía de nodos y contratos detallados

### 6.1 Start

Representa un entrypoint, no un prompt. Configuración: trigger type, input schema, idempotency extractor, authentication policy si recibe webhook, rate limit, metadata de origen. Un flow puede tener varios entrypoints solo si RuntimeGraph declara separadamente cada uno; cada ejecución elige uno.

### 6.2 Agent

Configura una operación de IA con contrato:

- propósito y nombre;
- system instruction versionada;
- input bindings;
- model_profile y provider policy;
- output schema obligatorio;
- temperatura/max tokens solo si el model profile permite override;
- herramientas autorizadas por capability ID;
- timeout/retry/failure policy;
- clasificación de datos;
- evaluación de salida.

El Agent no transmite respuestas libres al siguiente nodo si su output schema exige JSON. Debe usar parser/validator y en caso de fallo ir a la ruta declarada.

### 6.3 Transform

Es una operación pura y explícita. Tipos iniciales: rename_fields, map_fields, parse_number, parse_date, normalize_currency, redact, filter, flatten, merge, split, select, validate_schema. Cada transform tiene input/output schema y una preview con fixture. Transform no puede llamar redes ni LLMs.

### 6.4 Decision

Solo sirve para expresiones deterministas. Configuración: expresión, paths permitidos, enum/bool esperado, ramas declaradas y policy ante evaluation error. Implementar parser seguro; nunca usar eval de Python/JavaScript con contenido de usuario.

Ejemplos válidos:

~~~text
artifacts.invoice.amount > 1000
exists(input.attachments[0])
artifacts.invoice.currency in ["USD", "EUR"]
~~~

### 6.5 Classifier

Usar solo cuando una decisión requiere interpretación. Configuración: prompt de clasificación, input binding, enum de clases, JSON Schema de resultado, confidence threshold, ruta uncertain, provider/model policy, output evaluation y fallback. No permitir que el classifier cree arbitrariamente nuevas ramas.

### 6.6 Tool

Tool es una invocación a Capability Registry. Configuración: capability_id, capability_version, credential_reference_id, input mapping, output mapping, timeout, retry, idempotency, permission scope, network policy y error routes. La UI muestra datos de capability, no el secreto.

### 6.7 Human Gate

Configura un contrato de tarea humana:

- título, objetivo y evidencia que se mostrará;
- input context redactado;
- resume schema;
- acciones permitidas y rutas;
- rol/persona asignada;
- vencimiento;
- política en expiración;
- auditoría requerida;
- instrucciones de revisión.

Acciones predeterminadas: approve, reject, request_changes. Se pueden añadir acciones solo si tienen enum/ruta claros.

### 6.8 Subflow

Referencia una Flow Revision publicada. Configuración: subflow_revision_id, input mapping, output mapping, failure mapping, mode inline/isolated, policy de actualización y límites. Al seleccionar el nodo, abrir interfaz de schema, versión, dependencias, escenarios y opción de comparar contra nueva revisión.

### 6.9 Fork y Join

Fork inicia ramas en paralelo. Join debe declarar strategy all, any o quorum; inputs esperados; timeout; reducer por artifact compartido; failure behavior. No permitir un join que reciba múltiples escrituras sobre la misma ruta sin reducer.

### 6.10 End y Error Sink

End valida y serializa output final. Error Sink guarda dead-letter redactado con revision, run, node, error class, artifact reference y sugerencia de reintento. Un flow con efectos externos debe tener una ruta de error terminal explícita.

### 6.11 Nodos de presentación

Post-it, dibujo, regla, notas y grupos visuales se pueden conservar, pero se almacenan como UI metadata. Nunca se incluyen en compilación, validación de topología ejecutable ni RuntimeGraph.

## 7. Contratos de datos, puertos y transforms

### 7.1 BuilderFlow v1

~~~json
{
  "schema_version": "builder/v1",
  "id": "flow_01",
  "revision": 1,
  "metadata": {
    "name": "Procesar factura",
    "description": "Registra facturas y solicita aprobación por importe",
    "source": "manual",
    "architecture_revision_id": null
  },
  "state_contract": {
    "input_schema_ref": "antigravity://schemas/inbound-email/v1",
    "output_schema_ref": "antigravity://schemas/process-result/v1"
  },
  "nodes": [],
  "edges": [],
  "policies": {
    "default_timeout_ms": 30000,
    "default_retry_policy_ref": "retry/default/v1"
  },
  "ui": {"viewport": {"x": 0, "y": 0, "zoom": 1}}
}
~~~

### 7.2 BuilderNode v1

~~~json
{
  "id": "route_amount",
  "kind": "decision",
  "name": "¿Requiere aprobación?",
  "config": {
    "expression": "artifacts.invoice.amount > 1000",
    "allowed_paths": ["artifacts.invoice.amount"]
  },
  "input_contract": {"schema_ref": "Invoice/v1"},
  "output_contracts": {
    "true": {"schema_ref": "Invoice/v1"},
    "false": {"schema_ref": "Invoice/v1"},
    "failure": {"schema_ref": "FlowError/v1"}
  },
  "execution_policy": {"timeout_ms": 1000, "retry": {"max_attempts": 0}},
  "failure_policy": {"on_evaluation_error": "failure"},
  "security_policy": {"data_classification": "confidential"},
  "provenance": {"architecture_revision_id": "ar_14", "requirement_ids": ["req_high_amount"]},
  "ui": {"position": {"x": 540, "y": 100}, "width": 240, "height": 180}
}
~~~

### 7.3 BuilderEdge v1

~~~json
{
  "id": "edge_amount_true",
  "from": "route_amount",
  "to": "finance_approval",
  "kind": "route",
  "label": "true",
  "source_handle": "true",
  "target_handle": "input",
  "route": {"selector": "true"},
  "ui": {"style": "smoothstep"}
}
~~~

La UI puede personalizar color/estilo, pero no puede alterar kind, label ni handles por un cambio de estilo. La persistencia, API y compilación deben transportar las mismas propiedades.

### 7.4 Contract Inspector

Cada conexión muestra tabla de campos:

| Campo | Producer | Tipo | Required | Clasificación | Consumer | Estado |
|---|---|---|---|---|---|---|
| amount | Extract Invoice | number | sí | confidential | Decision | compatible |
| invoice_date | Extract Invoice | string/null | no | internal | ERP Tool | transform requerido |

Cuando hay incompatibilidad, mostrar la diferencia y proponer transform explícito. Ejemplo: string con moneda a number. El usuario debe aceptar el transform, revisar preview y versionarlo.

### 7.5 Binding syntax

Usar una sintaxis segura para referencias: $.input, $.artifacts.nombre, $.variables.nombre y $.approval.nombre. Validar paths al guardar. No permitir template string libre que pueda leer todo el estado sin autorización.

## 8. Validación dentro de Builder

### 8.1 Validación inmediata

Se ejecuta mientras el usuario edita y cubre nombres requeridos, configuración de nodo, handles obligatorios, edge duplicado, conectividad de puertos y schema superficial. No bloquea el canvas; marca problemas.

### 8.2 Validación de publicación

Es determinista y bloquea:

- node ID duplicado;
- edge a nodo inexistente;
- nodo ejecutable inalcanzable;
- ruta sin final;
- decision sin todas las ramas;
- classifier sin enum/uncertain fallback;
- schema incompatible;
- transform sin preview/schema;
- ciclo sin salida/max iterations;
- join ambiguo;
- tool no registrado, sin permiso o sin credencial;
- side effect sin idempotency;
- secret detectado;
- human gate sin resume contract/expiry/rol;
- subflow sin revisión publicada o schema compatible;
- ejecución sin output schema final;
- cambios de drift no reconciliados si se exige origen Architect.

### 8.3 Finding

Cada finding incluye code estable, severity, category, entidad, mensaje, evidencia, links a contrato, auto-fix si existe y estado. Severidades: info, warning, error, blocking. Solo blocking impide publicar, pero warnings críticos de seguridad pueden requerir acknowledgment auditado.

### 8.4 Score

Mostrar Flow Health como ayuda: Contracts 25, Reliability 25, Security 20, Observability 15, Tests 15. El score no se usa para permitir publish si existe un blocker.

## 9. Versionado, publicación y colaboración

### 9.1 Borrador

Guardar draft con autosave optimista, revision cursor y historial. Cada cambio genera command/patch semántico, no solo snapshot. Mantener undo/redo local, pero persistir checkpoints de edición para recuperación.

### 9.2 Validar

El botón Validar ejecuta validación completa y compile dry-run. No llama LLMs ni capabilities externas. Presenta reporte atado al hash del borrador.

### 9.3 Publicar

Publicar crea Flow Revision inmutable. Guardar BuilderFlow, RuntimeGraph, content hash, compiler version, schema/capability/model profile versions, reportes, suites aprobadas y actor. Rechazar si el hash de cliente está desactualizado.

### 9.4 Colaboración

Usar optimistic concurrency por revisión. Para conflicto, mostrar cambios por nodo/edge/schema/policy. No aplicar last-write-wins en configuración semántica. Los cambios de posición pueden fusionarse con menor severidad, pero deben registrarse.

### 9.5 Comparación

Diff debe distinguir:

- visual: posición, tamaño, color, nota;
- configuración: modelo, prompt, timeout;
- contrato: input/output/binding;
- control: edge, route, join, loop;
- seguridad: capability, permiso, clasificación;
- fiabilidad: retry/idempotency/failure policy.

Los cuatro últimos invalidan validación y escenarios relevantes.

## 10. Integración profunda con FlowArchitect

### 10.1 Ingreso desde Architect

Builder recibe un BuilderFlow v1 y metadata de publicación. El modal de llegada muestra:

- nombre y revisión de arquitectura;
- validación/simulación que ya aprobó;
- nodos/edges que se agregarán o reemplazarán;
- schemas, capabilities y posibles credenciales faltantes;
- cambios respecto al canvas actual;
- opción Reemplazar, Insertar como Subflow o Comparar.

No modificar el canvas hasta confirmar.

### 10.2 Provenance

Cada nodo/edge originado por Architect tiene architecture_revision_id, requirement_ids, rationale y source hash. En inspector, un enlace abre la decisión/requirement original.

### 10.3 BuilderPatch y drift

Cambiar posición es visual. Cambiar nombre puede ser cosmético si no afecta referencias. Cambiar prompt, capability, schema, edge, policy, routing o subflow es semántico. BuilderPatch debe incluir before/after, actor, timestamp y clasificación. FlowArchitect permite aceptar, rechazar, convertir en rama nueva o actualizar su ArchitectureSpec.

## 11. Capability Registry, modelos y credenciales

### 11.1 Capability Registry

Una capability define:

~~~json
{
  "id": "storage.invoice.write",
  "version": "1.2.0",
  "display_name": "Guardar factura",
  "input_schema_ref": "Invoice/v1",
  "output_schema_ref": "StorageReceipt/v1",
  "auth_mode": "oauth_reference",
  "required_scopes": ["invoices.write"],
  "risk_level": "high",
  "side_effect": true,
  "network_policy": {"allowed_domains": ["api.example.com"]},
  "timeouts": {"default_ms": 15000, "max_ms": 60000},
  "retryable_errors": ["timeout", "429", "503"]
}
~~~

La biblioteca muestra únicamente capabilities accesibles al usuario/workspace. La UI permite elegir versión compatible y explica cambios de versión.

### 11.2 Credenciales

Un nodo guarda credential_reference_id, nunca valor de secreto. La asociación de credencial exige permisos. Mostrar estado ready, missing, expired o insufficient_scope sin revelar datos sensibles.

### 11.3 Model profiles

En vez de seleccionar arbitrariamente un modelo por cada nodo, crear perfiles: local_private, fast_structured, deep_reasoning, low_cost, vision_document. Cada perfil declara providers permitidos, output mode, coste/latencia límite, clasificación autorizada y fallbacks. Runtime registra proveedor y modelo resuelto.

## 12. Compilación y Runtime LangGraph

### 12.1 Pipeline único

Eliminar rutas paralelas que ejecuten el canvas con mapeos distintos. El único pipeline de producción:

1. validar BuilderFlow;
2. compilar RuntimeGraph;
3. hashear y publicar Flow Revision;
4. iniciar Run mediante flow_revision_id;
5. cargar manifest exacto;
6. construir StateGraph;
7. emitir trazas;
8. persistir checkpoint.

### 12.2 Estado runtime

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

Messages no es el transport principal de resultados. El output de Agent, Tool, Transform, Classifier y Human Gate se guarda como artifact tipado y validado.

### 12.3 Condiciones

Decision usa un parser de expresiones con operadores permitidos. Classifier invoca LLM y exige JSON Schema/enum. Cada ruta se mapea con label/selector exacto. Si la respuesta no coincide con enum o confidence threshold, se usa uncertain/failure, nunca la primera arista disponible.

### 12.4 Retry y efectos externos

Runtime clasifica errores. Solo reintenta errores permitidos por capability/node policy. Side effects reciben idempotency key derivada de run, node y business key declarada. Mantener ledger de ejecución por key para impedir duplicados.

### 12.5 Human-in-the-loop

Compilar human gate con interrupt_before. Crear ApprovalTask durable. Exponer thread_id, pending_node, approval_task_id, expires_at, actions y resume_contract redactado. Reanudar solo con usuario autorizado y respuesta validada. Si expira, seguir route expired.

### 12.6 Checkpoints

No depender exclusivamente de MemorySaver. Implementar checkpointer durable por workspace/run/thread. Al reiniciar proceso, Run Inspector y endpoint resume deben recuperar state y manifest por IDs persistidos.

## 13. Run Inspector y operación

### 13.1 Timeline

Mostrar cada evento con secuencia, timestamp, nodo, attempt, ruta, duración, modelo/capability, estado schema y payload redactado. Filtros por error, nodo, route, capability, estado y rango de tiempo.

### 13.2 Vista de grafo

El canvas se puede poner en modo replay: ilumina solo los nodos/edges tomados. Indicar nodos skipped, retries, errors y human pause. No modificar el borrador mediante esta vista.

### 13.3 Reintento

Permitir retry desde nodo únicamente si policy lo permite, el input artifact sigue disponible, no hay side effect no idempotente pendiente y el usuario tiene permiso. Registrar relación parent_run/retry_run.

### 13.4 Observabilidad

Eventos mínimos:

run_started, node_started, input_validated, schema_failed, agent_completed, tool_called, tool_returned, route_selected, node_retried, node_failed, human_paused, human_resumed, subflow_started, subflow_completed, dead_lettered, run_succeeded, run_failed, run_cancelled.

Métricas: success rate, p50/p95, retries, error class, approval lead time, schema failure rate, capability availability, cost estimate, drift rate y publicación que requiere rollback.

## 14. Seguridad, privacidad y auditoría

### 14.1 Reglas no negociables

- No enviar secretos hacia frontend.
- No registrar chain-of-thought del modelo.
- Redactar paths sensibles antes de persistir trace o mostrar UI.
- Validar autorización en backend para editar, publicar, ejecutar, asociar credenciales y reanudar.
- Mantener audit trail append-only de publish, credential bind, run, resume, cancel, policy change, override de warning y drift acceptance.
- Aplicar tenant isolation por workspace_id.

### 14.2 Datos sensibles

Clasificar artifacts y campos en public, internal, confidential y restricted. El inspector aplica masking basado en rol. Model profile/capability debe ser compatible con clasificación; de lo contrario, validation bloquea publicación.

### 14.3 Prompt safety

No concatenar datos sin control a system prompt. Crear bindings con delimitadores y roles de mensajes definidos. Marcar input no confiable. Si un documento puede contener prompt injection, debe pasar por nodo de sanitización/policy antes de afectar control flow o tool invocation.

## 15. Migración desde el Builder actual

### 15.1 Inventario y backup

Antes de migrar, exportar snapshots de todos los flows y canvas localStorage a una ubicación versionada. Asignar hash y schema_version legacy/v0.

### 15.2 LegacyFlowAdapter

| Dato legacy | Destino BuilderFlow v1 | Comportamiento |
|---|---|---|
| data.content | agent.config.prompt | conservar texto |
| data.role | agent.config.role | conservar como metadata |
| data.llm_model | agent.config.model_profile_override | marcar para resolver |
| data.temperature | agent.config.temperature | validar contra profile |
| data.variableName | variable.config.var_name | normalizar |
| data.condition | decision.config.expression o classifier candidate | no inferir expression si es lenguaje natural |
| data.tools | unresolved_capabilities | bloquear publish hasta mapear |
| edge sin label de condition | ambiguous_branch | Migration Assistant obliga asignar true/false |
| post-it/drawing/ruler | ui.annotations | excluir de RuntimeGraph |
| subflow content libre | unresolved_subflow | bloquear publish hasta version/ref |

### 15.3 Assistant de migración

Mostrar progreso por problema: semántica de condition, variable, capability, credentials, subflow, edges, schema. Permitir volver a legacy; no eliminar original hasta confirmar actualización y completar retención definida.

### 15.4 Compatibilidad temporal

El render legacy sigue funcionando. Ejecutar legacy solo en modo de prueba explícitamente marcado, no permitir publicación de producción mientras falten ambigüedades P0.

## 16. APIs requeridas

### 16.1 Builder drafts

POST /api/v1/builder/flows crea draft. PATCH /api/v1/builder/flows/{id} recibe base_revision y domain patch. GET devuelve flow, state, validation summary y provenance.

### 16.2 Validación y publicación

POST /api/v1/builder/flows/{id}/validate corre validación y compile dry-run. POST /api/v1/builder/flows/{id}/publish requiere expected_content_hash, revisión, permisos y simulation evidence si la policy lo exige.

### 16.3 Simulación y runs

POST /api/v1/builder/flows/{id}/simulate ejecuta una suite fake. POST /api/v1/runs recibe flow_revision_id, input e idempotency_key. GET /api/v1/runs/{id}/events entrega SSE/WebSocket. POST /api/v1/runs/{id}/resume valida ApprovalTask.

### 16.4 Diffs y Architect bridge

GET /api/v1/builder/flows/{id}/diff?from=...&to=... devuelve diff semántico. POST /api/v1/builder/flows/{id}/architect-patches crea BuilderPatch. POST /api/v1/builder/import-architecture recibe BuilderFlow y mode preview/replace/insert_subflow.

### 16.5 Errores

Usar errores de dominio: INVALID_SCHEMA, REVISION_CONFLICT, VALIDATION_BLOCKED, SIMULATION_REQUIRED, CAPABILITY_NOT_AUTHORIZED, CREDENTIAL_MISSING, AMBIGUOUS_BRANCH, PUBLISHED_REVISION_IMMUTABLE, IDEMPOTENCY_CONFLICT y RESUME_CONTRACT_INVALID.

## 17. Descomposición técnica por repositorio

### 17.1 Frontend

- types/builder-flow.ts: schemas TypeScript y DTOs.
- lib/flowNormalizer.ts: conversión legacy y comprobaciones iniciales.
- lib/builderBridge.ts: import desde Architect, preview y BuilderPatch.
- components/builder/ContractPorts.tsx: puertos tipados.
- components/builder/NodeInspector.tsx: tabs de configuración/datos/errores/seguridad/tests/runs/provenance.
- components/builder/ValidationDrawer.tsx: findings y autofixes.
- components/builder/RunInspector.tsx: timeline/replay.
- components/builder/HumanGatePanel.tsx: task schema/actions/expiry.
- components/builder/SubflowInterfacePanel.tsx: version/schema/diff.
- components/builder/PublishDialog.tsx: hash/version/suite evidence.
- Builder.tsx: reducir a orquestación de UI; no mapear contratos ad hoc al engine.

### 17.2 Backend

- schemas/architecture.py y schemas/builder_flow.py: Pydantic v2.
- services/flow_normalizer.py: único punto de compatibilidad legacy.
- services/flow_validator.py: reglas de publicación.
- services/flow_compiler.py: BuilderFlow a RuntimeGraph.
- services/capability_registry.py: capabilities/credenciales refs.
- services/simulation.py: adapters fake y assertions.
- services/run_store.py: runs, checkpoints, events.
- routers/builder_flows.py: drafts/validate/publish/diff.
- routers/runs.py: start/events/resume/cancel.
- native_engine.py: consumir RuntimeGraph validado, no propiedades crudas del canvas.

### 17.3 Base de datos

Tablas: builder_flow, builder_flow_revision, runtime_manifest, builder_patch, capability, capability_version, credential_reference, simulation_suite, simulation_run, runtime_run, runtime_event, approval_task y audit_event. Todas con workspace_id y referencias/hashes necesarios.

## 18. Plan de implementación por fases

### Fase 0 — Fundamentos y correcciones P0

Duración estimada: 1 a 2 semanas.

Entregar BuilderFlow v1, schemas compartidos, LegacyFlowAdapter, preservación de label/sourceHandle/targetHandle, normalizador único de variable/condition, validación topológica, payload HITL completo y pruebas de branching/legacy.

No cerrar fase si un edge de condition puede perder su semántica.

### Fase 1 — Builder confiable

Duración estimada: 2 a 4 semanas.

Entregar Contract Inspector, puertos tipados, Decision/Classifier separados, políticas de error, publicación inmutable, compile dry-run, checkpointer durable y Run Inspector inicial.

No cerrar fase si un usuario no puede ver input/output/error policy de un nodo publicado o si no puede identificar qué revisión ejecutó.

### Fase 2 — Builder nativo integrado

Duración estimada: 3 a 5 semanas.

Entregar capability registry, subflows reales, Simulation Lab, Architect preview/import, provenance, BuilderPatch y drift reconciliation.

No cerrar fase si un flujo de Architect no puede convertirse en preview, publicarse, ejecutarse y volver con diff.

### Fase 3 — Operación empresarial

Duración continua.

Entregar regression suites, coste/latencia, policies organizacionales, colaboración, auditoría enriquecida y chaos testing.

## 19. Matriz de pruebas

### 19.1 Unitarias

- schema parse y serialización;
- edges semánticos;
- parser seguro de expressions;
- classifier enum/threshold;
- compatibility de JSON Schema;
- transform preview;
- retry/backoff/idempotency;
- redaction;
- normalización legacy;
- clasificación de BuilderPatch.

### 19.2 Integración

- React Flow edge conserva label/handles hasta RuntimeGraph;
- condition true/false toma destino correcto;
- tool fake valida credential reference y output schema;
- human gate sobrevive reinicio de backend;
- subflow propaga input/output/failure;
- publicación rechaza graph/schema/security/reliability inválidos;
- reintento no duplica side effect.

### 19.3 End to end

Crear factura desde Architect, abrir preview en Builder sin sobrescribir canvas, añadir transform, validar, simular cinco casos, publicar, ejecutar, pausar en human gate, reiniciar service, reanudar, abrir Run Inspector y reconciliar un cambio semántico.

### 19.4 Seguridad

Sembrar API key/JWT/PII en todos los puntos. Ninguno puede aparecer en response, log, trace, event, inspector o export. Probar usuario sin permiso, credential expirada, scope insuficiente, provider no permitido y prompt injection documental.

## 20. Criterios de aceptación completos

1. Builder conserva exacta y explícitamente el significado de cada nodo/edge desde interacción UI hasta ejecución.
2. No existe ruta de ejecución de producción que opere directamente con el canvas React Flow sin manifest publicado.
3. Una condición, classifier, human gate, subflow, fork y join tienen comportamiento probado y contratos declarados.
4. No se publica un flujo con ambiguidades de branch, schema, seguridad, resiliencia o versiones.
5. Todo run es reproducible por revision/manifest/input/idempotency key/configuración resuelta.
6. El Run Inspector permite entender qué ocurrió sin leer logs internos ni revelar datos sensibles.
7. Los flujos legacy se preservan, se migran con preview y no se rompen silenciosamente.
8. Builder y FlowArchitect pueden intercambiar revisiones y detectar drift.
9. Todos los casos de matriz de pruebas pasan en CI.
10. La documentación de schemas, APIs, migración y operación se entrega con el producto.

## 21. Prompt maestro para implementar la mejora del Builder

~~~text
Eres el Director Técnico responsable de evolucionar Antigravity Builder hacia un editor visual confiable de flujos LangGraph. Debes implementar el contrato descrito a continuación de manera completa, con código, migraciones, pruebas y evidencia verificable.

RESULTADO OBLIGATORIO

Builder debe representar, editar, validar, simular, publicar y operar BuilderFlow v1. Runtime solo puede ejecutar RuntimeGraph v1 compilado desde una Flow Revision publicada. React Flow es una vista, nunca la fuente de verdad de Runtime.

REGLAS INNEGOCIABLES

1. No construyas exportadores a plataformas externas.
2. No ejecutes JSON crudo del canvas.
3. No pierdas edge kind, label, source_handle ni target_handle en ninguna capa.
4. No infieras rutas True/False por orden, posición ni heurística.
5. No permitas datos entre nodos sin schema compatible o transform explícito.
6. No permitas tools de texto libre ni mocks en runtime productivo. Usa Capability Registry.
7. No guardes secretos en frontend, prompts, flow JSON, fixtures, eventos, traces o logs.
8. No permitas side effects sin timeout, retry/backoff, idempotency y failure route.
9. No permitas Human Gate sin ApprovalTask durable, resume_contract, rol, expiry y validación antes de reanudar.
10. No publiques con findings bloqueantes.
11. No sobrescribas canvas local al recibir un flow de FlowArchitect; solo ofrece preview, replace, insert_subflow o compare.
12. No declares terminada una fase sin pruebas automáticas ejecutadas y resultados presentados.

IMPLEMENTAR

- BuilderFlow v1 y RuntimeGraph v1, con schemas Pydantic/TypeScript compartidos.
- LegacyFlowAdapter para variableName, condition, tools, edges ambiguos, subflows y nodos de presentación.
- Canvas semántico con ContractPorts, RouteLabel, estados de nodo y Node Inspector.
- Tipos Start, Agent, Transform, Decision, Classifier, Tool, Human Gate, Subflow, Fork, Join, End y Error Sink.
- Contract Inspector con JSON Schema, binding seguro y transforms explícitos.
- ValidationService con reglas de topología, contratos, seguridad, reliability, human workflow y tests.
- Acciones Save Draft, Validate, Simulate y Publish claramente separadas.
- Capability Registry, credential references y model profiles.
- Compiler determinista BuilderFlow → RuntimeGraph → StateGraph.
- Checkpoints persistentes, Run Inspector, traces redactados, retry/idempotency y dead letters.
- Subflows publicados con interfaces versionadas.
- Import/preview/provenance/drift para FlowArchitect.

CORRECCIONES P0 DEL CÓDIGO ACTUAL

Conserva label/sourceHandle/targetHandle al enviar edges. Normaliza variableName a config.var_name. Separa condition expression de classifier prompt. Devuelve pending_node, approval_task y resume_contract. Respeta model profile/resolución real. Elimina tools mock de producción. Mueve checkpoints fuera de memoria de proceso.

ORDEN DE TRABAJO

Fase 0: schemas, normalizador legacy, branching fiable, topología, HITL payload y tests.
Fase 1: contratos visuales, policies de error, publicaciones, checkpointer y Run Inspector.
Fase 2: capabilities, subflows, simulación, FlowArchitect Bridge, provenance y drift.
Fase 3: regresión, métricas, auditoría y chaos.

ENJAMBRE DE ESPECIALISTAS

Puedes delegar en schema-contracts, runtime-langgraph, builder-ux, capabilities-security, migration-compatibility y quality-verification. El orquestador principal conserva decisiones e integración. schema-contracts define primero los contratos; nadie crea formatos paralelos. Cada especialista declara archivos/dependencias/riesgos, entrega pruebas y no realiza refactors fuera de alcance. quality-verification prueba integración y seguridad de todo el sistema.

REPORTE

Antes de editar, inspecciona el repositorio y presenta plan de archivos, contrato y riesgos. Al cerrar cada fase entrega cambios, migraciones, endpoints, validaciones, resultados de pruebas, limitaciones y siguiente fase. Si una decisión requiere autoridad del usuario o contradice una regla, detente y pide resolución con evidencia. No debilites silenciosamente ninguna regla.
~~~
