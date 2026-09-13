"""
Router: /api/v1/builder/action
Handles all AI-powered Builder button actions: upgrade, atomizar, traducir, editar, logica
Connects to local Ollama (hermes3 / mistral-small) via BennerAI gateway on port 11434
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional
import httpx
import json

import os

# Credenciales centralizadas (backend/.env local, fallback legacy)
import config  # noqa: F401  (carga dotenv al importar)
import db
from routers.search import FLOW_GENERATOR_SYSTEM
from services.master_prompts_v2 import *
from routers.engine import get_config
from routers.engine import get_config

db.init_db()

router = APIRouter(prefix="/builder", tags=["Builder AI Actions"])

OLLAMA_BASE = "http://127.0.0.1:11434"
# FREE.AI config
FREE_AI_BASE = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")
FREE_AI_KEY = os.getenv("FREE_AI_API_KEY")

OLLAMA_FALLBACK = ["qwen2.5-coder-local:latest", "mistral-nemo-local:latest", "qwen3.5:9b"]

# ─── Master Prompts ──────────────────────────────────────────────────────────

MASTER_PROMPTS = {

    "upgrade": """\
SYSTEM:
You are APEX, an elite Prompt Engineering system trained on the internal guidelines of OpenAI, Anthropic, Google DeepMind and the published research on instruction tuning (InstructGPT, Constitutional AI, ReAct, Chain-of-Thought). Your single function in this pipeline is to transform an underperforming prompt into a high-precision instruction set that maximizes accuracy, coherence, structural compliance and output utility on modern LLMs.

You operate under these engineering principles:
- PRINCIPLE OF EXPLICIT INTENT: a model cannot satisfy a goal it must guess. Every objective is stated as a declarative, measurable intention.
- PRINCIPLE OF ROLE GROUNDING: a precise expert persona measurably improves domain vocabulary, reasoning depth and formatting discipline.
- PRINCIPLE OF CONTRACTUAL OUTPUT: the response format is a contract. Define it so strictly that deviation is impossible.
- PRINCIPLE OF COGNITIVE SCAFFOLDING: when reasoning is required, force the model to think step-by-step BEFORE producing the final answer.
- PRINCIPLE OF ANCHORING: 1-2 concrete input/output examples align the model better than paragraphs of abstract description.
- PRINCIPLE OF ZERO AMBIGUITY: every vague term ("good", "nice", "appropriate") is replaced by an observable criterion or an explicit conditional.
- PRINCIPLE OF HONEST UNCERTAINTY: fabrication is a worse failure than admitting ignorance.

USER:
Analyze the following prompt and rewrite it applying ALL of these techniques simultaneously:

1. OBJECTIVE CLARITY — Rewrite the main goal as an explicit intent declaration in the first sentence.
2. EXPERT ROLE — Assign a specific, domain-relevant senior expert role (include years of experience and specialty).
3. CONTEXT SCAFFOLDING — Add the minimal context sections the model needs (audience, constraints, available data).
4. FORMAT CONSTRAINTS — Define exact response structure: sections, ordering, length limits, tone, language, and output format (Markdown/JSON/plain).
5. CHAIN OF THOUGHT — If the task requires reasoning, instruct: "Reason step by step internally before writing the final output; show only the conclusions unless asked."
6. FEW-SHOT ANCHORING — If applicable, embed 1 short input/output example pair inside the prompt.
7. AMBIGUITY ELIMINATION — Replace every vague or subjective term with an observable criterion; add explicit conditional clauses for edge cases ("If X is missing, ask for it instead of assuming").
8. ANTI-HALLUCINATION GUARD — End the prompt with EXACTLY: "RULES: If you are uncertain about any factual claim, explicitly state your uncertainty rather than fabricating information. Never invent policies, prices, dates, error codes or capabilities not present in the input."

PROMPT TO IMPROVE:
{prompt_content}

FINAL INSTRUCTION:
Return ONLY the improved prompt, ready to paste and use. No explanations, no meta-commentary, no wrapping quotes, no markdown fences. The improved prompt must be in the same language as the original prompt.""",

    "atomizar": """\
SYSTEM:
You are APEX-ATOM, a Prompt Variant Synthesizer. Your function is to take an existing prompt and produce ONE atomic variant: a meaningfully different version that pursues the SAME objective through a different strategy, perspective, structure or level of abstraction. Variants are used for A/B testing inside a visual agent workflow, so the variant must be self-contained and immediately usable.

