from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config  # carga .env local (o fallback legacy) antes que todo
from routers import execute, search, prompts, builder_actions, vault, compiler, runtime, flows, architecture, automations, coding, native_engine, semantic_search, builder_v1

app = FastAPI(
    title="Antigravity_OS Backend API",
    description="Backend API for managing agents and execution frameworks.",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(prompts.router, prefix="/api/v1/prompts")
app.include_router(builder_actions.router, prefix="/api/v1")
app.include_router(vault.router, prefix="/api/v1")
app.include_router(compiler.router, prefix="/api/v1")
app.include_router(runtime.router, prefix="/api/v1")
app.include_router(flows.router)
app.include_router(architecture.router, prefix="/api/v1")
app.include_router(automations.router, prefix="/api/v1")
app.include_router(coding.router, prefix="/api/v1")
app.include_router(native_engine.router, prefix="/api/v1")
app.include_router(semantic_search.router, prefix="/api/v1")
app.include_router(builder_v1.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    import db
    db.init_db()
    automations.init_scheduler()
    # Inicializar ChromaDB y disparar indexación semántica en background
    await semantic_search.startup_semantic()

@app.get("/")
def read_root():
    return {"message": "Welcome to Antigravity_OS Backend", "version": "0.2.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
