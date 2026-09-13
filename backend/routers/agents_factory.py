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
    Retorna sugerencias en lenguaje natural usando busqueda semantica/keywords combinada.
    """
    try:
        try:
            from services.agent_factory import AgentFactory, SKILLS_PATH, PROMPTS_PATH
        except ImportError:
            from backend.services.agent_factory import AgentFactory, SKILLS_PATH, PROMPTS_PATH

        import json, os, re

        skills = []
        if os.path.exists(SKILLS_PATH):
            try:
                with open(SKILLS_PATH, encoding='utf-8') as f:
                    skills = json.load(f)
            except Exception:
                pass

        prompts = []
        if os.path.exists(PROMPTS_PATH):
            try:
                with open(PROMPTS_PATH, encoding='utf-8') as f:
                    prompts = json.load(f)
            except Exception:
                pass

        stopwords = {"un", "una", "el", "la", "los", "las", "de", "del", "que", "para", "por", "en", "con", "a", "al", "y", "o", "quiero", "necesito", "busco", "agente", "conocimiento", "prompt", "experto", "asistente", "sistema"}
        query_words = [w for w in re.findall(r'\w+', req.query.lower()) if w not in stopwords]
        
        if not query_words:
            query_words = [w for w in re.findall(r'\w+', req.query.lower())]

        def score_agent(agent):
            if not isinstance(agent, dict): return -1
            s = 0
            name = (agent.get('name') or agent.get('id', '')).lower()
            cat = agent.get('category', '').lower()
            desc = agent.get('description', '').lower()
            for w in query_words:
                if w in name: s += 10
                if w in cat: s += 5
                if w in desc: s += 1
            return s

        def score_prompt(p):
            if not isinstance(p, dict): return -1
            s = 0
            title = p.get('title', '').lower()
            cat = p.get('category', '').lower()
            content = p.get('content', '')[:1000].lower()
            for w in query_words:
                if w in title: s += 10
                if w in cat: s += 5
                if w in content: s += 1
            return s

        skills.sort(key=score_agent, reverse=True)
        top_skills = [a for a in skills[:15] if isinstance(a, dict)]
        
        prompts.sort(key=score_prompt, reverse=True)
        top_prompts = [p for p in prompts[:15] if isinstance(p, dict)]

        context_info = req.context or 'todos'

        search_prompt = f"""El usuario busca: \"{req.query}\"
Contexto: {context_info}

CATÁLOGO FILTRADO (Top coincidencias):

AGENTES:
{json.dumps([{"nombre": a.get('name') or a.get('id',''), "categoria": a.get('category',''), "descripcion": str(a.get('description',''))[:60]} for a in top_skills], ensure_ascii=False, indent=1)}

KNOWLEDGE BASE:
{json.dumps([{"titulo": p.get('title',''), "categoria": p.get('category','')} for p in top_prompts], ensure_ascii=False, indent=1)}

INSTRUCCION: Basandote EXCLUSIVAMENTE en la consulta del usuario y el catalogo filtrado de arriba, responde en español con:
1. Una breve explicacion de cómo estos elementos ayudan al usuario (1 oracion)
2. Lista de 3-5 agentes MAS relevantes con sus nombres EXACTOS
3. Lista de 2-3 KB MAS relevantes con sus titulos EXACTOS
Tu respuesta debe ser limpia y usar EXACTAMENTE los nombres/titulos provistos en el catalogo para que la interfaz pueda encontrarlos."""

        response = await AgentFactory.chat_one_shot(
            agent_id="agentos_assistant",
            user_prompt=search_prompt,
            override_instructions="Eres un asistente experto en recomendar agentes IA y bases de conocimiento de un catalogo. Responde siempre en español de forma hiperconcisa y usa los nombres exactos."
        )
        return {"query": req.query, "response": response, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
