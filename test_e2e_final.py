import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.abspath('backend'), '.env'))
os.environ["OLLAMA_BASE_URL"] = "http://127.0.0.1:11434"

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import transition_state, StateTransitionRequest

class MockManager:
    async def broadcast(self, data):
        pass
routers.studio.manager = MockManager()

async def main():
    initial_prompt = "Quiero crear un flujo en n8n que analice mi nicho de marketing digital y redacte 3 posts de LinkedIn semanales. El flujo debe buscar noticias usando Apify, analizarlas con Claude 3.5, y guardar el texto en Airtable. TODO DETALLADO."
    model = "free.ai/anthropic/claude-3.5-sonnet"
    
    req1 = StateTransitionRequest(phase="phase1_triage", data={"model": model, "data": f"human: {initial_prompt}"})
    res1 = await transition_state(req1)
    text1 = res1["result"].get("triage_result", "")
    
    req2 = StateTransitionRequest(phase="phase2_extraction", data={"model": model, "data": text1.replace("[READY_FOR_EXTRACTION]", "")})
    res2 = await transition_state(req2)
    text2 = res2["result"].get("extraction_result", "")
    
    req3 = StateTransitionRequest(phase="phase3_blueprint", data={"model": model, "data": text2.replace("[READY_FOR_BLUEPRINT]", "")})
    res3 = await transition_state(req3)
    text3 = res3["result"].get("blueprint_result", "")
    
    with open("e2e_output.txt", "w", encoding="utf-8") as f:
        f.write("=== RESULTADO DE LA FORJA (FASE 3) ===\n\n")
        f.write(text3)
        f.write("\n===================================\n")
        f.write(f"Tiene <nodes>: {'<nodes>' in text3}\n")
        f.write(f"Tiene <edges>: {'<edges>' in text3}\n")
        f.write(f"Tiene <agents>: {'<agents>' in text3}\n")

asyncio.run(main())
