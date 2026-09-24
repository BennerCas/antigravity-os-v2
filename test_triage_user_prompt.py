import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.abspath('backend'), '.env'))
os.environ["OLLAMA_BASE_URL"] = "http://127.0.0.1:11434"

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import run_triage_swarm

async def main():
    print("Enviando el prompt del usuario al Triage...")
    prompt = "quiero crear un flujo que en segundo plano investigue mi nicho y crea contenido relevante para mi perfil de linkedin"
    
    res = await run_triage_swarm({"model": "anthropic/claude-3.5-sonnet", "data": f"human: {prompt}"})
    print("\n=== RESPUESTA ===\n")
    print(res["triage_result"])

asyncio.run(main())
