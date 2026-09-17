import os
import json
from google.antigravity import Agent, LocalOpenAIAgentConfig
from backend.services.chroma_db import vector_db

async def run_match_fuse(nodes_or_prompt, model_name="qwen3-8b") -> str:
    """
    Ejecuta el pipeline RRF completo:
    1. Parseo de intención
    2. Retrieval en Agents DNA y Atlas KB
    3. Síntesis (Fusión) usando el SDK
    Devuelve un JSON array (string) para que el frontend lo parsee como AgentCards.
    """
    prompt = str(nodes_or_prompt)
    print("Iniciando Match & Fuse pipeline...")

    # ==========================================
    # 1. RETRIEVAL (Búsqueda Vectorial)
    # ==========================================
    print("Recuperando genes y conocimientos...")
    agent_genes = vector_db.search_agents(prompt, n_results=3)
    atlas_knowledge = vector_db.search_atlas(prompt, n_results=3)

    context_agents = "\n---\n".join(agent_genes) if agent_genes else "Sin agentes base."
    context_atlas = "\n---\n".join(atlas_knowledge) if atlas_knowledge else "Sin conocimiento extra."

    # ==========================================
    # 2. DEFINICIÓN DEL AGENTE SINTETIZADOR
    # ==========================================
    system_prompt = f"""Eres el Motor de Síntesis de Antigravity OS (Match & Fuse).
Tu objetivo es crear nuevos Agentes Autónomos Especializados cruzando los siguientes genes locales.

GENES BASE ENCONTRADOS (ADN):
{context_agents}

CONOCIMIENTO DEL ATLAS (FRAMEWORKS):
{context_atlas}

A partir de la petición del usuario (nodos/prompt): "{prompt}"
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

    LOCAL_MODELS = {"hermes3:8b", "llama3.1:8b", "mistral", "qwen2.5:7b", "phi3:3.8b"}
    is_local = model_name in LOCAL_MODELS or ":" in model_name

    if is_local:
        base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:8080/v1")
        final_model = model_name
    else:
        base_url = "https://api.free.ai/v1"
        # Forzamos qwen3-8b porque Free.AI no soporta los premium (como Claude o qwen-72b) en su endpoint OpenAI-compatible /v1/chat/completions
        final_model = "qwen3-8b"

    config = LocalOpenAIAgentConfig(
        model=final_model,
        base_url=base_url,
        system_instructions=system_prompt,
        env={"OPENAI_API_KEY": os.getenv("FREE_AI_API_KEY", "localai")}
    )
    
    print("Sintetizando nuevo agente...")
    import asyncio
    max_retries = 3
    
    agent = Agent(config)
    
    for attempt in range(max_retries):
        try:
            resp = await agent.chat("Genera los agentes basados en el contexto y nodos proporcionados. SOLO DEVUELVE JSON.")
            raw_text = resp.text.strip()
            
            if raw_text.startswith("```json"):
                raw_text = raw_text.replace("```json", "", 1)
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]
                
            raw_text = raw_text.strip()
            
            # Intentar validar que sea un JSON array
            parsed = json.loads(raw_text)
            if isinstance(parsed, list):
                return raw_text
            else:
                raise ValueError("La respuesta no es una lista JSON válida")
                
        except Exception as e:
            print(f"Intento {attempt + 1} falló en síntesis RRF: {e}")
            if attempt < max_retries - 1:
                print("Reintentando en 3 segundos...")
                await asyncio.sleep(3)
            else:
                return json.dumps([{
                    "id": "error_agent", "name": "Fallback Agent", "role": "Error",
                    "description": f"Falló tras {max_retries} intentos. Último error: {e}", "color": "#ff0000", "noveltyScore": 0,
                    "evalStatus": "FAIL", "inputOutputContract": "None", "requiredTools": [],
                    "health": "red", "genes": []
                }])