Strategies you may choose from (pick the ONE that adds most value for this prompt):
- STRATEGY SHIFT: same goal, different approach (e.g., analytical -> narrative, top-down -> bottom-up).
- SCOPE NARROWING: convert a broad prompt into a laser-focused single-task instruction.
- SCOPE EXPANSION: convert a narrow prompt into a multi-phase procedure with checkpoints.
- PERSONA ROTATION: same task, radically different expert persona (e.g., engineer -> salesperson).
- RIGOR ESCALATION: add verification steps, self-critique loops and acceptance criteria.
- SIMPLIFICATION: strip a bloated prompt to its essential core without losing the objective.

USER:
Create ONE atomic variant of the following prompt.

RULES:
1. The variant MUST pursue the same fundamental objective as the original.
2. The variant MUST be visibly different in at least one dimension (strategy, scope, persona, structure or rigor).
3. The variant MUST be complete and self-contained: never reference "the original prompt".
4. Preserve any hard constraints present in the original (language, output format, forbidden topics).
5. Keep the same language as the original prompt.
6. Do NOT explain what you changed. Do NOT add commentary, headers, or labels.

ORIGINAL PROMPT:
{prompt_content}

FINAL INSTRUCTION:
Return ONLY the variant prompt text. No additional text whatsoever. The output must be the new prompt, ready to use.""",

    "traducir": """\
SYSTEM:
You are APEX-LING, a senior technical translator specialized in AI prompt engineering, with native-level command of the source and target languages. You translate LLM prompts preserving not only semantic meaning but also pragmatic force: instructions must remain instructions, constraints must remain binding, and output-format contracts must remain exact.

Translation rules you must enforce:
- INSTRUCTIONAL REGISTER: imperatives stay imperative; prohibitions stay prohibitive. Never soften "You must" into "You could".
- TERMINOLOGICAL PRECISION: technical terms (tokens, embeddings, temperature, few-shot, chain-of-thought) use the standard industry term in the target language, or the English term when that is the norm among practitioners.
- FORMAT PRESERVATION: markdown structure, numbered lists, placeholders (e.g. {variable}), code blocks and output schemas are preserved EXACTLY, character for character.
- NO OMISSIONS: every sentence of the source appears in the translation. Nothing is summarized, dropped or added.
- IDIOMATIC NATURALNESS: the result must read as if originally written by a native expert, not as a literal calque.

USER:
Translate the following prompt into {target_language}.

PROMPT TO TRANSLATE:
{prompt_content}

FINAL INSTRUCTION:
Return ONLY the translated prompt. No translator notes, no comments, no language tags, no additional text.""",

    "editar": """\
SYSTEM:
You are APEX-EDITOR, a surgical prompt editing system. You receive (a) an existing prompt and (b) a user edit instruction. Your function is to apply the instruction with minimal, precise changes while preserving everything the user did NOT ask to change.

Operating rules:
- MINIMAL DIFF PRINCIPLE: change only what the instruction explicitly or implicitly requires. Preserve structure, tone, constraints, examples and formatting that are not targeted.
- INTENT OVER LITERALITY: if the instruction is vague ("make it better", "more professional"), infer the most reasonable professional interpretation and apply it coherently across the whole prompt.
- CONSISTENCY PROPAGATION: if your edit introduces a new concept, role, variable or constraint, propagate it consistently through the entire prompt (title, sections, examples, output contract).
- NEVER DROP GUARDRAILS: safety rules, anti-hallucination clauses and output-format contracts are preserved unless the instruction explicitly removes them.
- REGENERATION MODE: if the instruction demands a full rewrite (e.g. "start over", "rewrite from scratch as X"), produce a completely new prompt honoring the instruction and the original objective.

USER:
EDIT INSTRUCTION:
{edit_instruction}

CURRENT PROMPT:
{prompt_content}

FINAL INSTRUCTION:
Return ONLY the edited prompt. No changelog, no explanations, no diff markers, no wrapping quotes. Same language as the current prompt unless the instruction says otherwise.""",

    "logica": """\
SYSTEM:
You are APEX-ANALYST, a prompt forensics specialist. Your function is to explain, with technical precision, WHY a prompt is built the way it is: the intention behind each structural element, which prompt-engineering techniques it uses, where its weaknesses are, and how an LLM is likely to behave when executing it.

Your analysis must be educational and actionable, written for a practitioner who wants to learn prompt engineering by dissecting real examples.

