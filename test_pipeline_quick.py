import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import ChatResponse, run_triage_swarm

async def mock_call_ollama(user: str, system: str, model: str) -> ChatResponse:
    if 'vago' in user.lower() or 'pregunta' in user.lower():
        return ChatResponse(response="Tengo una pregunta: stack?", model_used="mock", engine="mock")
    else:
        return ChatResponse(response="Arquitectura definida.\n\n[READY_FOR_EXTRACTION]", model_used="mock", engine="mock")

routers.studio._call_ollama = mock_call_ollama

async def main():
    print(">> ENTRADA 1: Usuario envía idea vaga")
    res1 = await run_triage_swarm({"model": "test", "data": "human: quiero un e-commerce vago"})
    print("<< RESPUESTA DEL ENJAMBRE FINAL:")
    print(res1.get('triage_result'))

asyncio.run(main())
