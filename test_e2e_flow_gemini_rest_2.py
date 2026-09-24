import asyncio
import sys
import os
import httpx

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import transition_state, StateTransitionRequest, ChatResponse

GEMINI_KEY = "AIzaSyAoYELyUY83a-9s2gY_lr7FIWR_4tGybq0"

async def fast_gemini_call(user: str, system: str, model: str) -> ChatResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_KEY}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": f"SYSTEM: {system}\n\nUSER: {user}"}]}
        ]
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers={'Content-Type': 'application/json'})
        if resp.status_code == 200:
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return ChatResponse(response=text, model_used="gemini-flash", engine="gemini")
        else:
            return ChatResponse(response=f"Error {resp.status_code}: {resp.text}", model_used="error", engine="error")

routers.studio._call_ollama = fast_gemini_call
routers.studio._call_free_ai = fast_gemini_call

class MockManager:
    async def broadcast(self, data):
        pass
routers.studio.manager = MockManager()

async def main():
    print("==================================================")
    print(" INICIANDO PRUEBA E2E (GEMINI REST API HARDCODED)")
    print("==================================================\n")
    
    initial_prompt = "Quiero crear un flujo en n8n que analice mi nicho de marketing digital y redacte 3 posts de LinkedIn semanales. El flujo debe buscar noticias usando Apify, analizarlas con Claude 3.5, y guardar el texto en Airtable."
    model = "gemini"
    
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
