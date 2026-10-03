"""
AgentFactory - Motor Universal de Agentes de Antigravity_OS_v2

Fusiona tres fuentes:
  1. Agents Module (skills_v2.json)  - Personalidad y Rol del agente
  2. Atlas Module  (prompts_db.json) - Master Prompts y conocimiento tecnico
  3. Antigravity SDK                 - Herramientas, multi-agent, policies
"""
import os
import json
import psutil
from typing import List, Callable, Optional, Dict, Any

import os
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(ENV_PATH)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "dummy_key_for_ollama")
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

# Remove GEMINI_API_BASE_URL if it was set to free.ai to ensure we hit the real Google API
if "GEMINI_API_BASE_URL" in os.environ:
    del os.environ["GEMINI_API_BASE_URL"]


from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
from backend.services.chroma_db import vector_db
from backend.model_defaults import DEFAULT_LOCAL_MODEL, FREE_AI_FALLBACK_MODEL, is_local_model, normalize_local_model, normalize_ollama_base_url, prefers_local_default, strip_model_provider
from backend.services.atlas_library import list_library_items

_BASE = r"C:\antigravityAS\Antigravity_OS_v2\apps\web-app\public"
SKILLS_PATH  = os.path.join(_BASE, "skills_v2.json")
PROMPTS_PATH = os.path.join(_BASE, "prompts_db.json")


def obtener_estado_memoria() -> str:
    """[Tool] Retorna el uso actual de CPU y RAM del sistema operativo local."""
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=0.1)
    return (
        f"CPU: {cpu}% | "
        f"RAM Total: {mem.total/(1024**3):.1f}GB | "
        f"Disponible: {mem.available/(1024**3):.1f}GB | "
        f"Uso: {mem.percent}%"
    )


def leer_documentacion_nodos(nodo_tipo: str) -> str:
    """[Tool] Retorna documentacion sobre un tipo de nodo en FlowBoard."""
    docs: Dict[str, str] = {
        "AI":        "Nodo AI: ejecuta un modelo de inteligencia artificial con un prompt configurable.",
        "CONDITION": "Nodo CONDITION: bifurca el flujo segun una expresion booleana (True/False).",
        "ACTION":    "Nodo ACTION: ejecuta codigo Python o una peticion HTTP.",
        "INPUT":     "Nodo INPUT: punto de entrada del flujo, recibe datos iniciales.",
        "OUTPUT":    "Nodo OUTPUT: punto final del flujo, emite el resultado procesado.",
        "LOOP":      "Nodo LOOP: itera sobre una lista de items aplicando sub-flujo.",
        "TRANSFORM": "Nodo TRANSFORM: aplica una transformacion de datos (map/filter/reduce).",
    }
    key = nodo_tipo.strip().upper()
    return docs.get(key, f"Nodo '{nodo_tipo}' no documentado. Considera crear un nodo custom.")


def listar_agentes_disponibles() -> str:
    """[Tool] Lista los agentes registrados en el modulo Agents (skills_v2.json)."""
    if not os.path.exists(SKILLS_PATH):
        return "No se encontro el catalogo de agentes."
    try:
        with open(SKILLS_PATH, encoding="utf-8") as f:
            skills = json.load(f)
        names = [s.get("name", s.get("id", "?")) for s in skills[:20]]
        return f"Agentes disponibles ({len(skills)} total): " + ", ".join(names)
    except Exception as e:
        return f"Error leyendo catalogo: {e}"


def buscar_en_atlas(query: str) -> str:
    """[Tool] Busca un Master Prompt en el modulo Atlas (prompts_db.json)."""
    if not os.path.exists(PROMPTS_PATH):
        return "No se encontro la base de Atlas."
    try:
        with open(PROMPTS_PATH, encoding="utf-8") as f:
            prompts = json.load(f)
        q = query.lower()
        matches = [
            p for p in prompts
            if q in p.get("title", "").lower() or q in p.get("content", "").lower()
        ]
        if not matches:
            return f"No se encontraron entradas de Atlas para: {query}"
        top = matches[:3]
        return "\n---\n".join(
            f"[{p.get('title','?')}]: {p.get('content','')[:400]}..." for p in top
        )
    except Exception as e:
        return f"Error buscando en Atlas: {e}"



import asyncio

