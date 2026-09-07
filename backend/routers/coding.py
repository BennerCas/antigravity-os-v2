"""
Router: /api/v1/coding
Módulo Coding de Antigravity OS v2.

Endpoints:
  POST   /api/v1/coding/snippet          — Guardar un snippet de código
  GET    /api/v1/coding/snippets         — Listar snippets (filtros opcionales)
  DELETE /api/v1/coding/snippet/{id}     — Eliminar un snippet
  POST   /api/v1/coding/generate         — Generar código multi-agente con IA (APEX-CODER)
  GET    /api/v1/coding/templates        — Templates listos por framework

Motor IA: call_ai() de builder_actions (Hybrid Engine: Free.AI → Ollama fallback)
Persistencia: data/coding_snippets.json (mismo patrón que prompts_db.json)
"""
from __future__ import annotations

import json
import os
import uuid
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Motor IA híbrido compartido — Free.AI → Ollama local fallback
from routers.builder_actions import call_ai

# System prompts de Coding (definidos en search.py junto al resto de APEX prompts)
from routers.search import COPILOT_SYSTEM

# ─── Rutas de persistencia ───────────────────────────────────────────────────

_BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))
SNIPPETS_PATH = os.path.join(_BACKEND_DIR, "data", "coding_snippets.json")

# ─── Router ──────────────────────────────────────────────────────────────────

router = APIRouter(prefix="/coding", tags=["Coding"])

# ─── System Prompt APEX-CODER ────────────────────────────────────────────────

APEX_CODER_SYSTEM = (
    "Eres APEX-CODER, un generador experto de código multi-agente. "
    "Genera código Python limpio y funcional para el framework indicado "
    "(crewai/autogen/langgraph). El código debe estar listo para ejecutarse "
    "en el sandbox de Antigravity OS. Sigue exactamente la estructura de "
    "código del framework."
)

# ─── Templates hardcoded por framework ───────────────────────────────────────

