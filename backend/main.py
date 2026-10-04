import os
import sys

# Ensure both project root and backend dir are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import config  # carga .env local (o fallback legacy) antes que todo
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.model_defaults import DEFAULT_LOCAL_MODEL, FREE_AI_FALLBACK_MODEL
from backend.services.atlas_library import ensure_auto_sync_started
from routers import (academy, architecture, authoring, automations,
                     character_clone_runtime, compiler, engine, execute,
                     flowboard, flows, inspector, native_engine, prompts,
                     runtime, search, semantic_search)

app = FastAPI(
    title="Antigravity_OS Backend API",
    description="Backend API for managing agents and execution frameworks.",
    version="10.6.2",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(prompts.router, prefix="/api/v1/prompts")
app.include_router(compiler.router, prefix="/api/v1")
app.include_router(runtime.router, prefix="/api/v1")
app.include_router(flows.router)
app.include_router(architecture.router, prefix="/api/v1")
app.include_router(automations.router, prefix="/api/v1")
app.include_router(native_engine.router, prefix="/api/v1")
app.include_router(semantic_search.router, prefix="/api/v1")
app.include_router(academy.router, prefix="/api/v1/learning")
app.include_router(engine.router, prefix="/api/v1")
from routers.agents_factory import router as agents_factory_router

app.include_router(agents_factory_router, prefix="/api/v1")
app.include_router(authoring.router, prefix="/api/v1")
app.include_router(flowboard.router)
app.include_router(inspector.router)
from routers.studio import router as studio_router

app.include_router(studio_router)
from routers.registries import router as registries_router

app.include_router(registries_router)
app.include_router(character_clone_runtime.router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    import db

    db.init_db()
    from services.academy.catalog_service import CatalogService

    CatalogService.seed_catalog()
    automations.init_scheduler()
    ensure_auto_sync_started()
    # Inicializar ChromaDB y disparar indexación semántica en background
    await semantic_search.startup_semantic()


@app.get("/")
def read_root():
    return {"message": "Welcome to Antigravity_OS Backend", "version": "0.2.0"}


from typing import Any

from pydantic import BaseModel


class FreeChatRequest(BaseModel):
    messages: list[dict[str, Any]]
    files: list[dict[str, Any]] | None = None
    model: str | None = DEFAULT_LOCAL_MODEL


@app.post("/api/v1/studio/freechat_stream")
async def freechat_stream_endpoint(request: FreeChatRequest):
    from fastapi.responses import StreamingResponse
    from services.freechat_pipeline import FreechatPipeline

    pipeline = FreechatPipeline()
    return StreamingResponse(
        pipeline.process_chat_stream(
            request.messages, files=request.files, model=request.model
        ),
        media_type="text/plain",
    )


@app.post("/api/v1/studio/freechat")
async def freechat_endpoint(request: FreeChatRequest):
    from services.freechat_pipeline import FreechatPipeline

    pipeline = FreechatPipeline()
    result = await pipeline.process_chat(
        request.messages, files=request.files, model=request.model
    )
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)


# ==========================================
# SUPERVISOR & BLACKBOARD NEURO-SAN ROUTES
# ==========================================
from services.blackboard_manager import blackboard
from services.supervisor_router import AgentCard, SupervisorRouter


class SupervisorRequest(BaseModel):
    task_description: str
    agents: list[dict]


@app.post("/api/v1/orchestration/supervisor")
async def supervisor_route(request: SupervisorRequest):
    router = SupervisorRouter(use_llm=False)
    # Convert dict to AgentCard
    agent_cards = [AgentCard(**a) for a in request.agents]
    selected_agent = router.route_task(request.task_description, agent_cards)
    return {"assigned_agent": selected_agent.dict() if selected_agent else None}


class BlackboardItem(BaseModel):
    key: str
    value: Any


@app.post("/api/v1/orchestration/blackboard")
async def set_blackboard(item: BlackboardItem):
    blackboard.set(item.key, item.value)
    return {"status": "success", "blackboard": blackboard.get_all()}


@app.get("/api/v1/orchestration/blackboard")
async def get_blackboard():
    return {"blackboard": blackboard.get_all()}


@app.get("/api/v1/health/engines")
async def health_engines():
    """Verifica el estado de todos los motores de IA disponibles."""
    import os

    import httpx

    results = {"ollama": False, "free_ai": False, "gemini": False}

    # Check Ollama
    try:
        async with httpx.AsyncClient(timeout=2.0) as c:
            r = await c.get("http://127.0.0.1:11434/api/tags")
            if r.status_code == 200:
                models = [m["name"] for m in r.json().get("models", [])]
                results["ollama"] = any("hermes" in m or "qwen" in m for m in models)
                results["ollama_models"] = models
    except Exception:
        pass

    # Check Free.AI
    free_ai_key = os.getenv("FREE_AI_API_KEY", "")
    if free_ai_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as c:
                r = await c.post(
                    "https://api.free.ai/v1/chat/completions",
                    json={
                        "model": FREE_AI_FALLBACK_MODEL,
                        "messages": [{"role": "user", "content": "ping"}],
                    },
                    headers={
                        "Authorization": f"Bearer {free_ai_key}",
                        "Content-Type": "application/json",
                    },
                )
                results["free_ai"] = r.status_code == 200
        except Exception:
            pass

    return results