def actualizar_checklist(tarea_id: str, estado: str) -> str:
    """[Tool] Actualiza dinamicamente el 'Radar de Arquitectura' (Checklist) en el frontend.
    IDs validos: 'triage', 'blueprint', 'deploy', o nuevos IDs que tu crees. estado puede ser 'completed', 'in_progress', 'failed', 'pending'."""
    try:
        from routers.studio import manager
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast({
                "type": "UPDATE_CHECKLIST",
                "payload": {"taskId": tarea_id, "status": estado}
            }))
        return f"Checklist actualizado: {tarea_id} -> {estado}"
    except Exception as e:
        return f"Error al actualizar checklist: {e}"

TOOL_REGISTRY: List[Callable] = [
    actualizar_checklist,

    obtener_estado_memoria,
    leer_documentacion_nodos,
    listar_agentes_disponibles,
    buscar_en_atlas,
]


def _cargar_perfil_agente(agent_id: str) -> str:
    fallback = (
        f"Eres un asistente experto llamado '{agent_id}' dentro de Antigravity_OS_v2. "
        "Responde SIEMPRE en espanol, con claridad y precision tecnica."
    )
    if not os.path.exists(SKILLS_PATH):
        return fallback
    try:
        with open(SKILLS_PATH, encoding="utf-8") as f:
            skills = json.load(f)
        for s in skills:
            if s.get("id") == agent_id or s.get("name") == agent_id:
                return s.get("instructions") or s.get("description") or fallback
    except Exception:
        pass
    return fallback


def _cargar_conocimiento_atlas(atlas_knowledge_id: str) -> str:
    if not os.path.exists(PROMPTS_PATH):
        return ""
    try:
        with open(PROMPTS_PATH, encoding="utf-8") as f:
            prompts = json.load(f)
        for p in prompts:
            if p.get("id") == atlas_knowledge_id or p.get("title") == atlas_knowledge_id:
                return p.get("content", "")
    except Exception:
        pass
    return ""


def _retrieve_runtime_memory(query: Optional[str], limit: int = 3) -> List[str]:
    cleaned = (query or "").strip()
    if len(cleaned) < 12:
        return []

    snippets: List[str] = []
    lowered = cleaned.lower()

    for item in list_library_items():
        haystack = f"{item.get('title','')}\n{item.get('content','')}".lower()
        if lowered in haystack or any(token in haystack for token in lowered.split() if len(token) > 4):
            content = str(item.get('content') or '').strip()
            if content and content[:900] not in snippets:
                snippets.append(content[:900])
            if len(snippets) >= limit:
                return snippets[:limit]

    try:
        for doc in vector_db.search_atlas(cleaned, n_results=max(limit, 5)):
            doc = str(doc).strip()
            if doc and doc[:900] not in snippets:
                snippets.append(doc[:900])
            if len(snippets) >= limit:
                break
    except Exception:
        pass

    return snippets[:limit]


def _append_runtime_memory(base: str, query: Optional[str]) -> str:
    snippets = _retrieve_runtime_memory(query)
    if not snippets:
        return base
    memory_block = "\n\n## MEMORIA ATLAS RELEVANTE\n" + "\n\n".join(
        f"[Memoria {idx}]\n{snippet}" for idx, snippet in enumerate(snippets, start=1)
    )
    return f"{base.rstrip()}{memory_block}"


RULE24_HEADERS = (
    "ROLE:",
    "CONTEXT:",
    "OBJECTIVE:",
    "STYLE:",
    "TONE:",
    "AUDIENCE:",
    "RESPONSE:",
    "CONSTRAINTS:",
)


def _rule24_target_model(model: Optional[str]) -> str:
    if prefers_local_default(model) or is_local_model(model):
        return normalize_local_model(model)
    clean = strip_model_provider(model)
    return clean or DEFAULT_LOCAL_MODEL


def _should_apply_rule24(model: Optional[str]) -> bool:
    clean = _rule24_target_model(model)
    return bool(clean) and (prefers_local_default(model) or is_local_model(model))


def _is_hermes_model(model: Optional[str]) -> bool:
    return "hermes" in _rule24_target_model(model).lower()


def _rule24_role_title(model: Optional[str]) -> str:
    if _is_hermes_model(model):
        return "Principal Cognitive Systems Architect para Hermes 3 Unlocked"
    return "Senior Local Systems Architect para modelos 8B"


def _has_rule24_header(prompt: str, header: str) -> bool:
    return header in prompt.upper()


def _append_rule24_section(prompt: str, header: str, body: str) -> str:
    if _has_rule24_header(prompt, header):
        return prompt.rstrip()
    return f"{prompt.rstrip()}\n\n{header}\n{body.strip()}"