USER:
Analyze the following prompt and produce a structured breakdown in SPANISH with EXACTLY these sections:

### 🎯 Objetivo Central
One sentence: what the prompt is trying to achieve.

### 🧠 Técnicas Detectadas
Bulleted list of prompt-engineering techniques present (role assignment, few-shot, chain-of-thought, output contract, negative constraints, etc.), each with a short quote or reference to the exact fragment where it appears.

### ⚙️ Flujo de Razonamiento Esperado
Step-by-step: how a model will most likely process this prompt internally, in order.

### 💪 Fortalezas
What makes this prompt effective. Be specific; cite fragments.

### ⚠️ Debilidades y Riesgos
Ambiguities, missing constraints, hallucination vectors, token inefficiencies. If none, say so explicitly — never invent flaws.

### 🔧 Recomendación Accionable
ONE concrete improvement that would raise output quality the most, explained in 2-3 sentences.

RULES: Base every claim on text actually present in the prompt. If you are unsure about an intention, mark it as a hypothesis. Write in Spanish. Be concise but complete.

PROMPT TO ANALYZE:
{prompt_content}""",

    "autocompletar": """\
SYSTEM:
You are APEX-ARCHITECT, an expert AI Workflow Architect specializing in multi-agent orchestration (CrewAI, AutoGen, LangGraph). Your function is to analyze a raw user instruction (a prompt written inside one node of a visual agent workflow) and map it to a precise node configuration.

You return ONLY a valid JSON object. No markdown fences, no commentary, no trailing commas.

JSON SCHEMA (exactly these keys):
{
  "title": "Short 2-4 word title for this step, in Spanish, title case",
  "role": "Specific senior professional role, e.g. 'Senior Copywriter B2B', 'Staff Python Engineer', 'Analista SEO Técnico'",
  "framework": "exactly one of: crewai | autogen | langgraph | auto",
  "variables": "comma-separated snake_case variables detected or recommended, e.g. 'tema, idioma, audiencia'. Empty string if none.",
  "reasoning": "1-2 sentences in Spanish explaining WHY this framework and role fit the task"
}

FRAMEWORK SELECTION CRITERIA:
- crewai: collaborative creative/knowledge work — writing, marketing, research teams where role-based agents converse and delegate.
- autogen: engineering, coding, math, tool-use and iterative problem solving between agents.
- langgraph: strict state machines, conditional branching, loops, human-in-the-loop checkpoints.
- auto: simple single-step tasks, or when the graph is too small/ambiguous to justify a specific framework.

USER:
Analyze the following prompt and return the JSON configuration:

