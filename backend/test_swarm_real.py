import asyncio

from dotenv import load_dotenv

load_dotenv()


async def test_swarm():
    from backend.services.coautoria_level2_swarm import SwarmOrchestrator
    from backend.services.supervisor_router import AgentCard

    print("🚀 Iniciando prueba real de CoautorIA Nivel 2 (Enjambre Táctico)")
    tactical_team = [
        AgentCard(
            id="arq1",
            name="Architect",
            description="Diseña en Python.",
            capabilities=["design"],
        ),
        AgentCard(
            id="qa", name="QA", description="Revisa fallos.", capabilities=["testing"]
        ),
        AgentCard(
            id="uiux",
            name="UI",
            description="Diseña frontend.",
            capabilities=["frontend"],
        ),
        AgentCard(
            id="sec",
            name="Security",
            description="Revisa inyecciones.",
            capabilities=["security"],
        ),
    ]
    orchestrator = SwarmOrchestrator(agents=tactical_team)

    print("⏳ Llamando al Enjambre con Gemini...")
    try:
        result = await orchestrator.execute_swarm_async(
            "Escribe una función Hola Mundo en Python"
        )
        print("\n✅ RESULTADO DEL ENJAMBRE:\n")
        print(result)
    except Exception as e:
        print("\n❌ ERROR GRAVE EN LA EJECUCIÓN:")
        print(str(e))


if __name__ == "__main__":
    asyncio.run(test_swarm())
