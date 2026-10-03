
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any, Optional
import httpx
import os
from google.antigravity import Agent, CapabilitiesConfig
from google.antigravity.connections.local.local_openai_connection_config import LocalOpenAIAgentConfig
from backend.services.agent_factory import AgentFactory
from backend.services.swarm_runtime import swarm_runtime_service
from backend.services.room_runtime import list_room_presets, list_room_runs, get_room_run, simulate_room, clone_character, list_character_profiles
from backend.model_defaults import DEFAULT_CLOUD_MODEL, DEFAULT_LOCAL_MODEL, FREE_AI_FALLBACK_MODEL, LOCAL_MODEL_OPTIONS, is_local_model, normalize_local_model, normalize_ollama_base_url, strip_model_provider

router = APIRouter(prefix="/api/v1/studio", tags=["Studio"])

FREE_AI_BASE = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")
FREE_AI_KEY  = os.getenv("FREE_AI_API_KEY", "")
# Normaliza OLLAMA_BASE: el .env puede definirlo con o sin /v1 al final
OLLAMA_BASE = normalize_ollama_base_url(os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))

# Modelos NUBE (Free.AI)
NUBE_MODELS = {DEFAULT_CLOUD_MODEL, "openai/gpt-4o", "meta-llama/llama-3.1-70b-instruct", "qwen/qwen-2.5-72b-instruct"}

# Modelos LOCAL (Ollama)
LOCAL_MODELS = set(LOCAL_MODEL_OPTIONS)

from backend.services.agent_factory import _cargar_perfil_agente

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = f"ollama/{DEFAULT_LOCAL_MODEL}"
    system: Optional[str] = None
    agent_id: Optional[str] = "aurelios-core"

class ChatResponse(BaseModel):
    response: str
    model_used: str
    engine: str

@router.post("/chat", response_model=ChatResponse)
async def studio_chat(req: ChatRequest):
    raw_model = req.model or f"ollama/{DEFAULT_LOCAL_MODEL}"
    model = strip_model_provider(raw_model)
    is_local = is_local_model(raw_model)

    try:
        from backend.services.agent_factory import _cargar_perfil_agente
    except ImportError:
        from services.agent_factory import _cargar_perfil_agente

    # Load real system prompt from database or fallback to the provided system string
    system_prompt = req.system
    if not system_prompt and req.agent_id:
        db_prompt = _cargar_perfil_agente(req.agent_id)
        if db_prompt:
            system_prompt = db_prompt

    if not system_prompt:
        system_prompt = "Eres AureliOS, el Arquitecto Maestro y Sistema Operativo de Enjambres de Antigravity."

    if is_local:
        return await _call_ollama(req.message, system_prompt, model)
    else:
        result = await _call_free_ai(req.message, system_prompt, model)
        if result.engine == "error":
            result = await _call_ollama(req.message, system_prompt, DEFAULT_LOCAL_MODEL)
        return result

async def _call_free_ai(user: str, system: str, model: str) -> ChatResponse:
    if not FREE_AI_KEY:
        return ChatResponse(response="[ERROR] FREE_AI_API_KEY no configurada en el backend.", model_used=model, engine="error")
    headers = {"Authorization": f"Bearer {FREE_AI_KEY}", "Content-Type": "application/json"}
    
    # Try the requested model directly instead of overriding it with small LLMs
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.7,
        "max_tokens": 2048,
    }
    
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(f"{FREE_AI_BASE}/chat/completions", json=payload, headers=headers)
            if resp.status_code == 200:
                text = resp.json()["choices"][0]["message"]["content"].strip()
                return ChatResponse(response=text, model_used=f"free.ai/{model}", engine="free.ai")
            else:
                return ChatResponse(response=f"[ERROR Free.AI] HTTP {resp.status_code}: {resp.text}", model_used=model, engine="error")
    except Exception as e:
        return ChatResponse(response=f"[ERROR Network] {str(e)}", model_used=model, engine="error")

