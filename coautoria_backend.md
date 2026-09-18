# CoautorIA: Propuesta de Arquitectura Backend

El módulo "CoautorIA" para Antigravity OS se diseñará con un enfoque modular, escalable y en tiempo real, utilizando FastAPI para la orquestación y una base de datos relacional (como PostgreSQL) estructurada para soportar jerarquías complejas, interacciones simultáneas y flujos de trabajo asíncronos en cadena (Spans).

## 1. Diseño de Base de Datos (Modelos y Relaciones)

A continuación, se define la estructura de entidades mediante SQLAlchemy/ORM para soportar las tres funcionalidades principales.

### A. Agrupaciones Jerárquicas (Agents, Teams, Enterprises)

Se utiliza un modelo de membresía para relacionar a los agentes individuales con diferentes niveles de agrupación.

*   **`Agent`**: Entidad principal que define al agente.
    *   `id` (PK)
    *   `name` (String)
    *   `system_prompt` (Text)
    *   `model_id` (String) - Referencia al modelo base en `models_link/`.
    *   `status` (Enum: Idle, Busy, Offline)

*   **`Group`**: Define el contenedor (Equipo o Empresa).
    *   `id` (PK)
    *   `name` (String)
    *   `type` (Enum: `TEAM`, `ENTERPRISE`) - Un Team validará en lógica de negocio tener entre 3 y 12 miembros. Una Enterprise permite 13+.
    *   `parent_group_id` (FK a `Group`, opcional) - Permite jerarquías complejas (Equipos dentro de Empresas).

*   **`AgentGroupMembership`**: Tabla pivote para relaciones N:M.
    *   `agent_id` (FK)
    *   `group_id` (FK)
    *   `role` (String) - Ej. 'Director', 'Analyst', 'Reviewer'.

### B. Salas de Chat de Debate/Filosofía

Para permitir que los agentes interactúen bajo la supervisión del usuario, se implementa una estructura tipo sala de chat.

*   **`Room`**: Sala de debate.
    *   `id` (PK)
    *   `topic` (String)
    *   `moderator_agent_id` (FK a `Agent`, opcional) - Agente que guía el debate.
    *   `is_active` (Boolean)

*   **`RoomParticipant`**: Agentes inscritos en la sala.
    *   `room_id` (FK)
    *   `agent_id` (FK)

*   **`RoomMessage`**: Historial de interacción.
    *   `id` (PK)
    *   `room_id` (FK)
    *   `agent_id` (FK)
    *   `content` (Text)
    *   `timestamp` (DateTime)
    *   `metadata_json` (JSONB) - Tokens consumidos, latencia, según reglas de ESTRUCTURA.md.

### C. Motor de Radio/Podcast y Co-escritura (Spans / Flujos en Cadena)

Implementa un sistema de grafos acíclicos dirigidos (DAG) o pipelines secuenciales.

*   **`Workflow`**: La producción global (Podcast, Libro).
    *   `id` (PK)
    *   `title` (String)
    *   `type` (Enum: `PODCAST`, `EBOOK`)
    *   `status` (Enum: `DRAFT`, `RUNNING`, `COMPLETED`, `FAILED`)

*   **`WorkflowSpan`** (Paso/Eslabón en la cadena):
    *   `id` (PK)
    *   `workflow_id` (FK)
    *   `agent_id` (FK) - Quién ejecuta este tramo.
    *   `sequence_order` (Integer)
    *   `instruction` (Text) - Tarea específica (ej. "Toma el borrador y mejora el tono de voz").
    *   `input_context` (Text) - Salida del Span anterior.
    *   `output_result` (Text) - Resultado generado.
    *   `status` (Enum: `PENDING`, `IN_PROGRESS`, `DONE`)

---

## 2. Flujos y Endpoints en FastAPI

El backend de FastAPI estará estructurado en tres grandes dominios para resolver los requerimientos operativos.

### Flujo 1: Gestión Jerárquica y de Equipos
**Router: `/api/v1/hierarchy`**
*   `POST /groups`: Crea un nuevo `Team` o `Enterprise`. La lógica de validación asegura que si es tipo `TEAM`, el límite máximo de adiciones futuras sea 12.
*   `POST /groups/{group_id}/members`: Asigna agentes. Si el grupo pasa de 12 miembros, FastAPI automáticamente ofrece convertir/actualizar el tipo a `ENTERPRISE`.
*   `GET /groups/{group_id}/topology`: Retorna un árbol jerárquico JSON que muestra a la empresa, sus equipos internos y los agentes asignados.

### Flujo 2: Salas de Debate en Tiempo Real
**Router: `/api/v1/debates`**
Para que el usuario pueda observar las discusiones en vivo, se requiere comunicación bidireccional.
*   `POST /rooms`: Inicializa el debate con un `topic` y asocia los `RoomParticipants`.
*   `WebSocket /ws/rooms/{room_id}`:
    1. El Frontend del usuario se conecta al socket.
    2. FastAPI funciona como orquestador asíncrono. Invoca a los modelos de los agentes en formato "Round Robin" o mediante "Llamado a hablar" (moderado por el LLM).
    3. Conforme el modelo de un agente genera un token (Streaming), FastAPI lo emite por el WebSocket usando Server-Sent Events (SSE) o frames de WS al usuario.
    4. El mensaje finalizado se consolida y se inserta en `RoomMessage` guardando los metadatos de tokens y latencia requeridos.

### Flujo 3: Orquestación de Spans (Radio y eBooks)
**Router: `/api/v1/workflows`**
Este flujo es pesado y requiere procesamiento en background (`BackgroundTasks` de FastAPI o Celery/Redis para despliegues mayores).
*   `POST /workflows`: Crea el proyecto de eBook o Podcast.
*   `POST /workflows/{id}/spans`: Define la cadena de montaje. Ej: `Span 1 (Agente Investigador) -> Span 2 (Agente Redactor) -> Span 3 (Agente Revisor) -> Span 4 (Agente Locutor/TTS)`.
*   `POST /workflows/{id}/start`: Detona el motor.
    1. El worker asíncrono toma el `Span 1`.
    2. Ejecuta la inferencia conectándose a `models_link/`.
    3. Guarda el `output_result` en base de datos.
    4. Mueve el `output_result` al `input_context` del `Span 2`.
    5. Dispara el `Span 2`.
*   `GET /workflows/{id}/status`: Permite al frontend hacer polling para ver qué nodo del DAG está en progreso y leer avances del libro/podcast en tiempo real.
*   *Output Final*: Al completarse todos los Spans, el sistema guarda el producto final (Audio o Markdown) en la carpeta `biblioteca/` siguiendo estrictamente la convención de nombres y el registro de metadatos dictados en la normativa global.
