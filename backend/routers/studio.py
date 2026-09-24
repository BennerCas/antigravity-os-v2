
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any, Optional
import httpx
import os
from google.antigravity import Agent, CapabilitiesConfig
from google.antigravity.connections.local.local_openai_connection_config import LocalOpenAIAgentConfig

router = APIRouter(prefix="/api/v1/studio", tags=["Studio"])

FREE_AI_BASE = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")
FREE_AI_KEY  = os.getenv("FREE_AI_API_KEY", "")
OLLAMA_BASE  = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")

# Modelos NUBE (Free.AI)
NUBE_MODELS = {
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "meta-llama/llama-3.1-70b-instruct",
    "qwen/qwen-2.5-72b-instruct",
}

# Modelos LOCAL (Ollama)
LOCAL_MODELS = {
    "hermes3:8b", "llama3.1:8b", "mistral", "qwen2.5:7b", "phi3:3.8b"
}

from backend.services.agent_factory import _cargar_perfil_agente

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "anthropic/claude-3.5-sonnet"
    system: Optional[str] = None
    agent_id: Optional[str] = "aurelios-core"

class ChatResponse(BaseModel):
    response: str
    model_used: str
    engine: str

@router.post("/chat", response_model=ChatResponse)
async def studio_chat(req: ChatRequest):
    model = req.model or "anthropic/claude-3.5-sonnet"
    model = model.replace("free.ai/", "").replace("ollama/", "")
    is_local = model in LOCAL_MODELS or ":" in model

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
            result = await _call_ollama(req.message, system_prompt, "hermes3:8b")
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
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": 0.7,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
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
        return ChatResponse(response=f"[ERROR Ollama] Timeout después de 120s con modelo {model}", model_used=model, engine="error")
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
    
    model_name = req.model or "qwen3-8b"
    model_name = model_name.replace("free.ai/", "").replace("ollama/", "")
    if model_name == "auto":
        model_name = "qwen3-8b"
        
    try:
        from backend.services.match_fuse_pipeline import run_match_fuse
        new_agent = await run_match_fuse(req.nodes, model_name=model_name)
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
        
        user_message = f"Contexto actual / Entrada anterior:\n{context}\n\nTu tarea como {role_name}: {role_config['task']}"
        
        is_local = role_config.get("is_local", False) or ":" in model or model in LOCAL_MODELS
        
        if is_local:
            resp = await _call_ollama(user_message, system_prompt, model)
        else:
            resp = await _call_free_ai(user_message, system_prompt, model)
            if resp.engine == "error":
                resp = await _call_ollama(user_message, system_prompt, "hermes3:8b")
                
        context = resp.response
        results.append({"role": role_name, "output": context})
        
    return {"final_output": context, "steps": results}

async def run_triage_swarm(data: Any):
    """
    Enjambre Radar & Triage
    """
    
    
    pipeline_roles = [
        {
            "name": "Clasificador",
            "system": "Eres el Clasificador de Triage. Tu tono es ultra natural, humano, directo y conversacional. El usuario se llama Benner. Dirígete a él por su nombre. JAMÁS uses tercera persona como 'el humano' ni etiquetas raras como [RESPONSE].",
            "task": "Debes elegir UN solo camino:\nCAMINO 1 (Faltan detalles): Hazle a Benner máximo 2 preguntas integradas en una charla natural para entender qué quiere construir. Si eliges este camino, DEBES añadir al final la etiqueta: [ES_ENTREVISTA].\nCAMINO 2 (Idea completa y técnica): No hagas preguntas. Haz un breve resumen amigable de la arquitectura a construir y DEBES añadir al final la etiqueta: [ES_APROBADO]."
        },

        {
            "name": "Especialista de Seguridad",
            "system": "Eres el Especialista de Seguridad. Actúas como el filtro final antes de hablar con Benner.",
            "task": "REGLA DE ORO: Si el Clasificador eligió el CAMINO 1 (usó [ES_ENTREVISTA]), repite las preguntas de forma natural y añade al final OBLIGATORIAMENTE [ES_ENTREVISTA]. Si el Clasificador eligió el CAMINO 2 (usó [ES_APROBADO]), repite el resumen y añade al final OBLIGATORIAMENTE [ES_APROBADO]. PROHIBIDO mezclar las etiquetas."
        }
    ]
    model = data.get("model", "anthropic/claude-3.5-sonnet") if isinstance(data, dict) else "anthropic/claude-3.5-sonnet"
    model = model.replace("free.ai/", "").replace("ollama/", "")
    
    result = await _execute_swarm_pipeline(str(data), model, pipeline_roles)
    return {"triage_result": result["final_output"], "swarm_trace": result["steps"]}

