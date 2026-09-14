"""
studio.py — Endpoint del Motor Híbrido para AureliOS Studio
Usa: Free.AI (nube) → Ollama (local) según el modelo seleccionado por el usuario.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import httpx
import os

router = APIRouter(prefix="/api/v1/studio", tags=["Studio"])

FREE_AI_BASE = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")
FREE_AI_KEY  = os.getenv("FREE_AI_API_KEY", "")
OLLAMA_BASE  = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

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


class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = "anthropic/claude-3.5-sonnet"
    system: Optional[str] = "Eres AureliOS, un asistente de IA avanzado. Responde siempre en el mismo idioma del usuario, con formato Markdown claro."


class ChatResponse(BaseModel):
    response: str
    model_used: str
    engine: str   # "free.ai" | "ollama" | "error"


@router.post("/chat", response_model=ChatResponse)
async def studio_chat(req: ChatRequest):
    """
    Motor híbrido de chat:
    - Modelos NUBE → Free.AI API (api.free.ai/v1)
    - Modelos LOCAL → Ollama local (127.0.0.1:11434)
    - Si el modelo nube falla → fallback a Ollama
    """
    model = req.model or "anthropic/claude-3.5-sonnet"
    # Normalizar: quitar prefijo "free.ai/" si viene del frontend legacy
    model = model.replace("free.ai/", "")
    
    is_local = model in LOCAL_MODELS or ":" in model

    if is_local:
        return await _call_ollama(req.message, req.system or "", model)
    else:
        # Intentar Free.AI primero, luego Ollama como fallback
        result = await _call_free_ai(req.message, req.system or "", model)
        if result.engine == "error":
            # Fallback al mejor modelo local disponible
            result = await _call_ollama(req.message, req.system or "", "hermes3:8b")
        return result


async def _call_free_ai(user: str, system: str, model: str) -> ChatResponse:
    if not FREE_AI_KEY:
        return ChatResponse(response="[ERROR] FREE_AI_API_KEY no configurada en el backend.", model_used=model, engine="error")

    headers = {
        "Authorization": f"Bearer {FREE_AI_KEY}",
        "Content-Type": "application/json"
    }

    # Free.AI en api.free.ai/v1 solo acepta estos modelos propios
    # Todos los modelos NUBE del UI se mapean al mejor disponible
    FREE_AI_VALID_MODELS = ["qwen3-8b", "qwen7b"]

    payload = {
        "model": FREE_AI_VALID_MODELS[0],  # qwen3-8b es el mejor
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user}
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
    }

    for m in FREE_AI_VALID_MODELS:
        payload["model"] = m
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(f"{FREE_AI_BASE}/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    return ChatResponse(response=text, model_used=f"free.ai/{model} (via {m})", engine="free.ai")
                if resp.status_code in (429, 402, 403, 404):
                    continue
                resp.raise_for_status()
        except Exception:
            continue

    return ChatResponse(response="[Free.AI] Todos los modelos fallaron, usando local...", model_used=model, engine="error")


async def _call_ollama(user: str, system: str, model: str) -> ChatResponse:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user}
        ],
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 2048, "num_ctx": 4096}
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(f"{OLLAMA_BASE}/api/chat", json=payload)
            resp.raise_for_status()
            text = resp.json()["message"]["content"].strip()
            return ChatResponse(response=text, model_used=f"ollama/{model}", engine="ollama")
    except Exception as e:
        return ChatResponse(
            response=f"[ERROR Ollama] {str(e)}\n\nAsegúrate de que Ollama está corriendo: `ollama serve`",
            model_used=model,
            engine="error"
        )

from typing import List, Any
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

class MatchFuseRequest(BaseModel):
    nodes: List[Any]
    model: Optional[str] = None

@router.post("/match_fuse", response_model=ChatResponse)
async def match_fuse(req: MatchFuseRequest):
    """
    Uses the google.antigravity SDK (Free.AI API) to execute the Match & Fuse v2 pipeline.
    """
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
    {{ "kind": "reasoning" | "domain" | "format" | "tool" | "policy", "value": string }}
  ]
}}
    """

    from google.antigravity.connections.local.local_openai_connection_config import LocalOpenAIAgentConfig
    
    # Limpiar prefijo free.ai/ si existe
    model_name = req.model or "qwen3-8b"
    model_name = model_name.replace("free.ai/", "")

    os.environ["OPENAI_API_KEY"] = os.getenv("FREE_AI_API_KEY", "")
    
    config = LocalOpenAIAgentConfig(
        base_url=os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1"),
        model=model_name,
        system_instructions="You are the Antigravity OS core logic. Respond ONLY with the requested JSON array.",
        tools=[],
        capabilities=CapabilitiesConfig(enable_subagents=False),
        env={"OPENAI_API_KEY": os.getenv("FREE_AI_API_KEY", "")}
    )
        
    try:
        async with Agent(config) as agent:
            response = await agent.chat(prompt)
            text = await response.text()
            return ChatResponse(response=text, model_used=f"free.ai/{model_name} (via SDK)", engine="sdk")
    except Exception as e:
        return ChatResponse(
            response=f"[ERROR SDK] {str(e)}",
            model_used=f"free.ai/{model_name} (via SDK)",
            engine="error"
        )

from typing import List, Any
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

class MatchFuseRequest(BaseModel):
    nodes: List[Any]
    model: Optional[str] = None

@router.post("/match_fuse", response_model=ChatResponse)
async def match_fuse(req: MatchFuseRequest):
    """
    Uses the google.antigravity SDK to execute the Match & Fuse v2 pipeline.
    """
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
    {{ "kind": "reasoning" | "domain" | "format" | "tool" | "policy", "value": string }}
  ]
}}
    """

    config = LocalAgentConfig(
        api_key=os.getenv("GEMINI_API_KEY", "invalid"),
        system_instructions="You are the Antigravity OS core logic. Respond ONLY with the requested JSON array.",
        tools=[],
        capabilities=CapabilitiesConfig(enable_subagents=False),
        model=None
    )
    
    # Avoid Base URL conflict with SDK
    if "GEMINI_API_BASE_URL" in os.environ:
        del os.environ["GEMINI_API_BASE_URL"]
        
    try:
        async with Agent(config) as agent:
            response = await agent.chat(prompt)
            text = await response.text()
            return ChatResponse(response=text, model_used="google.antigravity_sdk", engine="sdk")
    except Exception as e:
        return ChatResponse(
            response=f"[ERROR SDK] {str(e)}",
            model_used="google.antigravity_sdk",
            engine="error"
        )