async def _call_ollama(user: str, system: str, model: str) -> ChatResponse:
    """Llama directamente a la API OpenAI-compatible de Ollama con httpx (timeout explícito).
    El SDK google.antigravity.Agent no tiene timeout y se bloquea indefinidamente.
    """
    actual_model = normalize_local_model(model)
    payload = {
        "model": actual_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": 0.7,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=600.0) as client:
            resp = await client.post(
                f"{OLLAMA_BASE}/chat/completions",
                json=payload,
            )
            if resp.status_code == 200:
                text = resp.json()["choices"][0]["message"]["content"].strip()
                return ChatResponse(response=text, model_used=f"ollama/{model}", engine="ollama")
            else:
                return ChatResponse(
                    response=f"[ERROR Ollama] HTTP {resp.status_code}: {resp.text[:200]}",
                    model_used=model,
                    engine="error"
                )
    except httpx.TimeoutException:
        return ChatResponse(response=f"[ERROR Ollama] Timeout después de 600s con modelo {model}", model_used=model, engine="error")
    except Exception as e:
        return ChatResponse(response=f"[ERROR Ollama] {str(e)}", model_used=model, engine="error")

class MatchFuseRequest(BaseModel):
    nodes: List[Any]
    model: Optional[str] = None

@router.post("/match_fuse", response_model=ChatResponse)
async def match_fuse(req: MatchFuseRequest):
    prompt = f"""
Act as the Antigravity Match & Fuse v2 pipeline.
Execute these stages:
1. Intention parsing
2. RRF Retrieval
3. Gene decomposition (reasoning, domain, format, tool, policy)
4. Novelty & Eval check

Convert these diagram nodes into a JSON array of AgentCards:
{req.nodes}

OUTPUT EXACTLY a valid JSON array of AgentCard objects. Do NOT use markdown code blocks (```). Just return the raw JSON array (starting with [ and ending with ]).
INTERFACE:
{{
  "id": string,
  "name": string,
  "role": string,
  "description": string, // Detailed system prompt/role description
  "color": string, // hex color
  "noveltyScore": number, // 0.0 to 1.0
  "evalStatus": "PASS" | "FAIL",
  "inputOutputContract": string, // e.g. "IN: Text -> OUT: JSON"
  "requiredTools": string[], // List of tool names
  "health": "green" | "yellow" | "red", // Green if PASS and novelty > 0.8
  "genes": [
    pipeline_roles = [
        {{ "kind": "reasoning" | "domain" | "format" | "tool" | "policy", "value": string }}
  ]
}}
    """
    
    model_name = strip_model_provider(req.model or DEFAULT_LOCAL_MODEL)
    if model_name == "auto":
        model_name = DEFAULT_LOCAL_MODEL
        
    try:
        from backend.services.match_fuse_pipeline import run_match_fuse
        new_agent = await run_match_fuse(req.nodes, model_name=model_name, progress_callback=manager.broadcast)
        text = str(new_agent) if not isinstance(new_agent, str) else new_agent
        return ChatResponse(response=text, model_used=model_name, engine="pipeline")
    except Exception as e:
        return ChatResponse(response=f"[ERROR] {str(e)}", model_used=model_name, engine="error")

from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/activity")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages from UI if any
    except WebSocketDisconnect:
        manager.disconnect(websocket)

class StateTransitionRequest(BaseModel):
    phase: str # "phase1_triage", "phase2_extraction", "phase3_blueprint"
    data: Any

class SwarmExecutionRequest(BaseModel):
    objective: str
    nodes: List[Any]
    edges: List[Any] = []
    model: Optional[str] = f"ollama/{DEFAULT_LOCAL_MODEL}"


class RoomSimulationRequest(BaseModel):
    preset_id: str
    objective: str
    turns: int = 2
    model: Optional[str] = f"ollama/{DEFAULT_LOCAL_MODEL}"


class CharacterCloneRequest(BaseModel):
    name: str
    source_prompt: str
    archetype: Optional[str] = None


@router.get("/rooms/presets")
async def get_room_presets():
    return {"presets": list_room_presets(), "count": len(list_room_presets()), "status": "ok"}


@router.get("/rooms/runs")
async def get_room_runs():
    return {"runs": list_room_runs(), "status": "ok"}


@router.get("/rooms/runs/{run_id}")
async def get_room_run_detail(run_id: str):
    run = get_room_run(run_id)
    if not run:
        return {"status": "not_found", "run": None}
    return {"status": "ok", "run": run}


@router.post("/rooms/simulate")
async def simulate_room_run(req: RoomSimulationRequest):
    run = await simulate_room(
        preset_id=req.preset_id,
        objective=req.objective,
        turns=max(1, min(req.turns, 4)),
        model=req.model,
        broadcast=manager.broadcast,
    )
    return {"status": "ok", "run": run}


@router.get("/characters")
async def get_character_profiles():
    return {"profiles": list_character_profiles(), "status": "ok"}


@router.post("/characters/clone")
async def clone_character_profile(req: CharacterCloneRequest):
    profile = await clone_character(req.name, req.source_prompt, req.archetype or "")
    return {"status": "ok", "profile": profile}


@router.get("/swarm/runs")
async def list_swarm_runs():
    return {"runs": swarm_runtime_service.list_runs()}


@router.get("/swarm/runs/{run_id}")
async def get_swarm_run(run_id: str):
    run = swarm_runtime_service.get_run(run_id)
    if not run:
        return {"status": "not_found", "run": None}
    return {"status": "ok", "run": run}


@router.post("/swarm/execute")
async def execute_swarm(req: SwarmExecutionRequest):
    run = await swarm_runtime_service.execute_swarm(
        objective=req.objective,
        nodes=req.nodes,
        edges=req.edges,
        model=req.model,
        broadcast=manager.broadcast,
    )
    return {"status": "ok", "run": run}

@router.post("/state/transition")
async def transition_state(req: StateTransitionRequest):
    """
    Orchestration point for the State Machine:
    Phase 1: Triage -> Phase 2: Extraction -> Phase 3: Blueprint
    """
    await manager.broadcast({
        "type": "ACTIVITY_LOG",
        "log": {
            "source": "AureliOS Orchestrator",
            "message": f"Iniciando transición a {req.phase}...",
            "status": "PENDING"
        }
    })
    
    result = None
    if req.phase == "phase1_triage":
        result = await run_triage_swarm(req.data)
        # Solo avanzar el tab si el agente aprobó. Si pidió entrevista, quedarse en phase1.
        triage_text = result.get("triage_result", "") if isinstance(result, dict) else str(result)
        if "[ES_APROBADO]" in triage_text:
            await manager.broadcast({"type": "STATE_UPDATE", "tab": "phase2"})
        else:
            await manager.broadcast({"type": "STATE_UPDATE", "tab": "phase1"})
    elif req.phase == "phase2_extraction":
        result = await run_extraction_swarm(req.data)
        await manager.broadcast({"type": "STATE_UPDATE", "tab": "phase3"})
    elif req.phase == "phase3_blueprint":
        result = await run_blueprint_swarm(req.data)
        await manager.broadcast({"type": "STATE_UPDATE", "tab": "okr"})
    else:
        return {"error": "Invalid phase"}
        
    await manager.broadcast({
        "type": "ACTIVITY_LOG",
        "log": {
            "source": "AureliOS Orchestrator",
            "message": f"Transición a {req.phase} completada con éxito.",
            "status": "APPROVED"
        }
    })
    
    return {"status": "success", "phase": req.phase, "result": result}

async def _execute_swarm_pipeline(data_str: str, model: str, pipeline_roles: List[dict]) -> dict:
    context = data_str
    results = []
    
    for role_config in pipeline_roles:
        system_prompt = role_config["system"]
        role_name = role_config["name"]
        
        await manager.broadcast({
            "type": "ACTIVITY_LOG",
            "log": {
                "source": role_name,
                "message": f"Iniciando análisis y generación con {model}...",
                "status": "PENDING"
            }
        })
        
        user_message = f"Contexto actual / Entrada anterior:\n{context}\n\nTu tarea como {role_name}: {role_config['task']}"
        
        is_local = role_config.get("is_local", False) or ":" in model or model in LOCAL_MODELS
        
        if is_local:
            resp = await _call_ollama(user_message, system_prompt, model)
        else:
            resp = await _call_free_ai(user_message, system_prompt, model)
            if resp.engine == "error":
                resp = await _call_ollama(user_message, system_prompt, DEFAULT_LOCAL_MODEL)
                
        context = resp.response
        results.append({"role": role_name, "output": context})
        
        await manager.broadcast({
            "type": "ACTIVITY_LOG",
            "log": {
                "source": role_name,
                "message": f"Procesamiento completado exitosamente.",
                "status": "APPROVED"
            }
        })
        
    return {"final_output": context, "steps": results}

async def run_triage_swarm(data: Any):
    """
    Enjambre Radar & Triage - REWIRED TO QUANTUM ENGINE
    """
    input_text = str(data)
    
    agent_ids = [
        "radar-entrevistador",
        "radar-francotirador",
        "radar-analista-viabilidad",
        "radar-profiler"
    ]
    
    friendly_names = {
        "radar-entrevistador": "Entrevistador Socrático",
        "radar-francotirador": "Francotirador de Industria",
        "radar-analista-viabilidad": "Analista de Viabilidad",
        "radar-profiler": "Profiler Psicológico"
    }

    accumulated_context = input_text
    steps = []

    for idx, agent_id in enumerate(agent_ids):
        role_name = friendly_names.get(agent_id, agent_id)
        
        await manager.broadcast({
            "type": "ACTIVITY_LOG",
            "log": {
                "source": role_name,
                "message": f"Analizando intención desde el sub-espacio {agent_id}...",
                "status": "PENDING"
            }
        })
        
        # Override for the final agent to strictly output the routing tag
        override_instructions = None
        if idx == len(agent_ids) - 1:
            if "Respuestas del usuario:" not in input_text and "--- [Respuesta" not in input_text:
                # Es el primer mensaje. PROHIBIDO aprobar.
                override_instructions = (
                    "IMPORTANTE: Eres el nodo final del Enjambre Radar (Triage). El usuario acaba de dar su idea inicial.\n"
                    "ES OBLIGATORIO que formules un cuestionario/entrevista de 3 a 5 preguntas clave para definir la arquitectura y alcances de su idea.\n"
                    "CIERRA tu respuesta OBLIGATORIAMENTE con esta etiqueta exacta en la última línea: [ES_ENTREVISTA]\n"
                    "Bajo ninguna circunstancia puedes aprobar la idea aún. Habla directo a Benner."
                )
            else:
                # El usuario ya respondió
                override_instructions = (
                    "IMPORTANTE: Eres el nodo final del Enjambre Radar (Triage). El usuario ya ha interactuado contigo.\n"
                    "1. Si el usuario te hace una pregunta o no entiende algo de tu entrevista, CHARLA CON ÉL, resuélvele la duda amablemente y vuelve a formular las preguntas necesarias. Usa la etiqueta: [ES_ENTREVISTA]\n"
                    "2. Analiza sus respuestas a la idea de su app. Si consideras que la idea ya es lo suficientemente madura, clara y técnica para construir un Blueprint, genera un RESUMEN FINAL de requerimientos y usa la etiqueta: [ES_APROBADO]\n"
                    "3. Si aún faltan datos críticos, FORMULA NUEVAS PREGUNTAS. Usa la etiqueta: [ES_ENTREVISTA]\n"
                    "REGLAS CERO: PROHIBIDO inventar respuestas. Tu rol es entrevistar, aclarar dudas o aprobar. Habla directo a Benner siempre poniendo la etiqueta en la ÚLTIMA LÍNEA de tu respuesta."
                )

        is_final_node = (idx == len(agent_ids) - 1)
        target_model = "hermes3:unlocked"

        try:
            resp_text = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                override_instructions=override_instructions,
                model=target_model, # Deja que el Factory decida
                use_tools=False # Evita errores de compatibilidad en Ollama
            )
            
            # --- HARD ENFORCEMENT: Respetar decisión del LLM si no es la primera pasada ---
            if idx == len(agent_ids) - 1:
                is_first_pass = "Respuestas del usuario:" not in input_text and "--- [Respuesta" not in input_text
                
                has_aprobado = "[ES_APROBADO]" in resp_text
                has_entrevista = "[ES_ENTREVISTA]" in resp_text
                
                # Limpiar cualquier tag para evitar duplicados
                resp_text = resp_text.replace("[ES_APROBADO]", "").replace("[ES_ENTREVISTA]", "").strip()
                
                if is_first_pass:
                    resp_text += "\n\n[ES_ENTREVISTA]"
                else:
                    if has_aprobado:
                        resp_text += "\n\n[ES_APROBADO]"
                    elif has_entrevista:
                        resp_text += "\n\n[ES_ENTREVISTA]"
                    else:
                        # Fallback si el LLM local omitió el tag
                        if "?" in resp_text:
                            resp_text += "\n\n[ES_ENTREVISTA]"
                        else:
                            resp_text += "\n\n[ES_APROBADO]"
            
            accumulated_context = f"{accumulated_context}\n\n--- [Aporte de {role_name}] ---\n{resp_text}"
            steps.append({"role": role_name, "output": resp_text})
            
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Análisis de {role_name} completado exitosamente.",
                    "status": "SUCCESS"
                }
            })
        except Exception as e:
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Error: {str(e)}",
                    "status": "ERROR"
                }
            })
            raise e
            
    final_output = steps[-1]["output"]
    return {"triage_result": final_output, "swarm_trace": steps}

