import os
import json
from google.antigravity import Agent, LocalOpenAIAgentConfig
from backend.services.chroma_db import vector_db

async def run_match_fuse(nodes_or_prompt, model_name="qwen3-8b", progress_callback=None) -> str:
    """
    Pipeline Match & Fuse — Triángulo Dorado (3 etapas):
    1. Decomposer  — extrae genes lógicos
    2. Synthesizer — cruza ADN + Atlas KB
    3. Evaluator   — valida y corrige JSON (Sandbox Umpire)
    """
    async def emit(stage: str, pct: int):
        if progress_callback:
            try:
                await progress_callback({"type": "match_fuse_progress", "stage": stage, "pct": pct})
            except Exception:
                pass

    prompt = str(nodes_or_prompt)

    await emit("🔍 Recuperando genes y conocimientos del Atlas...", 5)
    agent_genes = vector_db.search_agents(prompt, n_results=3)
    atlas_knowledge = vector_db.search_atlas(prompt, n_results=3)

    context_agents = "\n---\n".join(agent_genes) if agent_genes else "Sin agentes base."
    context_atlas = "\n---\n".join(atlas_knowledge) if atlas_knowledge else "Sin conocimiento extra."

    system_prompt = f"""Eres el Motor de Síntesis de Antigravity OS (Match & Fuse).
Tu objetivo es crear nuevos Agentes Autónomos Especializados cruzando los siguientes genes locales.

GENES BASE ENCONTRADOS (ADN):
{context_agents}

CONOCIMIENTO DEL ATLAS (FRAMEWORKS):
{context_atlas}

A partir de la petición del usuario: "{prompt}"
Debes devolver UNICAMENTE un JSON ARRAY válido que contenga 1 o más objetos AgentCard:
[{{
  "id": "identificador",
  "name": "Nombre",
  "role": "Rol",
  "description": "Instrucción experta cruzada con Atlas",
  "color": "#7B9C7F",
  "noveltyScore": 0.95,
  "evalStatus": "PASS",
  "inputOutputContract": "IN: Contexto -> OUT: Tarea",
  "requiredTools": ["tool1"],
  "health": "green",
  "genes": [{{ "kind": "reasoning", "value": "lógica" }}]
}}]
No incluyas markdown (```json), solo el raw JSON.
"""

    LOCAL_MODELS = {"hermes3:8b", "llama3.1:8b", "mistral", "qwen2.5:7b", "phi3:3.8b", "qwen2.5:3b", "qwen2.5:1.5b"}
    is_local = model_name in LOCAL_MODELS or ":" in model_name

    if is_local:
        # Ollama OpenAI-compatible en 11434/v1 (8080 = Open WebUI, NO compatible)
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434/v1")
        final_model = model_name
    else:
        base_url = "https://api.free.ai/v1"
        final_model = "qwen3-8b"

    config = LocalOpenAIAgentConfig(
        model=final_model,
        base_url=base_url,
        system_instructions=system_prompt,
        env={"OPENAI_API_KEY": os.getenv("FREE_AI_API_KEY", "localai")}
    )

    import asyncio
    max_retries = 3

    await emit("🧬 Etapa 1/3 — Descomposición de genes (Decomposer)...", 15)
    decomposer_prompt = f"""
    Analiza el siguiente requerimiento y descompón la intención en genes lógicos.
    Requerimiento: {prompt}
    Extrae: 'reasoning', 'domain', 'format', 'tool', 'policy'.
    """

    async with Agent(config) as agent:
        decomposer_resp = await agent.chat(decomposer_prompt)
        genes_analysis = (await decomposer_resp.text()).strip()

        await emit("⚗️ Etapa 2/3 — Síntesis cuántica (Synthesizer)...", 45)
        synthesizer_prompt = f"""
        {system_prompt}

        ANÁLISIS DE GENES PREVIO:
        {genes_analysis}

        Instrucción: Genera el JSON ARRAY de los agentes usando los genes extraídos.
        """
        synth_resp = await agent.chat(synthesizer_prompt)
        raw_text = (await synth_resp.text()).strip()

        await emit("🔬 Etapa 3/3 — Evaluación rigurosa (Sandbox Umpire)...", 75)
        eval_prompt = f"""
        Eres el Sandbox Umpire. Evalúa el siguiente JSON de agentes generados.

        JSON PROPUESTO:
        {raw_text}

        Verifica:
        1. Que sea un JSON ARRAY válido.
        2. Que el noveltyScore tenga sentido comparado con los genes base.
        3. Que evalStatus y health sean correctos según las políticas.

        Si hay errores semánticos o de sintaxis, CORRÍGELOS y devuelve ÚNICAMENTE el JSON ARRAY corregido.
        NO incluyas markdown, solo empieza con [ y termina con ].
        """

        for attempt in range(max_retries):
            try:
                eval_resp = await agent.chat(eval_prompt)
                final_text = (await eval_resp.text()).strip()

                if final_text.startswith("```json"):
                    final_text = final_text.replace("```json", "", 1)
                if final_text.endswith("```"):
                    final_text = final_text[:-3]
                final_text = final_text.strip()

                parsed = json.loads(final_text)
                if isinstance(parsed, list):
                    await emit(f"✅ Pipeline completado — {len(parsed)} agente(s) generado(s)", 100)
                    return final_text
                else:
                    raise ValueError("No es lista JSON válida")

            except Exception as e:
                if attempt < max_retries - 1:
                    await emit(f"⚠️ Reintento {attempt+2}/3 — corrigiendo JSON...", 80 + attempt * 5)
                    await asyncio.sleep(3)
                else:
                    await emit("❌ Pipeline fallido tras 3 intentos", 0)
                    return json.dumps([{
                        "id": "error_agent", "name": "Fallback Agent", "role": "Error",
                        "description": f"Falló tras {max_retries} intentos. Error: {e}",
                        "color": "#ff0000", "noveltyScore": 0, "evalStatus": "FAIL",
                        "inputOutputContract": "None", "requiredTools": [], "health": "red", "genes": []
                    }])
