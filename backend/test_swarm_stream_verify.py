import asyncio
import os
import sys

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath("."))
sys.stdout.reconfigure(encoding='utf-8')

from backend.services.supervisor_router import AgentCard
from backend.services.coautoria_level2_swarm import SwarmOrchestrator

async def test_swarm_streaming():
    print("[TEST BACKEND] Iniciando verificación de execute_swarm_stream...")
    
    tactical_team = [
        AgentCard(id="arq_test", name="Architect Test", label="Architect Test", description="Diseña arquitectura mínima", capabilities=["design"]),
        AgentCard(id="qa_test", name="QA Test", label="QA Test", description="Verifica estabilidad", capabilities=["test"])
    ]
    
    orchestrator = SwarmOrchestrator(agents=tactical_team)
    objective = "Crear un botón de login minimalista con Tailwind"
    
    events_received = []
    final_output = ""
    
    async for event in orchestrator.execute_swarm_stream(objective):
        events_received.append(event)
        # Check if it's the final payload
        if "<swarm>" in event and "<artifact" in event:
            final_output = event
        else:
            # Print intermediate progress event
            clean_evt = event.strip()
            if clean_evt:
                print(f"[EVENTO PROGRESO]: {clean_evt}")

    print(f"\n[TEST RESULT] Total eventos de progreso recibidos: {len(events_received)}")
    assert len(events_received) >= 4, f"Se esperaban al menos 4 eventos, se recibieron {len(events_received)}"
    assert "<swarm>" in final_output, "No se encontró el bloque <swarm> en el output final"
    assert "<artifact" in final_output, "No se encontró el bloque <artifact> en el output final"
    
    # Extraer y mostrar el artefacto compilado
    import re
    art_match = re.search(r"<artifact\s+name=\"([^\"]+)\">([\s\S]*?)(?:</artifact>|$)", final_output)
    if art_match:
        print(f"\n================ [ARTEFACTO GENERADO: {art_match.group(1)}] ================")
        print(art_match.group(2).strip()[:800] + "\n... [truncated] ...")
        print("=========================================================================\n")
    else:
        print("\n[ALERTA]: El artefacto no se encontró en final_output:\n", final_output[-400:])

    print("✅ VERIFICACIÓN BACKEND EXITOSA: execute_swarm_stream emite eventos en tiempo real y compila el artefacto.")

if __name__ == "__main__":
    asyncio.run(test_swarm_streaming())