async def run_extraction_swarm(data: Any):
    """
    El Enjambre Inquisidor - REWIRED TO QUANTUM ENGINE
    """
    input_text = str(data)
    
    pipeline_roles = [
        {
            "id": "inquisidor-arquitecto",
            "name": "Estratega Principal",
            "prompt": "Eres el Estratega Principal. Defines el plan de accion, estructura o arquitectura de manera fluida y conversacional. Hablas con Benner. PROHIBIDO generar codigo o usar tags XML.\nTAREA: Propon a Benner un plan o estructura de alto nivel. Si faltan datos clave, preguntale de forma natural y detente."
        },
        {
            "id": "inquisidor-red-teamer",
            "name": "Auditor de Riesgos",
            "prompt": "Eres el Auditor de Riesgos. Eres analitico pero cercano, hablas directamente con Benner. Evalúas el plan propuesto por el Estratega buscando puntos debiles.\nTAREA: Critica el plan amigablemente. Encuentra posibles falencias y hazle 1 pregunta de estres a Benner. PROHIBIDO usar tags XML."
        },
        {
            "id": "inquisidor-escribano",
            "name": "Sintetizador",
            "prompt": "Eres el Sintetizador. Tu rol es resumir el plan. PROHIBIDO programar o usar herramientas.\nTAREA: Analiza la discusion. Si hay dudas criticas, presentalas a Benner. Pero si el plan es solido, redacta un Documento de Estrategia final y anade obligatoriamente [READY_FOR_BLUEPRINT] al final de tu mensaje."
        }
    ]

    accumulated_context = input_text
    steps = []

    for idx, role in enumerate(pipeline_roles):
        agent_id = role["id"]
        role_name = role["name"]
        
        await manager.broadcast({
            "type": "ACTIVITY_LOG",
            "log": {
                "source": role_name,
                "message": f"Construyendo blueprint desde sub-espacio {agent_id}...",
                "status": "PENDING"
            }
        })
        
        is_final_node = (idx == len(pipeline_roles) - 1)
        target_model = "hermes3:unlocked"

        try:
            resp_text = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                override_instructions=role["prompt"],
                model=target_model, # Quantum engine routing applies
                use_tools=False
            )
            
            accumulated_context = f"{accumulated_context}\n\n--- [Aporte de {role_name}] ---\n{resp_text}"
            steps.append({"role": role_name, "output": resp_text})
            
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Aporte de {role_name} forjado exitosamente.",
                    "status": "SUCCESS"
                }
            })
        except Exception as e:
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Error: {str(e)}",
                    "status": "ERROR"
                }
            })
            raise e
            
    final_output = steps[-1]["output"]
    return {"extraction_result": final_output, "swarm_trace": steps}

