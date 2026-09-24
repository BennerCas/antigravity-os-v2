import asyncio
import sys
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.abspath('backend'), '.env'))
os.environ["OLLAMA_BASE_URL"] = "http://127.0.0.1:11434"

sys.path.insert(0, os.path.abspath('backend'))
import routers.studio
from routers.studio import transition_state, StateTransitionRequest

# Desactivar el manager de WebSockets durante la prueba porque no hay servidor corriendo
class MockManager:
    async def broadcast(self, data):
        pass
routers.studio.manager = MockManager()

# Forzar modelo local qwen si falla free.ai
async def _safe_call_ollama(u, s, m):
    return await routers.studio._call_ollama(u, s, "qwen2.5-coder:latest")
routers.studio._call_ollama = _safe_call_ollama

async def main():
    print("==================================================")
    print(" INICIANDO PRUEBA END-TO-END DEL MOTOR CUÁNTICO")
    print("==================================================\n")
    
    initial_prompt = "Quiero crear un flujo que investigue mi nicho y cree contenido para mi LinkedIn"
    model = "free.ai/anthropic/claude-3.5-sonnet"
    
    print(f">> [FASE 1: TRIAGE] - Evaluando: '{initial_prompt}'")
    req1 = StateTransitionRequest(phase="phase1_triage", data={"model": model, "data": f"human: {initial_prompt}"})
    res1 = await transition_state(req1)
    text1 = res1["result"].get("triage_result", "")
    print(text1.strip())
    print("-" * 50)
    
    if "[READY_FOR_EXTRACTION]" not in text1:
        print(">> [FASE 1.5: RESPUESTA DEL USUARIO AL TRIAGE]")
        req1_5 = StateTransitionRequest(phase="phase1_triage", data={"model": model, "data": f"human: {initial_prompt}\nagent: {text1}\nhuman: Nicho de desarrollo de software, apuntando a agencias. Usaré n8n y Apify."})
        res1 = await transition_state(req1_5)
        text1 = res1["result"].get("triage_result", "")
        print(text1.strip())
        print("-" * 50)
        
    print(">> [FASE 2: EXTRACCIÓN]")
    req2 = StateTransitionRequest(phase="phase2_extraction", data={"model": model, "data": text1.replace("[READY_FOR_EXTRACTION]", "")})
    res2 = await transition_state(req2)
    text2 = res2["result"].get("extraction_result", "")
    print(text2.strip())
    print("-" * 50)
    
    print(">> [FASE 3: BLUEPRINT / FORJA]")
    req3 = StateTransitionRequest(phase="phase3_blueprint", data={"model": model, "data": text2.replace("[READY_FOR_BLUEPRINT]", "")})
    res3 = await transition_state(req3)
    text3 = res3["result"].get("blueprint_result", "")
    print("<< RESULTADO FINAL DE LA FORJA (Fragmento):")
    print(text3[:600] + "...\n")
    
    print("¿El output final generó los bloques Markdown necesarios?")
    print("-> <nodes> encontrado: ", "<nodes>" in text3)
    print("-> <edges> encontrado: ", "<edges>" in text3)
    print("-> <agents> encontrado:", "<agents>" in text3)
    
    print("==================================================")

asyncio.run(main())