def _execution_profile_header(model: Optional[str]) -> str:
    return "HERMES_UNLOCKED_EXECUTION_PROFILE" if _is_hermes_model(model) else "LOCAL_8B_EXECUTION_PROFILE"


def _rule24_section_defaults(agent_id: str, model: Optional[str]) -> Dict[str, str]:
    model_hint = _rule24_target_model(model)
    return {
        "ROLE:": f"Eres el agente '{agent_id}' operando como {_rule24_role_title(model)}.",
        "CONTEXT:": "Ejecuta las instrucciones base ya definidas en este prompt, preservando el alcance tecnico y evitando expandir el objetivo sin autorizacion.",
        "OBJECTIVE:": "Resolver exactamente la tarea del usuario y producir una salida ejecutable, verificable y estructuralmente valida para un runtime local de baja latencia.",
        "STYLE:": "Densidad tecnica alta, vocabulario de ingenieria, sin relleno conversacional, sin disculpas y sin narracion periferica.",
        "TONE:": "Directo, frio, autoritativo y estrictamente funcional.",
        "AUDIENCE:": f"Otro sistema tecnico que consumira la salida en el modelo local '{model_hint}' via ChatML/Ollama y necesita resultados deterministas.",
        "RESPONSE:": (
            "Fase 1: emite EXACTAMENTE un bloque <thinking>...</thinking> con 3 lineas numeradas: "
            "1) objetivo tecnico, 2) restricciones/esquema, 3) plan minimo.\n"
            "Fase 2: inmediatamente despues de </thinking>, emite SOLO la salida final solicitada por el usuario.\n"
            "Si el usuario pide JSON, la fase 2 debe ser JSON valido puro. Si pide codigo, entrega codigo completo listo para ejecutar. "
            "Si pide arquitectura, listas o tablas, respeta exactamente la plantilla solicitada."
        ),
        "CONSTRAINTS:": (
            "1. Usa una unica pareja de etiquetas <thinking> y </thinking> al inicio de cada respuesta; nunca omitas el cierre.\n"
            "2. No escribas texto fuera de <thinking> antes de la salida final.\n"
            "3. Respeta de forma exacta cualquier esquema, clave, orden, conteo o formato solicitado; cero campos inventados.\n"
            "4. Si no se entrega un esquema, deriva uno minimo dentro del thinking y luego emite una salida final estrictamente funcional.\n"
            "5. Prohibido usar placeholders, elipsis o comentarios como 'codigo omitido'.\n"
            "6. Si faltan datos criticos, formula como maximo 3 preguntas concretas o declara un bloqueo operativo; no rellenes vacios con suposiciones silenciosas.\n"
            "7. Responde siempre en espanol salvo que el usuario exija otro idioma.\n"
            "8. Cero texto periferico despues de la salida final."
        ),
    }


def _append_local_execution_profile(prompt: str, model: Optional[str]) -> str:
    header = _execution_profile_header(model)
    if f"{header}:" in prompt:
        return prompt.rstrip()
    model_hint = _rule24_target_model(model)
    profile = (
        f"Modelo objetivo: {model_hint}. Prioriza XML simple, razonamiento corto y alta fidelidad estructural.\n"
        "1. El bloque <thinking> debe permanecer por debajo de 160 tokens.\n"
        "2. Manten la sintaxis XML limpia: abre y cierra todas las etiquetas sin anidar formatos incompatibles.\n"
        "3. Cuando el usuario proporcione un esquema estricto, replicalo sin renombrar claves ni alterar cardinalidades."
    )
    return f"{prompt.rstrip()}\n\n{header}:\n{profile}"


def _build_rule24_wrapper(agent_id: str, base: str, model: Optional[str]) -> str:
    sections = _rule24_section_defaults(agent_id, model)
    wrapped = (
        f"ROLE: {sections['ROLE:']}\n"
        f"CONTEXT:\n{base.strip()}\n\n"
        f"OBJECTIVE:\n{sections['OBJECTIVE:']}\n\n"
        f"STYLE:\n{sections['STYLE:']}\n\n"
        f"TONE:\n{sections['TONE:']}\n\n"
        f"AUDIENCE:\n{sections['AUDIENCE:']}\n\n"
        f"RESPONSE:\n{sections['RESPONSE:']}\n\n"
        f"CONSTRAINTS:\n{sections['CONSTRAINTS:']}"
    )
    return _append_local_execution_profile(wrapped, model)