class NeuroSANNodeData(BaseModel):
    name: str
    role: str
    system_prompt: str
    tools: List[str]
    test_queries: List[str]

class NeuroSANNode(BaseModel):
    id: str
    type: str
    data: NeuroSANNodeData

class NeuroSANEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = ""

class BlueprintTopology(BaseModel):
    nodes: List[NeuroSANNode]
    edges: List[NeuroSANEdge]

async def run_blueprint_swarm(data: Any):
    """
    La Forja - REWIRED TO QUANTUM ENGINE
    Generate architecture nodes, edges, agent cards.
    """
    input_text = str(data)
    
    pipeline_roles = [
        {
            "id": "forja-arquitecto",
            "name": "Forjador",
            "prompt": """Eres el "Principal Cognitive Systems Architect".
CONTEXTO: Debes traducir la estrategia del usuario a una topologia estricta de React Flow basada en el patron Neuro-SAN.
REGLA 1 (COT): Usa OBLIGATORIAMENTE etiquetas <thinking> y </thinking> al inicio de tu respuesta para procesar la logica de la arquitectura ANTES del JSON. 
REGLA 2: No uses NINGUN texto conversacional periferico (ni saludos, ni confirmaciones).
REGLA 3: Despues del </thinking>, provee EXACTAMENTE un bloque <json> con el JSON estricto. ESTRICTAMENTE PROHIBIDO USAR NODOS XML PARA LA TOPOLOGIA.
SCHEMA EXACTO DE JSON A GENERAR DENTRO DE <json>:
{
  "nodes": [
    {
      "id": "1",
      "type": "agent",
      "data": {
        "name": "Nombre",
        "role": "Rol",
        "system_prompt": "prompt...",
        "tools": ["tool1"],
        "test_queries": ["q1", "q2", "q3"]
      }
    }
  ],
  "edges": [
    {"id": "e1-2", "source": "1", "target": "2", "label": "routes to"}
  ]
}
"""
        },
        {
            "id": "forja-revisor",
            "name": "Revisor de Cohesión",
            "prompt": """Eres el "Chief Validation Engineer & JSON Guard".
CONTEXTO: Asegura que el output del Arquitecto contenga el bloque <json> intacto y sea JSON valido segun Neuro-SAN.
REGLA 1 (COT): Usa OBLIGATORIAMENTE etiquetas <thinking> y </thinking> para verificar la validez del JSON.
REGLA 2: Devuelve EXACTAMENTE el bloque <json> corregido y formateado.
REGLA 3: PROHIBIDO conversar. CERO saludos."""
        }
    ]

    accumulated_context = input_text
    steps = []

    for idx, role in enumerate(pipeline_roles):
        agent_id = role["id"]
        role_name = role["name"]
        
        await manager.broadcast({
            "type": "ACTIVITY_LOG",
            "log": {
                "source": role_name,
                "message": f"Construyendo blueprint desde sub-espacio {agent_id}...",
                "status": "PENDING"
            }
        })
        
        is_final_node = (idx == len(pipeline_roles) - 1)
        target_model = "hermes3:unlocked"

        try:
            resp_text = await AgentFactory.chat_one_shot(
                agent_id=agent_id,
                user_prompt=accumulated_context,
                override_instructions=role["prompt"],
                model=target_model, # Quantum engine routing applies
                use_tools=False
            )
            
            accumulated_context = f"{accumulated_context}\n\n--- [Aporte de {role_name}] ---\n{resp_text}"
            steps.append({"role": role_name, "output": resp_text})
            
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Aporte de {role_name} forjado exitosamente.",
                    "status": "SUCCESS"
                }
            })
        except Exception as e:
            await manager.broadcast({
                "type": "ACTIVITY_LOG",
                "log": {
                    "source": role_name,
                    "message": f"Error: {str(e)}",
                    "status": "ERROR"
                }
            })
            raise e
            
    final_output = steps[-1]["output"]
    return {"blueprint_result": final_output, "swarm_trace": steps}


