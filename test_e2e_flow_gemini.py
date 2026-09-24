import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import transition_state, StateTransitionRequest, ChatResponse
import google.generativeai as genai

# Setup Gemini real directo (Hardcoded)
genai.configure(api_key="AIzaSyAoYELyUY83a-9s2gY_lr7FIWR_4tGybq0")
model_gemini = genai.GenerativeModel('gemini-1.5-flash')

async def fast_gemini_call(user: str, system: str, model: str) -> ChatResponse:
    prompt = f"SYSTEM: {system}\n\nUSER: {user}"
    response = model_gemini.generate_content(prompt)
    return ChatResponse(response=response.text, model_used="gemini-1.5-flash", engine="gemini")

routers.studio._call_ollama = fast_gemini_call
routers.studio._call_free_ai = fast_gemini_call

# Desactivar el manager de WebSockets durante la prueba porque no hay servidor corriendo
class MockManager:
    async def broadcast(self, data):
        pass
routers.studio.manager = MockManager()

async def main():
    print("==================================================")
    print(" INICIANDO PRUEBA END-TO-END ESTRUCTURAL (GEMINI-FLASH)")
    print("==================================================\n")
    
    initial_prompt = "Quiero crear un flujo que investigue mi nicho y cree contenido para mi LinkedIn detallado usando n8n"
    model = "gemini"
    
    print(f">> [FASE 1: TRIAGE]")
    req1 = StateTransitionRequest(phase="phase1_triage", data={"model": model, "data": f"human: {initial_prompt}"})
    res1 = await transition_state(req1)
    text1 = res1["result"].get("triage_result", "")
    print(text1.strip()[:300] + "...\n")
    print("-" * 50)
    
    print(">> [FASE 2: EXTRACCIÓN]")
    req2 = StateTransitionRequest(phase="phase2_extraction", data={"model": model, "data": text1.replace("[READY_FOR_EXTRACTION]", "")})
    res2 = await transition_state(req2)
    text2 = res2["result"].get("extraction_result", "")
    print(text2.strip()[:300] + "...\n")
    print("-" * 50)
    
    print(">> [FASE 3: BLUEPRINT / FORJA]")
    req3 = StateTransitionRequest(phase="phase3_blueprint", data={"model": model, "data": text2.replace("[READY_FOR_BLUEPRINT]", "")})
    res3 = await transition_state(req3)
    text3 = res3["result"].get("blueprint_result", "")
    print("<< RESULTADO FINAL DE LA FORJA (Fragmento):")
    print(text3.strip()[:600] + "...\n")
    
    print("==================================================")
    print("¿El output final generó los bloques Markdown necesarios para el Canvas?")
    print("-> <nodes> encontrado: ", "<nodes>" in text3)
    print("-> <edges> encontrado: ", "<edges>" in text3)
    print("-> <agents> encontrado:", "<agents>" in text3)
    print("==================================================")

asyncio.run(main())