async def run_extraction_swarm(data: Any):
    """
    El Enjambre Inquisidor
    Pipeline: Arquitecto -> Red Teamer -> Escribano
    """
    
    pipeline_roles = [
        {
            "name": "Arquitecto",
            "system": "Eres el Arquitecto de IA. Defines la estructura técnica de manera fluida y conversacional. Hablas directamente con el usuario, que se llama Benner. PROHIBIDO generar código o usar tags XML.",
            "task": "Propone a Benner una arquitectura de alto nivel. Si faltan datos técnicos clave, pregúntale de forma natural en medio de la charla y detente."
        },

        {
            "name": "Red Teamer",
            "system": "Eres el Red Teamer. Eres analítico pero cercano, hablas directamente con Benner. Buscas romper la arquitectura sin usar código.",
            "task": "Critica la arquitectura amigablemente. Encuentra cuellos de botella y hazle 1 pregunta de estrés a Benner. PROHIBIDO usar tags XML."
        },

        {
            "name": "Escribano",
            "system": "Eres el Escribano. Sintetizas la arquitectura. PROHIBIDO programar o usar herramientas.",
            "task": "REGLA DE ORO: Si hicieron preguntas, preséntalas a Benner en un párrafo amigable y fluido. Si hay consenso, redacta el Documento de Arquitectura y añade obligatoriamente [READY_FOR_BLUEPRINT] al final."
        }
    ]
    model = data.get("model", "anthropic/claude-3.5-sonnet") if isinstance(data, dict) else "anthropic/claude-3.5-sonnet"
    model = model.replace("free.ai/", "").replace("ollama/", "")
    
    result = await _execute_swarm_pipeline(str(data), model, pipeline_roles)
    return {"extraction_result": result["final_output"], "swarm_trace": result["steps"]}

async def run_blueprint_swarm(data: Any):
    """
    La Forja
    Generate architecture nodes, edges, agent cards.
    """
    
    pipeline_roles = [
        {
            "name": "Forjador",
            "system": "Eres el Forjador (System Designer). Tu rol es traducir la arquitectura aprobada en nodos visuales, aristas y perfiles de agentes para el motor Antigravity. PROHIBIDO usar XML como <THINKING> o <tool_call>.",
            "task": "Genera el diseño final. DEBES devolver EXACTAMENTE tres bloques etiquetados así: <nodes> [array de objetos JSON con id, tipo, label] </nodes>, <edges> [array de objetos JSON con id, source, target, label] </edges>, <agents> [array de objetos JSON con name, role, system] </agents>."
        },

        {
            "name": "Revisor de Cohesión",
            "system": "Eres el Revisor de Cohesión (Auditor Cero-Trust). Validarás que el código de la Forja esté limpio. PROHIBIDO programar o alucinar tool_calls.",
            "task": "Valida que los bloques <nodes>, <edges> y <agents> sean JSON válido y estén presentes. No elimines los bloques generados por el Forjador. Solo corrige JSON roto y devuelve los tres bloques intactos o mejorados."
        }
    ]
    model = data.get("model", "anthropic/claude-3.5-sonnet") if isinstance(data, dict) else "anthropic/claude-3.5-sonnet"
    model = model.replace("free.ai/", "").replace("ollama/", "")
    
    result = await _execute_swarm_pipeline(str(data), model, pipeline_roles)
    return {"blueprint_result": result["final_output"], "swarm_trace": result["steps"]}
