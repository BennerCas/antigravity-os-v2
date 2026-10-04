import asyncio, json, os
from dotenv import load_dotenv
load_dotenv("backend/.env")

os.environ["ACTIVE_MODEL"] = "local"  # Forzar Ollama

from backend.services.freechat_pipeline import FreechatPipeline

async def test():
    pipeline = FreechatPipeline()
    messages = [{"role": "user", "content": "crea un dashboard simple de html para metricas de redes sociales"}]
    print("=== TEST PIPELINE COMPLETO (Ollama local) ===")
    res = await pipeline.process_chat(messages=messages)
    status = res.get("status")
    content = res.get("response", {}).get("content", "")
    print(f"Status: {status}")
    print(f"Motor usado: {'Ollama/Hermes' if '[AgentFactory]' not in content else 'Fallback'}")
    print(f"Respuesta (primeros 500 chars):\n{content[:500]}")
    print("\n=== FIN ===")

asyncio.run(test())
