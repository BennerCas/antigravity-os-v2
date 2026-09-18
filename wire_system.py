import json
import os
import re

# 1. Update studio.py to support loading the agent's real profile
STUDIO_PY_PATH = "backend/routers/studio.py"
with open(STUDIO_PY_PATH, "r", encoding="utf-8") as f:
    studio_py = f.read()

# Change ChatRequest to accept agent_id
studio_py = re.sub(
    r'class ChatRequest\(BaseModel\):\n    message: str\n    model: Optional\[str\] = ".*?"\n    system: Optional\[str\] = ".*?"',
    'class ChatRequest(BaseModel):\n    message: str\n    model: Optional[str] = "anthropic/claude-3.5-sonnet"\n    agent_id: Optional[str] = "aurelios-core"\n    system: Optional[str] = None',
    studio_py
)

# Update studio_chat to use agent_id from DB
studio_chat_replacement = """@router.post("/chat", response_model=ChatResponse)
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
        return result"""

studio_py = re.sub(
    r'@router\.post\("/chat", response_model=ChatResponse\)\nasync def studio_chat\(req: ChatRequest\):.*?return result',
    studio_chat_replacement,
    studio_py,
    flags=re.DOTALL
)

with open(STUDIO_PY_PATH, "w", encoding="utf-8") as f:
    f.write(studio_py)

# 2. Update AgentOSStudio.tsx
STUDIO_TSX_PATH = "apps/web-app/src/pages/AgentOSStudio.tsx"
with open(STUDIO_TSX_PATH, "r", encoding="utf-8") as f:
    studio_tsx = f.read()

# Add a state for the selected grid agent
if "const [selectedAgentId, setSelectedAgentId] = useState('aurelios-core');" not in studio_tsx:
    studio_tsx = studio_tsx.replace(
        "const [showSetup, setShowSetup] = useState(false);",
        "const [showSetup, setShowSetup] = useState(false);\n  const [selectedAgentId, setSelectedAgentId] = useState('aurelios-core');"
    )

# Inject IDs into aiTools
studio_tsx = studio_tsx.replace(
    "title: 'Swarm Orchestrator'",
    "id: 'swarm-orchestrator', title: 'Swarm Orchestrator'"
).replace(
    "title: 'Umpire Core'",
    "id: 'umpire-core', title: 'Umpire Core'"
).replace(
    "title: 'State Reducer'",
    "id: 'state-reducer', title: 'State Reducer'"
).replace(
    "title: 'RAG Synthesizer'",
    "id: 'rag-synthesizer', title: 'RAG Synthesizer'"
).replace(
    "title: 'Codebase Overlord'",
    "id: 'codebase-overlord', title: 'Codebase Overlord'"
).replace(
    "title: 'Forensic Inspector'",
    "id: 'forensic-inspector', title: 'Forensic Inspector'"
).replace(
    "title: 'Zero-Trust Gatekeeper'",
    "id: 'zero-trust-gatekeeper', title: 'Zero-Trust Gatekeeper'"
).replace(
    "title: 'Resource Optimizer'",
    "id: 'resource-optimizer', title: 'Resource Optimizer'"
).replace(
    "title: 'UX Psychologist'",
    "id: 'ux-psychologist', title: 'UX Psychologist'"
).replace(
    "title: 'Infrastructure Titan'",
    "id: 'infrastructure-titan', title: 'Infrastructure Titan'"
).replace(
    "title: 'API Nexus'",
    "id: 'api-nexus', title: 'API Nexus'"
).replace(
    "title: 'Synthetic QA'",
    "id: 'synthetic-qa', title: 'Synthetic QA'"
)

# Replace the chat API call payload
studio_tsx = re.sub(
    r'body: JSON\.stringify\(\{([\s\S]*?)message: textToSend,([\s\S]*?)model: selectedModel,([\s\S]*?)system: \'.*?\'\s*\}\)',
    r'body: JSON.stringify({\1message: textToSend,\2model: selectedModel,\3agent_id: selectedAgentId })',
    studio_tsx
)

# Make grid clickable
studio_tsx = re.sub(
    r'<div key=\{idx\} className={`flex items-start gap-4 p-4 rounded-xl border \$\{t\.panelBorder\} \$\{t\.toolBg\} \$\{t\.toolHover\} transition-all`}>',
    r'<div key={idx} onClick={() => setSelectedAgentId(tool.id || "aurelios-core")} className={`flex items-start gap-4 p-4 rounded-xl border ${selectedAgentId === tool.id ? "border-cyan-500" : t.panelBorder} ${t.toolBg} hover:cursor-pointer ${t.toolHover} transition-all`}>',
    studio_tsx
)

with open(STUDIO_TSX_PATH, "w", encoding="utf-8") as f:
    f.write(studio_tsx)

print("Wiring completed successfully.")
