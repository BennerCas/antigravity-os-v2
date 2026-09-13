"""
Router: /api/v1/agents
Endpoints para el sistema universal de AgentFactory.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/agents", tags=["Agent Factory"])

class AgentChatRequest(BaseModel):
    agent_id: str
    message: str
    atlas_knowledge_id: Optional[str] = None
    override_instructions: Optional[str] = None
    history: list = []
    model: Optional[str] = None

class SwarmChatRequest(BaseModel):
    agent_ids: List[str]
    message: str
    atlas_knowledge_id: Optional[str] = None

@router.post("/chat")
async def agent_chat(req: AgentChatRequest):
    """Invoca cualquier agente del catalogo con un mensaje."""
    try:
        try:
            from services.agent_factory import AgentFactory
        except ImportError:
            from backend.services.agent_factory import AgentFactory
        
        history_context = ""
        if req.history:
            lines = []
            for msg in req.history:
                if isinstance(msg, dict):
                    lines.append(f"{msg.get('role','user').capitalize()}: {msg.get('content','')}")
                else:
                    lines.append(str(msg))
            history_context = "Historial:\n" + "\n".join(lines) + "\n\n"
        
        user_prompt = f"{history_context}Mensaje: {req.message}"
        
        result = await AgentFactory.chat_one_shot(
            agent_id=req.agent_id,
            user_prompt=user_prompt,
            atlas_knowledge_id=req.atlas_knowledge_id,
            override_instructions=req.override_instructions,
            model=req.model,
        )
        return {"agent_id": req.agent_id, "response": result, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/swarm")
async def swarm_chat(req: SwarmChatRequest):
    """Ejecuta un enjambre de agentes en cadena."""
    try:
        try:
            from services.agent_factory import AgentFactory
        except ImportError:
            from backend.services.agent_factory import AgentFactory
        results = await AgentFactory.swarm_chat(
            agent_ids=req.agent_ids,
            user_prompt=req.message,
            atlas_knowledge_id=req.atlas_knowledge_id,
        )
        return {"results": results, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tools")
def list_tools():
    """Lista todas las herramientas del Tool Registry."""
    try:
        try:
            from services.agent_factory import TOOL_REGISTRY
        except ImportError:
            from backend.services.agent_factory import TOOL_REGISTRY
        tools = [{"name": fn.__name__, "description": fn.__doc__ or ""} for fn in TOOL_REGISTRY]
        return {"tools": tools, "count": len(tools)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
