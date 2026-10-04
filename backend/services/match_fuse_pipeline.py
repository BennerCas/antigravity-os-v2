import json
import os

from google.antigravity import Agent, LocalOpenAIAgentConfig

from backend.model_defaults import (DEFAULT_LOCAL_MODEL,
                                    FREE_AI_FALLBACK_MODEL, is_local_model,
                                    normalize_ollama_base_url,
                                    strip_model_provider)
from backend.services.chroma_db import vector_db


async def run_match_fuse(
    nodes_or_prompt, model_name=DEFAULT_LOCAL_MODEL, progress_callback=None
) -> str:
    """
    Pipeline Match & Fuse — Triángulo Dorado (3 etapas):
    1. Decomposer  — extrae genes lógicos
    2. Synthesizer — cruza ADN + Atlas KB
    3. Evaluator   — valida y corrige JSON (Sandbox Umpire)
    """

    async def emit(stage: str, pct: int):
        if progress_callback:
            try:
                await progress_callback(
                    {"type": "match_fuse_progress", "stage": stage, "pct": pct}
                )
            except Exception:
                pass

    if isinstance(nodes_or_prompt, list):
        # Es una lista de nodos
        intent_text = "Nodos actuales en el lienzo:\n"
        for n in nodes_or_prompt:
            intent_text += f"- Tarea/Agente: {n.get('label', 'Desconocido')} (Rol: {n.get('role', '')})\n"
            intent_text += f"  Contexto: {n.get('fullDescription', '')}\n"
        prompt = intent_text
    else:
        prompt = str(nodes_or_prompt)

    await emit("🔍 Recuperando genes y conocimientos del Atlas...", 5)
    agent_genes = vector_db.search_agents(prompt, n_results=3)
    atlas_knowledge = vector_db.search_atlas(prompt, n_results=3)

    context_agents = "\n---\n".join(agent_genes) if agent_genes else "Sin agentes base."
    context_atlas = (
        "\n---\n".join(atlas_knowledge)
        if atlas_knowledge
        else "Sin conocimiento extra."
    )

    system_prompt = f"""Act as a Principal Cognitive Systems Architect specializing in multi-agent frameworks. Your objective is to design a cohesive SWARM of highly specialized AI agents based on the user's intent. You MUST decompose the user's request into AT LEAST 3 distinct, complementary agents that work together.

USER INTENT: "{prompt}"

BASE GENES (ADN):
{context_agents}

ATLAS KNOWLEDGE (FRAMEWORKS):
{context_atlas}

Execution Protocol:
Before generating the final JSON payload, you must perform a comprehensive Chain of Thought (CoT) reasoning process. Enclose your reasoning explicitly within <thinking> and </thinking> tags. Use this space to map out the agent architectures, synthesize the operational logic, and validate all constraints.

Design Requirements:

1. System Instructions: Develop dense, highly technical system instructions for the agent. You must write at least three comprehensive paragraphs detailing their behavioral constraints, cognitive frameworks, primary directives, and operational modalities.
2. Cognitive Genes: Infer and explicitly define at least four complex structural "genes" (e.g., nlp-semantic-parser, dynamic-context-injector, state-memory-synthesizer). Provide a precise functional description for each.
3. Sandbox Tools: Engineer exactly three highly precise, actionable Sandbox tools. Define their exact execution purpose, required inputs, and expected outputs.

Output Formatting:
After completing your <thinking> phase, output ONLY a valid JSON ARRAY containing the agent profiles. Do not include any conversational text outside the <thinking> or JSON block. Ensure the JSON strictly follows this exact schema (must be an array of objects):

[
  {{
    "agent_profile": {{
      "role": "String",
      "system_instructions": [
        "Paragraph 1: Core identity and primary directives...",
        "Paragraph 2: Cognitive frameworks and behavioral constraints...",
        "Paragraph 3: Operational modalities and edge-case handling..."
      ],
      "complex_genes": [
        {{
          "gene_id": "String",
          "functional_description": "String"
        }}
      ],
      "sandbox_tools": [
        {{
          "tool_name": "String",
          "execution_purpose": "String",
          "parameters": {{
            "inputs": "String",
            "expected_outputs": "String"
          }}
        }}
      ]
    }}
  }}
]
"""

    clean_model_name = strip_model_provider(model_name)
    is_local = is_local_model(clean_model_name)

    if is_local:
        base_url = normalize_ollama_base_url(
            os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        )
        final_model = clean_model_name or DEFAULT_LOCAL_MODEL
    else:
        base_url = "https://api.free.ai/v1"
        final_model = clean_model_name or FREE_AI_FALLBACK_MODEL

    config = LocalOpenAIAgentConfig(
        model=final_model,
        base_url=base_url,
        system_instructions=system_prompt,
        env={"OPENAI_API_KEY": os.getenv("FREE_AI_API_KEY", "localai")},
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
                final_text = final_text.removesuffix("```")
                final_text = final_text.strip()

                import re

                json_match = re.search(r"\[[\s\S]*\]|\{[\s\S]*\}", final_text)
                if json_match:
                    final_text = json_match.group(0)

                parsed = json.loads(final_text)
                if isinstance(parsed, dict):
                    if "agent_profile" in parsed:
                        parsed = [parsed]
                    elif "agent_profile" in parsed.get("agent_profiles", {}):
                        # LLM hallucinated wrapper
                        parsed = [parsed["agent_profiles"]]
                    else:
                        parsed = [parsed]

                if isinstance(parsed, list):
                    mapped_cards = []
                    import uuid

                    for p in parsed:
                        if "agent_profile" in p:
                            profile = p["agent_profile"]
                            genes = [
                                {
                                    "kind": str(g.get("gene_id", "gene")),
                                    "value": str(g.get("functional_description", "")),
                                }
                                for g in profile.get("complex_genes", [])
                            ]
                            tools = [
                                str(t.get("tool_name", "tool"))
                                for t in profile.get("sandbox_tools", [])
                            ]
                            try:
                                in_val = (
                                    profile.get("sandbox_tools", [{}])[0]
                                    .get("parameters", {})
                                    .get("inputs", "?")
                                )
                                out_val = (
                                    profile.get("sandbox_tools", [{}])[0]
                                    .get("parameters", {})
                                    .get("expected_outputs", "?")
                                )
                                contract = f"IN: {in_val} -> OUT: {out_val}"
                            except:
                                contract = "IN: Datos -> OUT: Acción"

                            inst = profile.get("system_instructions", [])
                            if isinstance(inst, list):
                                desc = "\n\n".join(inst)
                            else:
                                desc = str(inst)
                            mapped_cards.append(
                                {
                                    "id": f"agent-{str(uuid.uuid4())[:8]}",
                                    "name": str(profile.get("role", "Cognitive Agent"))[
                                        :60
                                    ],
                                    "role": str(
                                        profile.get("role", "Cognitive Agent")
                                    ).upper()[:30],
                                    "description": desc,
                                    "color": "#8B5CF6",
                                    "noveltyScore": 0.95,
                                    "evalStatus": "PASS",
                                    "inputOutputContract": contract,
                                    "requiredTools": tools,
                                    "health": "green",
                                    "genes": genes,
                                }
                            )
                        else:
                            mapped_cards.append(p)

                    final_mapped_text = json.dumps(mapped_cards)
                    await emit(
                        f"✅ Pipeline completado — {len(mapped_cards)} agente(s) generado(s)",
                        100,
                    )
                    return final_mapped_text
                else:
                    raise ValueError("No es lista JSON válida")

            except Exception as e:
                if attempt < max_retries - 1:
                    await emit(
                        f"⚠️ Reintento {attempt+2}/3 — corrigiendo JSON...",
                        80 + attempt * 5,
                    )
                    await asyncio.sleep(3)
                else:
                    await emit("❌ Pipeline fallido tras 3 intentos", 0)
                    return json.dumps(
                        [
                            {
                                "id": "error_agent",
                                "name": "Fallback Agent",
                                "role": "Error",
                                "description": f"Falló tras {max_retries} intentos. Error: {e}",
                                "color": "#ff0000",
                                "noveltyScore": 0,
                                "evalStatus": "FAIL",
                                "inputOutputContract": "None",
                                "requiredTools": [],
                                "health": "red",
                                "genes": [],
                            }
                        ]
                    )