FRAMEWORK_TEMPLATES: Dict[str, Dict] = {
    "crewai": {
        "framework": "crewai",
        "language": "python",
        "description": "Pipeline CrewAI con dos agentes: investigador y redactor.",
        "code": '''\
from crewai import Agent, Task, Crew, Process

# ── Agentes ──────────────────────────────────────────────────────────────────
investigador = Agent(
    role="Investigador Senior",
    goal="Recopilar información precisa y actualizada sobre {tema}",
    backstory=(
        "Eres un analista de inteligencia con 10 años de experiencia "
        "extrayendo insights accionables de fuentes diversas."
    ),
    verbose=True,
    allow_delegation=False,
)

redactor = Agent(
    role="Redactor Especializado",
    goal="Transformar los hallazgos del investigador en un informe ejecutivo claro",
    backstory=(
        "Eres un comunicador corporativo experto en síntesis técnica "
        "para audiencias no especializadas."
    ),
    verbose=True,
    allow_delegation=True,
)

# ── Tareas ───────────────────────────────────────────────────────────────────
tarea_investigar = Task(
    description="Investiga en profundidad el tema: {tema}. Extrae los 5 puntos más relevantes.",
    expected_output="Lista estructurada con los 5 hallazgos principales.",
    agent=investigador,
)

tarea_redactar = Task(
    description="Redacta un informe ejecutivo de máximo 300 palabras basado en los hallazgos.",
    expected_output="Informe ejecutivo en formato Markdown.",
    agent=redactor,
)

# ── Crew ─────────────────────────────────────────────────────────────────────
crew = Crew(
    agents=[investigador, redactor],
    tasks=[tarea_investigar, tarea_redactar],
    process=Process.sequential,
    verbose=True,
)

if __name__ == "__main__":
    resultado = crew.kickoff(inputs={"tema": "Inteligencia Artificial en 2025"})
    print(resultado)
''',
    },
    "autogen": {
        "framework": "autogen",
        "language": "python",
        "description": "Conversación AutoGen entre un asistente IA y un proxy humano.",
        "code": '''\
import autogen

# ── Configuración del LLM ────────────────────────────────────────────────────
llm_config = {
    "config_list": [
        {
            "model": "gpt-4o",
            "api_key": "YOUR_API_KEY",   # Reemplaza con tu clave o usa variables de entorno
        }
    ],
    "temperature": 0.7,
    "cache_seed": None,
}

# ── Agentes ──────────────────────────────────────────────────────────────────
asistente = autogen.AssistantAgent(
    name="Asistente",
    llm_config=llm_config,
    system_message=(
        "Eres un experto en resolución de problemas técnicos. "
        "Proporciona soluciones claras, con ejemplos de código cuando sea útil. "
        "Cuando el problema esté resuelto, escribe TERMINATE."
    ),
)

proxy_humano = autogen.UserProxyAgent(
    name="ProxyHumano",
    human_input_mode="NEVER",       # Cambia a "ALWAYS" para intervención manual
    max_consecutive_auto_reply=5,
    is_termination_msg=lambda msg: "TERMINATE" in msg.get("content", ""),
    code_execution_config={
        "work_dir": "sandbox",
        "use_docker": False,
    },
)

# ── Iniciar conversación ─────────────────────────────────────────────────────
if __name__ == "__main__":
    proxy_humano.initiate_chat(
        asistente,
        message="Escribe una función Python para calcular la serie de Fibonacci hasta el término N.",
    )
''',
    },
    "langgraph": {
        "framework": "langgraph",
        "language": "python",
        "description": "Grafo LangGraph con dos nodos y enrutamiento condicional.",
        "code": '''\
from typing import TypedDict, Annotated
import operator

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.graph import StateGraph, END

# ── Estado compartido ────────────────────────────────────────────────────────
class EstadoAgente(TypedDict):
    messages: Annotated[list, operator.add]
    siguiente: str

# ── Modelo ───────────────────────────────────────────────────────────────────
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

# ── Nodos ────────────────────────────────────────────────────────────────────
def nodo_analizar(estado: EstadoAgente) -> dict:
    """Analiza el último mensaje y determina si se necesita más información."""
    messages = estado["messages"]
    respuesta = llm.invoke(
        [
            HumanMessage(content=(
                f"Analiza el siguiente mensaje y responde con 'COMPLETO' si tienes "
                f"suficiente información o 'INCOMPLETO' si necesitas más detalles: "
                f"{messages[-1].content}"
            ))
        ]
    )
    siguiente = "finalizar" if "COMPLETO" in respuesta.content else "solicitar_info"
    return {"messages": [respuesta], "siguiente": siguiente}


def nodo_solicitar_info(estado: EstadoAgente) -> dict:
    """Solicita información adicional al usuario."""
    respuesta = llm.invoke(
        [HumanMessage(content="Formula una pregunta específica para obtener la información faltante.")]
    )
    return {"messages": [respuesta], "siguiente": "finalizar"}


def nodo_finalizar(estado: EstadoAgente) -> dict:
    """Genera la respuesta final."""
    messages = estado["messages"]
    respuesta = llm.invoke(messages + [HumanMessage(content="Genera la respuesta final completa.")])
    return {"messages": [respuesta], "siguiente": END}


def enrutar(estado: EstadoAgente) -> str:
    """Función de enrutamiento condicional."""
    return estado.get("siguiente", "finalizar")

# ── Construcción del grafo ───────────────────────────────────────────────────
builder = StateGraph(EstadoAgente)
builder.add_node("analizar", nodo_analizar)
builder.add_node("solicitar_info", nodo_solicitar_info)
builder.add_node("finalizar", nodo_finalizar)

builder.set_entry_point("analizar")
builder.add_conditional_edges("analizar", enrutar, {"solicitar_info": "solicitar_info", "finalizar": "finalizar"})
builder.add_edge("solicitar_info", "finalizar")
builder.add_edge("finalizar", END)

grafo = builder.compile()

# ── Ejecución ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    estado_inicial: EstadoAgente = {
        "messages": [HumanMessage(content="Explica cómo implementar autenticación JWT en FastAPI.")],
        "siguiente": "",
    }
    resultado = grafo.invoke(estado_inicial)
    print(resultado["messages"][-1].content)
''',
    },
}

# ─── Modelos Pydantic ─────────────────────────────────────────────────────────


class SnippetCreate(BaseModel):
    title: str
    content: str
    framework: str
    language: str
    tags: List[str] = []


class GenerateCodeRequest(BaseModel):
    task: str
    framework: str
    nodes: Optional[List[dict]] = None
    language: str = "python"


class CopilotRequest(BaseModel):
    code: str                              # Código o pregunta del usuario
    language: Optional[str] = "auto"      # Lenguaje detectado en el editor
    filename: Optional[str] = None        # Nombre del archivo activo (contexto)
    context: Optional[str] = None         # Fragmento adicional de contexto (imports, tipos, etc.)
    mode: Optional[str] = "auto"          # auto | completar | explicar | corregir | revisar


