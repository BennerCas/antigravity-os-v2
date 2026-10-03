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


def ensamblar_instrucciones(
    agent_id: str,
    atlas_knowledge_id: Optional[str] = None,
    override_instructions: Optional[str] = None,
) -> str:
    base = override_instructions or _cargar_perfil_agente(agent_id)
    if atlas_knowledge_id:
        atlas = _cargar_conocimiento_atlas(atlas_knowledge_id)
        if atlas:
            base = f"{base}\n\n## CONOCIMIENTO MAESTRO DE ATLAS\n{atlas}"
    
    # --- MOLDE MAESTRO (Rule 24: Meta-Prompting) ---
    # Si el prompt no está ya formateado bajo el estándar CO-STAR, lo envolvemos automáticamente
    if "ROLE:" not in base and "CONSTRAINTS:" not in base:
        base = (
            f"ROLE: Eres el agente '{agent_id}'.\n"
            f"CONTEXT: {base.strip()}\n"
            f"STYLE: Alta densidad técnica, vocabulario especializado de ingeniería. Cero lenguaje conversacional periférico (nada de saludos ni confirmaciones).\n\n"
            f"CONSTRAINTS:\n"
            f"1. OBLIGATORIO: Debes usar etiquetas <thinking> y </thinking> al inicio de tu respuesta para procesar tu cadena de pensamiento lógico antes de emitir cualquier salida.\n"
            f"2. Tu respuesta final (después del thinking) debe ser directa, accionable y estrictamente ceñida al formato solicitado.\n"
            f"3. Si generas código, está estrictamente prohibido usar comentarios como `// ... código omitido ...`. El código debe ser 'Drop-in Ready'.\n"
        )

    return base


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
    ) -> LocalAgentConfig:
        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions
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
        import os
        import httpx
        import json
        
        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions
        )
        
        # --- REGLA 1: Local Hermes es la regla ---
        # Primero intentar Ollama local
        ollama_model = model if model and not ("gemini" in model or "gpt" in model) else os.getenv("OLLAMA_MODEL", "hermes3:8b")
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        if not ollama_url.endswith("/v1"):
            ollama_url += "/v1"
            
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
            import inspect
            all_tools = TOOL_REGISTRY.copy()
            if extra_tools:
                all_tools.extend(extra_tools)
            tools_payload = []
            for t in all_tools:
                sig = inspect.signature(t)
                props = {}
                for name, param in sig.parameters.items():
                    props[name] = {"type": "string"}
                tools_payload.append({
                    "type": "function",
                    "function": {
                        "name": t.__name__,
                        "description": t.__doc__ or "",
                        "parameters": {
                            "type": "object",
                            "properties": props,
                            "required": list(sig.parameters.keys())
                        }
                    }
                })
            if tools_payload:
                payload["tools"] = tools_payload

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
                        tool_calls = message["tool_calls"]
                        payload["messages"].append(message)
                        for tc in tool_calls:
                            func_name = tc["function"]["name"]
                            args = json.loads(tc["function"]["arguments"])
                            tool_result = "Tool not found"
                            for t in all_tools:
                                if t.__name__ == func_name:
                                    import inspect
                                    if inspect.iscoroutinefunction(t):
                                        tool_result = await t(**args)
                                    else:
                                        tool_result = t(**args)
                                    break
                            payload["messages"].append({"role": "tool", "name": func_name, "content": str(tool_result)})
                        resp2 = await client.post(f"{ollama_url}/chat/completions", json=payload)
                        if resp2.status_code == 200:
                            return resp2.json()["choices"][0]["message"]["content"]
                    else:
                        return message["content"]
        except Exception as e:
            print(f"[AgentFactory] Fallo local (Ollama). Procediendo a fallback de nube. Detalle: {repr(e)}")
            pass # Continue to cloud fallback
            

        # --- REGLA 2: Si la app usa la nube debe utilizar free.ai ---
        free_ai_key = os.getenv("FREE_AI_API_KEY", "")
        free_ai_base = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1").rstrip("/")
        
        # If the user forced gemini explicitly, don't use free.ai unless we want to override it.
        # But the rule says "si la app usa la nube debe utilizar free.ai"
        if free_ai_key:
            payload = {
                "model": "qwen7b", # Model compatible con API Free.AI
                "messages": [
                    {"role": "system", "content": system_instructions},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4096
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
                    else:
                        print(f"[AgentFactory] Free.AI fallo (HTTP {resp.status_code}). Fallback a modelo similar (Gemini).")
            except Exception as e:
                print(f"[AgentFactory] Error en Free.AI: {repr(e)}. Fallback a modelo similar (Gemini).")
                pass

        # --- REGLA 3: Si no funciona free.ai debe usar un modelo lo mas similar (Gemini SDK) ---
        config = cls.build_config(
            agent_id=agent_id,
            atlas_knowledge_id=atlas_knowledge_id,
            override_instructions=override_instructions,
            extra_tools=extra_tools,
            model="gemini-2.5-flash", use_tools=use_tools,
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
        import os
        import httpx
        import json
        
        system_instructions = ensamblar_instrucciones(
            agent_id, atlas_knowledge_id, override_instructions
        )
        
        ollama_model = model if model and not ("gemini" in model or "gpt" in model) else os.getenv("OLLAMA_MODEL", "hermes3:8b")
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        if not ollama_url.endswith("/v1"):
            ollama_url += "/v1"
            
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
                                except:
                                    pass
                        return
        except Exception as e:
            print(f"[AgentFactory Stream] Fallo local (Ollama). Procediendo a fallback. Detalle: {repr(e)}")
            
        free_ai_key = os.getenv("FREE_AI_API_KEY", "")
        free_ai_base = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1").rstrip("/")
        
        if free_ai_key:
            payload["model"] = "qwen7b"
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", f"{free_ai_base}/chat/completions", json=payload, headers={"Authorization": f"Bearer {free_ai_key}"}) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: ") and line != "data: [DONE]":
                                    try:
                                        data = json.loads(line[6:])
                                        chunk = data["choices"][0]["delta"].get("content", "")
                                        if chunk:
                                            yield chunk
                                    except:
                                        pass
                            return
            except Exception as e:
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