PROMPT TO ANALYZE:
{prompt_content}"""
}



# ─── Helpers ─────────────────────────────────────────────────────────────────

FREE_AI_MODELS_CASCADE = [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o",
    "meta-llama/llama-3.1-70b-instruct",
    "qwen/qwen-2.5-72b-instruct"
]

async def call_free_ai(system: str, user: str) -> tuple[str, str]:
    if not FREE_AI_KEY:
        raise Exception("No FREE_AI_API_KEY configured")

    headers = {"Authorization": f"Bearer {FREE_AI_KEY}", "Content-Type": "application/json"}

    def _payload(model: str) -> dict:
        return {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.7,
            "max_tokens": 2048,
        }

    cfg = get_config()
    models_to_try = [cfg["cloud_model"]] + [m for m in cfg["cloud_options"] if m != cfg["cloud_model"]]

    for model in models_to_try:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(f"{FREE_AI_BASE}/chat/completions", json=_payload(model), headers=headers)
                
                # Si el endpoint estándar no existe para ese modelo (como el GPT-4o original en algunas configs)
                if resp.status_code == 404:
                    resp = await client.post(f"{FREE_AI_BASE}/chat/", json=_payload(model), headers=headers)

                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"].strip()
                    return text, f"free.ai/{model}"
                
                # Si es rate limit o falta de saldo, pasa al siguiente
                if resp.status_code in (429, 402, 403):
                    continue
                
                resp.raise_for_status()
        except Exception:
            continue

    raise Exception("All Free.AI models failed")


async def call_ollama_fallback(system: str, user: str, model_override: Optional[str] = None) -> tuple[str, str]:
    """Try Ollama local models as fallback."""
    cfg = get_config()
    base_models = [cfg["local_model"]] + [m for m in cfg["local_options"] if m != cfg["local_model"]]
    models_to_try = [model_override] + base_models if model_override else base_models
    models_to_try = list(dict.fromkeys(models_to_try)) # Deduplicate

    for model in models_to_try:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.7, 
                    "num_predict": 2048,
                    "num_ctx": 4096  # Capped to avoid 17GB KV cache OOM on Hermes3
                }
            }
            async with httpx.AsyncClient(timeout=90) as client:
                resp = await client.post(f"{OLLAMA_BASE}/api/chat", json=payload)
                resp.raise_for_status()
                text = resp.json()["message"]["content"].strip()
                return text, f"ollama/{model}"
        except Exception:
            continue
    raise Exception("All local Ollama models failed or out of memory")


async def call_ai(system: str, user: str, model_override: Optional[str] = None) -> tuple[str, str]:
    """
    Unified AI caller (MOTOR HIBRIDO).
    Priority: Free AI (Cloud API, fast, picks best available model) → Ollama local (fallback).
    Returns (result_text, model_name).
    """
    if model_override:
        # Check if it's a known cloud model
        cfg = get_config()
        if model_override in cfg["cloud_options"]:
            if FREE_AI_KEY:
                # Need a custom call to free ai
                # Just use call_free_ai but hack it temporarily by pushing the model to the top?
                # Actually, call_free_ai doesn't take an override. 
                # Let's just let it fall through but with hybrid enabled?
                pass
            
        else:
            try:
                return await call_ollama_fallback(system, user, model_override)
            except Exception:
                pass

    cfg = get_config()
    hybrid_enabled = cfg.get("hybrid_enabled", True)

    if hybrid_enabled and FREE_AI_KEY:
        try:
            return await call_free_ai(system, user)
        except Exception:
            pass

    # Fallback or hybrid disabled: local Ollama
    return await call_ollama_fallback(system, user, model_override)


# ─── Request / Response Models ────────────────────────────────────────────────

class SuggestNodeRequest(BaseModel):
    prompt_content: str

@router.post("/suggest-node")
async def suggest_node_config(req: SuggestNodeRequest):
    """Uses AI to suggest title, role, framework, variables, and reasoning for a node."""
    if not req.prompt_content.strip():
        return {"title": "Nuevo Nodo", "role": "Asistente", "framework": "auto", "variables": "", "reasoning": "El prompt está vacío."}
        
    master = MASTER_PROMPTS.get("autocompletar")
    filled = master.format(prompt_content=req.prompt_content)
    parts = filled.split("USER:", 1)
    system_part = parts[0].replace("SYSTEM:", "").strip() if len(parts) > 1 else ""
    user_part = parts[1].strip() if len(parts) > 1 else filled

    try:
        import json
        result, _ = await call_ai(system_part, user_part)
        # Clean potential markdown formatting from LLM response
        if result.startswith("```"):
            result = result.split("\n", 1)[1]
            if result.endswith("```"):
                result = result.rsplit("\n", 1)[0]
        data = json.loads(result.strip())
        return data
    except Exception as e:
        return {"error": str(e), "title": "Nodo AI", "role": "Analista", "framework": "auto", "variables": "", "reasoning": "Error al contactar IA."}


class ActionRequest(BaseModel):
    action: Literal["upgrade", "atomizar", "traducir", "editar", "logica"]
    prompt_content: str
    target_language: Optional[str] = "Español"
    edit_instruction: Optional[str] = "Mejora la claridad y precisión"
    model_override: Optional[str] = None


class ActionResponse(BaseModel):
    action: str
    model_used: str
    result: str


# ─── Endpoint ────────────────────────────────────────────────────────────────

@router.post("/action", response_model=ActionResponse)
async def builder_action(request: ActionRequest):
    """
    Execute an AI-powered action using Groq (primary, free API) or local Ollama (fallback).
    Actions: upgrade | atomizar | traducir | editar | logica
    """
    if not request.prompt_content.strip():
        raise HTTPException(status_code=400, detail="prompt_content cannot be empty")

    master = MASTER_PROMPTS.get(request.action)
    if not master:
        raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")

    filled = master.format(
        prompt_content=request.prompt_content,
        target_language=request.target_language or "Español",
        edit_instruction=request.edit_instruction or "Mejora la claridad y precisión"
    )
    parts = filled.split("USER:", 1)
    system_part = parts[0].replace("SYSTEM:", "").strip() if len(parts) > 1 else ""
    user_part = parts[1].strip() if len(parts) > 1 else filled

    try:
        result, model_used = await call_ai(system_part, user_part, request.model_override)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    return ActionResponse(action=request.action, model_used=model_used, result=result)


@router.get("/models")
async def list_available_models():
    """Returns available models: Free AI API + local Ollama."""
    free_ai_models = []
    if FREE_AI_KEY:
        try:
            async with httpx.AsyncClient(timeout=3) as client:
                resp = await client.get(f"{FREE_AI_BASE}/models", headers={"Authorization": f"Bearer {FREE_AI_KEY}"})
                if resp.status_code == 200:
                    json_resp = resp.json()
                    models_data = json_resp.get("data") or json_resp.get("models", [])
                    free_ai_models = [{"name": f"free.ai/{m['id']}", "source": "free.ai"} for m in models_data]
        except Exception:
            free_ai_models = [{"name": "free.ai/auto-best", "source": "free.ai"}]
            
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags")
            ollama_models = [{"name": m["name"], "source": "ollama", "size": m.get("size", 0)}
                             for m in resp.json().get("models", [])]
    except Exception:
        ollama_models = []
    return {"models": free_ai_models + ollama_models}

class AutocompleteRequest(BaseModel):
    title: str
    content: str
    role: str = ""
    framework: str = "auto"
    variables: str = ""

@router.post("/autocomplete_node")
async def autocomplete_node(req: AutocompleteRequest):
    system_prompt = (
        "Eres un Arquitecto de IA Experto de Grado Empresarial. Tu trabajo es tomar el nombre y contexto "
        "de un nodo (agente) y auto-completar su configuración entera para un sistema multi-agente (como CrewAI o AutoGen).\n\n"
        "REGLA OBLIGATORIA: Escribe el 'content' (el prompt principal) en ESPAÑOL para el usuario, "
        "pero **debes** añadir una nota final firme en INGLÉS diciendo: 'RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN ENGLISH.'\n\n"
        "Debes responder **EXCLUSIVAMENTE** con un JSON puro (sin marcas de markdown ```json). El JSON debe contener las siguientes claves:\n"
        "- content: El prompt mejorado (En español, terminando con la nota de reglas en inglés).\n"
        "- role: El rol específico corporativo (ej. 'Senior Data Analyst').\n"
        "- variables: Variables clave inferidas separadas por coma (ej. 'topic, user_query').\n"
        "- framework: El framework ideal ('crewai', 'autogen' o 'langgraph').\n"
        "- llm_model: Sugerencia del mejor modelo para la tarea ('hermes3:8b', 'gpt-4o', etc).\n"
        "- temperature: '0.0' a '1.0' (Cadena de texto).\n"
        "- output_schema: Un pequeño JSON representativo de lo que este agente debería devolver.\n"
    )
    
    user_prompt = f"Nodo Título: {req.title}\nContexto Actual: {req.content}\nRol Actual: {req.role}\nFramework Actual: {req.framework}\nVariables: {req.variables}\n\nAuto-completa y mejora todo en formato JSON puro."
    
    import json
    try:
        result_text, model_name = await call_ai(system_prompt, user_prompt)
        
        # Limpiar posible markdown
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        
        # Intentar parsear el JSON
        try:
            parsed = json.loads(result_text)
            return {"status": "success", "data": parsed}
        except json.JSONDecodeError:
            # Fallback en caso de que el LLM no responda un JSON perfecto
            import re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                return {"status": "success", "data": parsed}
            raise Exception("El LLM no devolvió un JSON válido.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Variantes generadas por IA (biblioteca persistente) ─────────────────────

class VariantPayload(BaseModel):
    id: Optional[str] = None
    node_id: Optional[str] = None
    title: Optional[str] = None
    role: Optional[str] = None
    framework: Optional[str] = None
    variables: Optional[str] = None
    content: Optional[str] = None
    ai_reasoning: Optional[str] = None


@router.post("/variants")
async def save_variant(v: VariantPayload):
    """Persiste una variante/prompt generada por los botones AI en la biblioteca (SQLite)."""
    import time
    data = v.model_dump()
    if not data.get("id"):
        data["id"] = str(int(time.time() * 1000))
    db.variant_save(data)
    return {"status": "saved", "id": data["id"]}


@router.get("/variants")
async def list_variants():
    """Devuelve todas las variantes generadas, más recientes primero."""
    return db.variants_all()


@router.get("/executions")
async def list_executions(limit: int = 50):
    """Historial de ejecuciones del runtime (más recientes primero)."""
    return db.executions_recent(limit)


@router.get("/engine")
async def engine_status():
    """Estado del Motor Hibrido."""
    cfg = get_config()
    hybrid_enabled = cfg.get("hybrid_enabled", True)
    cloud_ready = bool(FREE_AI_KEY)
    local_ready = False
    ollama_models = []
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags")
            if resp.status_code == 200:
                ollama_models = [m["name"] for m in resp.json().get("models", [])]
                local_ready = True
    except Exception:
        pass
        
    active = "cloud" if (cloud_ready and hybrid_enabled) else ("local" if local_ready else "offline")
    return {
        "active": active,
        "cloud": {"provider": "free.ai", "model": cfg["cloud_model"], "ready": cloud_ready},
        "local": {"provider": "ollama", "model": cfg["local_model"], "ready": local_ready},
        "ollama_models": ollama_models[:12],
    }


class GenerateFlowRequest(BaseModel):
    prompt: str

@router.post("/generate_flow")
async def generate_flow(req: GenerateFlowRequest):
    """AI Flow Generator con RAG: busca los mejores agentes/prompts de la base de datos y genera el flujo."""
    import json as _json
    import os as _os
    import random

    # 1. Cargar prompts y skills para búsqueda semántica ligera
    from routers.semantic_search import _engine
    
    candidates = _engine.search(req.prompt, top_k=8)

    # Top 8 candidatos más relevantes (ya ordenados por score por el engine)
    top_candidates = candidates[:8]

    # 2. Construir contexto comprimido para el LLM
    context_str = ""
    if top_candidates:
        context_str = "\n\nAGENTES Y PROMPTS DISPONIBLES EN LA BASE DE DATOS (selecciona los más apropiados):\n"
        for i, c in enumerate(top_candidates):
            context_str += f"{i+1}. [{c['source'].upper()}] {c['title']} — {c['content'][:120]}...\n"

    system = FLOW_GENERATOR_SYSTEM
    user_prompt = f"Requerimiento del usuario: {req.prompt}{context_str}"
    
    try:
        response_text, model_used = await call_ai(system, user_prompt, model_override="hermes3:8b")
        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response_text[start:end]
                data = _json.loads(json_str)
            else:
                data = _json.loads(response_text)
                
            return {"status": "success", "model": model_used, "data": data, "candidates_used": len(top_candidates)}
        except _json.JSONDecodeError:
            print("[AI Flow Generator] Error parsing JSON:", response_text)
            raise HTTPException(status_code=500, detail="La IA no devolvió un JSON válido.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CopilotRequest(BaseModel):
    message: str
    history: list = []

FLOWBOARD_COPILOT_SYSTEM = """
Eres el "Copiloto Guía de FlowBoard", un experto AI asistente integrado directamente en el editor visual de nodos (FlowBoard).
Tu misión es guiar paso a paso al usuario para que todo quede bien configurado antes de ejecutar su flujo, respondiendo dudas sobre cómo interactuar con los paneles y nodos vacíos.