# ─── Helpers de persistencia ──────────────────────────────────────────────────


def _load_snippets() -> List[dict]:
    """Carga la lista de snippets desde el archivo JSON.

    Retorna lista vacía si el archivo no existe o está corrupto,
    garantizando que el endpoint no falle ante datos ausentes.
    """
    if not os.path.exists(SNIPPETS_PATH):
        return []
    try:
        with open(SNIPPETS_PATH, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, list) else []
    except Exception as exc:
        print(f"[coding] Error al cargar snippets: {exc}")
        return []


def _save_snippets(snippets: List[dict]) -> None:
    """Persiste la lista de snippets en disco de forma atómica."""
    os.makedirs(os.path.dirname(SNIPPETS_PATH), exist_ok=True)
    with open(SNIPPETS_PATH, "w", encoding="utf-8") as fh:
        json.dump(snippets, fh, ensure_ascii=False, indent=2)


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/snippet", status_code=201)
def save_snippet(body: SnippetCreate) -> dict:
    """Guarda un nuevo snippet de código.

    Genera un UUID único para cada snippet y lo añade a la
    colección persistente en ``data/coding_snippets.json``.

    Returns:
        El snippet completo con el campo ``id`` generado.
    """
    if not body.title.strip():
        raise HTTPException(status_code=422, detail="El campo 'title' no puede estar vacío.")
    if not body.content.strip():
        raise HTTPException(status_code=422, detail="El campo 'content' no puede estar vacío.")

    snippets = _load_snippets()
    new_snippet = {
        "id": str(uuid.uuid4()),
        "title": body.title.strip(),
        "content": body.content,
        "framework": body.framework.lower().strip(),
        "language": body.language.lower().strip(),
        "tags": [t.strip() for t in body.tags if t.strip()],
    }
    snippets.append(new_snippet)
    try:
        _save_snippets(snippets)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al guardar el snippet: {exc}") from exc

    return new_snippet


@router.get("/snippets")
def list_snippets(
    framework: Optional[str] = None,
    language: Optional[str] = None,
) -> List[dict]:
    """Lista todos los snippets guardados con filtros opcionales.

    Query params:
        framework: Filtra por framework (ej. ``crewai``, ``langgraph``).
        language:  Filtra por lenguaje de programación (ej. ``python``).

    Returns:
        Lista de snippets que coinciden con los filtros aplicados.
    """
    snippets = _load_snippets()

    if framework:
        snippets = [s for s in snippets if s.get("framework", "").lower() == framework.lower()]
    if language:
        snippets = [s for s in snippets if s.get("language", "").lower() == language.lower()]

    return snippets


@router.delete("/snippet/{snippet_id}", status_code=200)
def delete_snippet(snippet_id: str) -> dict:
    """Elimina un snippet por su ID.

    Args:
        snippet_id: UUID del snippet a eliminar.

    Raises:
        HTTPException 404: Si el snippet no existe.
        HTTPException 500: Si ocurre un error al persistir el cambio.

    Returns:
        Mensaje de confirmación con el ID eliminado.
    """
    snippets = _load_snippets()
    original_count = len(snippets)
    snippets = [s for s in snippets if s.get("id") != snippet_id]

    if len(snippets) == original_count:
        raise HTTPException(
            status_code=404,
            detail=f"Snippet con id '{snippet_id}' no encontrado.",
        )

    try:
        _save_snippets(snippets)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el snippet: {exc}") from exc

    return {"message": "Snippet eliminado correctamente.", "id": snippet_id}


@router.post("/generate")
async def generate_code(body: GenerateCodeRequest) -> dict:
    """Genera código de agente con IA usando APEX-CODER.

    Utiliza el Motor Híbrido (Free.AI → Ollama local) para producir
    código funcional adaptado al framework y la tarea indicados.

    Args:
        body.task:      Descripción de la tarea que debe realizar el agente.
        body.framework: Framework objetivo (``crewai``, ``autogen``, ``langgraph``).
        body.nodes:     Nodos opcionales del flujo visual para dar contexto al generador.
        body.language:  Lenguaje de programación (default ``python``).

    Returns:
        ``{"code": str, "framework": str, "model_used": str}``

    Raises:
        HTTPException 422: Si la tarea está vacía.
        HTTPException 502: Si todos los motores IA fallan.
    """
    if not body.task.strip():
        raise HTTPException(status_code=422, detail="El campo 'task' no puede estar vacío.")

    # Construir prompt de usuario con contexto de nodos si está disponible
    nodes_context = ""
    if body.nodes:
        try:
            nodes_context = (
                f"\n\nNodos del flujo visual disponibles:\n"
                + json.dumps(body.nodes, ensure_ascii=False, indent=2)
            )
        except Exception:
            nodes_context = ""

    user_prompt = (
        f"Framework: {body.framework}\n"
        f"Lenguaje: {body.language}\n"
        f"Tarea: {body.task}"
        f"{nodes_context}\n\n"
        "Genera el código completo, listo para ejecutar. "
        "Incluye todos los imports necesarios y comentarios claros."
    )

    try:
        code, model_used = await call_ai(APEX_CODER_SYSTEM, user_prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"El motor IA no pudo generar el código: {exc}",
        ) from exc

    return {
        "code": code,
        "framework": body.framework,
        "model_used": model_used,
    }


