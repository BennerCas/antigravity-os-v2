import asyncio
import sys
import os
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.abspath('backend'), '.env'))
sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import transition_state, StateTransitionRequest, ChatResponse

GROQ_KEY = os.getenv("GROQ_API_KEY")

async def fast_groq_call(user: str, system: str, model: str) -> ChatResponse:
    headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.5,
        "max_tokens": 2048,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
        if resp.status_code == 200:
            text = resp.json()["choices"][0]["message"]["content"].strip()
            return ChatResponse(response=text, model_used="llama3.3", engine="groq")
        else:
            return ChatResponse(response=f"Error {resp.status_code}: {resp.text}", model_used="error", engine="error")

routers.studio._call_ollama = fast_groq_call
routers.studio._call_free_ai = fast_groq_call

class MockManager:
    async def broadcast(self, data):
        pass
routers.studio.manager = MockManager()

async def main():
    print("==================================================")
    print(" INICIANDO E2E COMPLETO (GROQ LLAMA 3.3)")
    print("==================================================\n")
    
    initial_prompt = "Quiero crear un flujo en n8n que analice mi nicho de marketing digital y redacte 3 posts de LinkedIn semanales. El flujo debe buscar noticias usando Apify, analizarlas con Claude 3.5, y guardar el texto en Airtable. TODO DETALLADO."
    model = "groq"
    
    print(f">> [FASE 1: TRIAGE]")
    req1 = StateTransitionRequest(phase="phase1_triage", data={"model": model, "data": f"human: {initial_prompt}"})
    res1 = await transition_state(req1)
    text1 = res1["result"].get("triage_result", "")
    print(text1.strip().encode('ascii', 'ignore').decode('ascii')[:300] + "...\n")
    print("-" * 50)
    
    print(">> [FASE 2: EXTRACCIÓN]")
    req2 = StateTransitionRequest(phase="phase2_extraction", data={"model": model, "data": text1.replace("[READY_FOR_EXTRACTION]", "")})
    res2 = await transition_state(req2)
    text2 = res2["result"].get("extraction_result", "")
    print(text2.strip().encode('ascii', 'ignore').decode('ascii')[:300] + "...\n")
    print("-" * 50)
    
    print(">> [FASE 3: BLUEPRINT / FORJA]")
    req3 = StateTransitionRequest(phase="phase3_blueprint", data={"model": model, "data": text2.replace("[READY_FOR_BLUEPRINT]", "")})
    res3 = await transition_state(req3)
    text3 = res3["result"].get("blueprint_result", "")
    print("<< RESULTADO FINAL DE LA FORJA (Fragmento):")
    print(text3.strip().encode('ascii', 'ignore').decode('ascii')[:800] + "...\n")
    
    print("==================================================")
    print("¿El output final generó los bloques Markdown necesarios para el Canvas?")
    print("-> <nodes> encontrado: ", "<nodes>" in text3)
    print("-> <edges> encontrado: ", "<edges>" in text3)
    print("-> <agents> encontrado:", "<agents>" in text3)
    print("==================================================")

asyncio.run(main())
