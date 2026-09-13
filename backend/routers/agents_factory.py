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


class OptimizeAgentRequest(BaseModel):
    agent_id: str
    instructions: Optional[str] = None

class OptimizeKBRequest(BaseModel):
    kb_title: str
    content: str

class SearchAssistRequest(BaseModel):
    query: str
    context: Optional[str] = None  # 'agents' | 'kb' | 'teams' | None


@router.post("/optimize")
async def optimize_agent(req: OptimizeAgentRequest):
    """
    Mejora las instrucciones de un agente usando AgentFactory.
    Si el agente existe en skills_v2.json, usa sus instrucciones actuales.
    Retorna las instrucciones mejoradas.
    """
    try:
        try:
            from services.agent_factory import AgentFactory, _cargar_perfil_agente
        except ImportError:
            from backend.services.agent_factory import AgentFactory, _cargar_perfil_agente

        current_instructions = req.instructions or _cargar_perfil_agente(req.agent_id)

        optimization_prompt = f"""Eres un experto en optimizacion de prompts de IA. 
        
 Analiza las siguientes instrucciones de un agente y mejóralas para que sean:
 - Mas claras y especificas
 - Con mejor estructura (usar secciones con ##)
 - Mas efectivas para el objetivo del agente
 - En español cuando sea posible
 
 INSTRUCCIONES ACTUALES DEL AGENTE '{req.agent_id}':
 {current_instructions[:2000]}
 
 PROPORCIONA SOLO LAS INSTRUCCIONES MEJORADAS, sin explicaciones adicionales."""

        improved = await AgentFactory.chat_one_shot(
            agent_id="system_optimizer",
            user_prompt=optimization_prompt,
            override_instructions="Eres un experto en ingenieria de prompts. Tu unica tarea es mejorar y optimizar instrucciones de agentes IA. Responde SOLO con las instrucciones mejoradas."
        )
        return {"agent_id": req.agent_id, "improved": improved, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize-kb")
async def optimize_kb(req: OptimizeKBRequest):
    """
    Mejora el contenido de un Master Prompt de Atlas KB.
    Retorna el contenido mejorado.
    """
    try:
        try:
            from services.agent_factory import AgentFactory
        except ImportError:
            from backend.services.agent_factory import AgentFactory

        optimization_prompt = f"""Eres un experto en ingenieria de prompts maestros.
        
Analiza el siguiente Master Prompt y mejoralo para que sea:
- Mas completo y detallado
- Con mejor estructura profesional
- Mas efectivo como contexto de conocimiento para agentes IA
- Incluir ejemplos donde sea util

TITULO: {req.kb_title}

CONTENIDO ACTUAL:
{req.content[:3000]}

PROPORCIONA SOLO EL CONTENIDO MEJORADO, sin explicaciones adicionales."""

        improved = await AgentFactory.chat_one_shot(
            agent_id="system_optimizer",
            user_prompt=optimization_prompt,
            override_instructions="Eres un experto en ingenieria de prompts maestros. Tu unica tarea es mejorar Master Prompts de bases de conocimiento. Responde SOLO con el contenido mejorado."
        )
        return {"kb_title": req.kb_title, "improved": improved, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search-assist")
async def search_assist(req: SearchAssistRequest):
    """
    Asistente IA para buscar agentes o KB relevantes para una consulta.
    Retorna sugerencias en lenguaje natural.
    """
    try:
        try:
            from services.agent_factory import AgentFactory, SKILLS_PATH, PROMPTS_PATH
        except ImportError:
            from backend.services.agent_factory import AgentFactory, SKILLS_PATH, PROMPTS_PATH

        import json, os

        # Cargar catalogo resumido
        agents_catalog = []
        if os.path.exists(SKILLS_PATH):
            try:
                with open(SKILLS_PATH, encoding='utf-8') as f:
                    skills = json.load(f)
                agents_catalog = [{"name": s.get("name", s.get("id")), "category": s.get("category", ""), "desc": s.get("description", "")[:80]} for s in skills[:100]]
            except Exception:
                pass

        prompts_catalog = []
        if os.path.exists(PROMPTS_PATH):
            try:
                with open(PROMPTS_PATH, encoding='utf-8') as f:
                    prompts = json.load(f)
                prompts_catalog = [{"title": p.get("title"), "category": p.get("category", "")} for p in prompts[:100]]
            except Exception:
                pass

        context_info = req.context or 'todos'

        search_prompt = f"""El usuario busca: "{req.query}"
        
Tienes acceso a este catalogo:

AGENTES DISPONIBLES (primeros 100):
{json.dumps(agents_catalog[:50], ensure_ascii=False, indent=1)}

KNOWLEDGE BASE DISPONIBLES (primeros 100):
{json.dumps(prompts_catalog[:50], ensure_ascii=False, indent=1)}

Contexto de busqueda: {context_info}

Responde en español sugiriendo los 3-5 agentes o KB mas relevantes para la consulta del usuario. 
Se conciso. Menciona los nombres exactos de los agentes/KB. Explica brevemente por que cada uno es relevante."""

        response = await AgentFactory.chat_one_shot(
            agent_id="agentos_assistant",
            user_prompt=search_prompt,
            override_instructions="Eres un asistente experto en recomendar agentes IA y bases de conocimiento. Responde siempre en español, de forma concisa y util."
        )
        return {"query": req.query, "response": response, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