@router.get("/templates")
def get_templates(framework: Optional[str] = None) -> dict:
    """Retorna templates de código funcional por framework.

    Incluye ejemplos listos para usar de CrewAI, AutoGen y LangGraph.

    Args:
        framework: Si se especifica, retorna sólo el template de ese framework.

    Returns:
        Diccionario con uno o todos los templates disponibles.

    Raises:
        HTTPException 404: Si el framework especificado no tiene template.
    """
    if framework:
        key = framework.lower().strip()
        if key not in FRAMEWORK_TEMPLATES:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No existe template para el framework '{framework}'. "
                    f"Disponibles: {list(FRAMEWORK_TEMPLATES.keys())}"
                ),
            )
        return {key: FRAMEWORK_TEMPLATES[key]}

    return FRAMEWORK_TEMPLATES


# ─── Endpoint Copiloto ────────────────────────────────────────────────────────

@router.post("/copilot")
async def copilot_assist(body: CopilotRequest) -> dict:
    """APEX-COPILOT: asistente de código en tiempo real.

    Recibe un fragmento de código, pregunta técnica o error y responde
    usando el motor IA híbrido (Free.AI → Ollama) con el COPILOT_SYSTEM
    mejorado. Detecta automáticamente el modo (completar / explicar /
    corregir / revisar) a partir del contenido enviado.

    Args:
        body.code:     Código, pregunta o stack trace del usuario.
        body.language: Lenguaje detectado en el editor (default 'auto').
        body.filename: Nombre del archivo activo para dar contexto.
        body.context:  Fragmento adicional (imports, tipos, módulos vecinos).
        body.mode:     Hint del modo — 'auto' deja que el modelo decida.

    Returns:
        ``{"response": str, "model_used": str, "mode_detected": str}``

    Raises:
        HTTPException 422: Si el campo 'code' está vacío.
        HTTPException 502: Si todos los motores IA fallan.
    """
    if not body.code.strip():
        raise HTTPException(status_code=422, detail="El campo 'code' no puede estar vacío.")

    # Construir el user_prompt con todo el contexto disponible
    parts: list[str] = []

    if body.filename:
        parts.append(f"Archivo activo: {body.filename}")

    if body.language and body.language != "auto":
        parts.append(f"Lenguaje: {body.language}")

    if body.mode and body.mode != "auto":
        parts.append(f"Modo solicitado: {body.mode.upper()}")

    if body.context:
        parts.append(f"\n--- Contexto del proyecto ---\n{body.context}\n---")

    parts.append(f"\n--- Código / Consulta ---\n{body.code}\n---")

    user_prompt = "\n".join(parts)

    try:
        response_text, model_used = await call_ai(COPILOT_SYSTEM, user_prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"APEX-COPILOT: el motor IA no pudo responder: {exc}",
        ) from exc

    # Detectar el modo real usado (heurística simple sobre el input)
    code_lower = body.code.lower()
    if any(kw in code_lower for kw in ["error", "traceback", "exception", "failed", "syntaxerror"]):
        mode_detected = "corregir"
    elif any(kw in code_lower for kw in ["explica", "qué hace", "por qué", "what does", "explain"]):
        mode_detected = "explicar"
    elif any(kw in code_lower for kw in ["refactori", "mejora", "revisa", "review", "clean"]):
        mode_detected = "revisar"
    elif any(kw in code_lower for kw in ["...", "todo", "pass", "# incomplete", "# implement"]):
        mode_detected = "completar"
    else:
        mode_detected = body.mode or "auto"

    return {
        "response": response_text,
        "model_used": model_used,
        "mode_detected": mode_detected,
    }

