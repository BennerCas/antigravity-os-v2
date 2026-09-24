import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
# Mock de _call_ollama para evitar el freeze de Ollama local
import routers.studio
from google.antigravity.types import ChatResponse

async def mock_call_ollama(user: str, system: str, model: str) -> ChatResponse:
    if 'e-commerce' in user and 'TailwindCSS' not in user:
        return ChatResponse(response="Parece una buena idea, pero tengo dos preguntas:\n1. ¿Cuál es el stack tecnológico?\n2. ¿Se manejarán pagos?", model_used="mock-model", engine="mock")
    else:
        return ChatResponse(response="La arquitectura es completamente clara y está lista. Procediendo.\n\n[READY_FOR_EXTRACTION]", model_used="mock-model", engine="mock")

routers.studio._call_ollama = mock_call_ollama

from routers.studio import run_triage_swarm

async def main():
    print("Iniciando prueba simulada (Ollama está bloqueado localmente)...")
    print("--- PRUEBA 1: PROMPT VAGO ---")
    data_vaga = {
        "model": "qwen2.5-coder:latest", 
        "data": "human: Quiero una app de e-commerce"
    }
    
    res1 = await run_triage_swarm(data_vaga)
    print("Resultado Triage Vago:\n", res1.get('triage_result'))
    print("\n")
    
    print("--- PRUEBA 2: PROMPT DETALLADO ---")
    data_detallada = {
        "model": "qwen2.5-coder:latest",
        "data": "human: Quiero un MVP para un e-commerce usando Next.js en el frontend, Supabase como backend y base de datos PostgreSQL, integración con Stripe para pagos y TailwindCSS para diseño UI. Arquitectura monolítica inicial, 100% definida, sin dudas."
    }
    res2 = await run_triage_swarm(data_detallada)
    print("Resultado Triage Detallado:\n", res2.get('triage_result'))

asyncio.run(main())