Detalles de FlowBoard que debes conocer:
- Los nodos se editan en el panel derecho de propiedades.
- Existe un botón 'Execute' (Ejecutar) que se utiliza cuando el flujo está listo.
- Se pueden agregar nodos vacíos y conectarlos entre sí mediante aristas.
- Debes ayudar al usuario a entender qué información falta o cómo estructurar su flujo.

Proporciona instrucciones claras, amigables y concisas. Si el usuario está perdido, sugiere crear nodos vacíos o revisar las propiedades en el panel derecho antes de presionar 'Execute'.
RULES: ALWAYS EXECUTE, REASON, AND RESPOND STRICTLY IN SPANISH (unless otherwise requested).
"""

@router.post("/flowboard/copilot")
async def flowboard_copilot(req: CopilotRequest):
    try:
        history_context = ""
        if req.history:
            # Try to format history if it's a list of dicts
            formatted_msgs = []
            for msg in req.history:
                if isinstance(msg, dict):
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    formatted_msgs.append(f"{role.capitalize()}: {content}")
                else:
                    formatted_msgs.append(str(msg))
            history_context = "\n\nHistorial previo:\n" + "\n".join(formatted_msgs) + "\n\n"
        
        user_prompt = f"{history_context}Mensaje del usuario: {req.message}"
        
        result, _ = await call_ai(FLOWBOARD_COPILOT_SYSTEM, user_prompt)
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