def ensamblar_instrucciones(
    agent_id: str,
    atlas_knowledge_id: Optional[str] = None,
    override_instructions: Optional[str] = None,
    model: Optional[str] = None,
    runtime_query: Optional[str] = None,
) -> str:
    base = override_instructions or _cargar_perfil_agente(agent_id)
    if atlas_knowledge_id:
        atlas = _cargar_conocimiento_atlas(atlas_knowledge_id)
        if atlas:
            base = f"{base}\n\n## CONOCIMIENTO MAESTRO DE ATLAS\n{atlas}"

    base = base.strip()
    base = _append_runtime_memory(base, runtime_query)
    if not base:
        base = (
            f"Eres un asistente experto llamado '{agent_id}' dentro de Antigravity_OS_v2. "
            "Responde siempre en espanol con claridad y precision tecnica."
        )

    if not _should_apply_rule24(model):
        return base

    if not any(_has_rule24_header(base, header) for header in RULE24_HEADERS):
        return _build_rule24_wrapper(agent_id, base, model)

    sections = _rule24_section_defaults(agent_id, model)
    prompt = base
    for header, body in sections.items():
        prompt = _append_rule24_section(prompt, header, body)
    return _append_local_execution_profile(prompt, model)


class AgentFactory:
    """Fabrica Universal de Agentes de Antigravity_OS_v2."""

    @classmethod
    def build_config(
        cls,
        agent_id: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
        runtime_query: Optional[str] = None,
    ) -> LocalAgentConfig:
        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions, model=model, runtime_query=runtime_query
        )
        all_tools = TOOL_REGISTRY.copy() if use_tools else []
        if extra_tools:
            all_tools.extend(extra_tools)
        return LocalAgentConfig(
            api_key=GEMINI_API_KEY,
            system_instructions=system_instructions,
            tools=all_tools,
            capabilities=CapabilitiesConfig(enable_subagents=False),
            model=model or None,
        )

    @classmethod
    async def chat_one_shot(
        cls,
        agent_id: str,
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        extra_tools: Optional[List[Callable]] = None,
        model: Optional[str] = None, use_tools: bool = True,
    ) -> str:
        import httpx
        import json
        import inspect

        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions, model=model, runtime_query=user_prompt
        )
        requested_model = strip_model_provider(model)
        prefer_local = prefers_local_default(model) or is_local_model(model)
        ollama_model = normalize_local_model(model)
        ollama_url = normalize_ollama_base_url(os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))

        payload = {
            "model": ollama_model,
            "messages": [
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 4096,
            "options": {
                "num_ctx": 8192,
                "num_predict": 4096
            }
        }

        all_tools = []
        if use_tools:
            all_tools = TOOL_REGISTRY.copy()
            if extra_tools:
                all_tools.extend(extra_tools)
            tools_payload = []
            for tool_fn in all_tools:
                sig = inspect.signature(tool_fn)
                props = {name: {"type": "string"} for name in sig.parameters.keys()}
                tools_payload.append({
                    "type": "function",
                    "function": {
                        "name": tool_fn.__name__,
                        "description": tool_fn.__doc__ or "",
                        "parameters": {
                            "type": "object",
                            "properties": props,
                            "required": list(sig.parameters.keys())
                        }
                    }
                })
            if tools_payload:
                payload["tools"] = tools_payload

        if prefer_local:
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    resp = await client.post(f"{ollama_url}/chat/completions", json=payload)
                    if resp.status_code == 404 or "model not found" in resp.text.lower():
                        tags_resp = await client.get(f"{ollama_url.replace('/v1', '/api/tags')}")
                        if tags_resp.status_code == 200:
                            models = tags_resp.json().get("models", [])
                            if models:
                                payload["model"] = models[-1]["name"]
                                print(f"[Quantum Routing] Modelo original no encontrado. Usando fallback local: {payload['model']}")
                                resp = await client.post(f"{ollama_url}/chat/completions", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        message = data["choices"][0]["message"]
                        if message.get("tool_calls"):
                            payload["messages"].append(message)
                            for tc in message["tool_calls"]:
                                func_name = tc["function"]["name"]
                                args = json.loads(tc["function"]["arguments"])
                                tool_result = "Tool not found"
                                for tool_fn in all_tools:
                                    if tool_fn.__name__ == func_name:
                                        if inspect.iscoroutinefunction(tool_fn):
                                            tool_result = await tool_fn(**args)
                                        else:
                                            tool_result = tool_fn(**args)
                                        break
                                payload["messages"].append({"role": "tool", "name": func_name, "content": str(tool_result)})
                            resp2 = await client.post(f"{ollama_url}/chat/completions", json=payload)
                            if resp2.status_code == 200:
                                return resp2.json()["choices"][0]["message"]["content"]
                        else:
                            return message["content"]
            except Exception as e:
                print(f"[AgentFactory] Fallo local (Ollama). Procediendo a fallback de nube. Detalle: {repr(e)}")

        free_ai_key = os.getenv("FREE_AI_API_KEY", "")
        free_ai_base = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1").rstrip("/")
        if free_ai_key:
            payload = {
                "model": requested_model if requested_model and not prefer_local else FREE_AI_FALLBACK_MODEL,
                "messages": [
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4096,
            }
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(
                        f"{free_ai_base}/chat/completions",
                        json=payload,
                        headers={"Authorization": f"Bearer {free_ai_key}", "Content-Type": "application/json"}
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
                    print(f"[AgentFactory] Free.AI fallo (HTTP {resp.status_code}). Fallback a Gemini.")
            except Exception as e:
                print(f"[AgentFactory] Error en Free.AI: {repr(e)}. Fallback a Gemini.")

        config = cls.build_config(
            agent_id=agent_id,
            atlas_knowledge_id=atlas_knowledge_id,
            override_instructions=override_instructions,
            extra_tools=extra_tools,
            model="gemini-2.5-flash", use_tools=use_tools, runtime_query=user_prompt,
        )
        try:
            async with Agent(config) as agent:
                response = await agent.chat(user_prompt)
                return await response.text()
        except Exception as e:
            return f"[AgentFactory Error] Todos los motores fallaron (Local, Free.AI, Gemini). Último error: {type(e).__name__}: {e}"

    @staticmethod
    async def chat_stream(

        agent_id: str,
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
        override_instructions: Optional[str] = None,
        model: Optional[str] = None,
    ):
        import httpx
        import json

        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions, model=model, runtime_query=user_prompt
        )
        requested_model = strip_model_provider(model)
        prefer_local = prefers_local_default(model) or is_local_model(model)
        ollama_model = normalize_local_model(model)
        ollama_url = normalize_ollama_base_url(os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))

        payload = {
            "model": ollama_model,
            "messages": [
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,
            "stream": True,
            "max_tokens": 4096,
            "options": {
                "num_ctx": 8192,
                "num_predict": 4096
            }
        }

        if prefer_local:
            try:
                async with httpx.AsyncClient(timeout=180.0) as client:
                    async with client.stream("POST", f"{ollama_url}/chat/completions", json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: ") and line != "data: [DONE]":
                                    try:
                                        data = json.loads(line[6:])
                                        chunk = data["choices"][0]["delta"].get("content", "")
                                        if chunk:
                                            yield chunk
                                    except Exception:
                                        pass
                            return
            except Exception as e:
                print(f"[AgentFactory Stream] Fallo local (Ollama). Procediendo a fallback. Detalle: {repr(e)}")

        free_ai_key = os.getenv("FREE_AI_API_KEY", "")
        free_ai_base = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1").rstrip("/")
        if free_ai_key:
            payload["model"] = requested_model if requested_model and not prefer_local else FREE_AI_FALLBACK_MODEL
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(
                        "POST",
                        f"{free_ai_base}/chat/completions",
                        json=payload,
                        headers={"Authorization": f"Bearer {free_ai_key}", "Content-Type": "application/json"}
                    ) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: ") and line != "data: [DONE]":
                                    try:
                                        data = json.loads(line[6:])
                                        chunk = data["choices"][0]["delta"].get("content", "")
                                        if chunk:
                                            yield chunk
                                    except Exception:
                                        pass
                            return
            except Exception:
                pass

        yield "[AgentFactory Error] Todos los motores fallaron en streaming."


    @classmethod
    async def swarm_chat(

        cls,
        agent_ids: List[str],
        user_prompt: str,
        atlas_knowledge_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        accumulated_context = user_prompt
        for agent_id in agent_ids:
            response = await cls.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                atlas_knowledge_id=atlas_knowledge_id,
            )
            results.append({"agent": agent_id, "response": response})
            accumulated_context = f"{accumulated_context}\n\n[Respuesta de {agent_id}]: {response}"
        return results


