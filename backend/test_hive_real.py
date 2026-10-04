import asyncio

from dotenv import load_dotenv

load_dotenv()


async def test_hive():
    from backend.services.coautoria_level3_hive import HiveManager

    print("🚀 Iniciando prueba real de CoautorIA Nivel 3 (La Colmena)")
    manager = HiveManager(hive_name="Global Hive Test")

    hive_data = [
        {"name": "Prueba Rápida Swarm", "objective": "Dame un JSON que diga hola."}
    ]

    print("⏳ Llamando a la Colmena con Gemini...")
    try:
        result = await manager.orchestrate_hive_async(
            "Construir una respuesta rápida.", hive_data
        )
        print("\n✅ RESULTADO DE LA COLMENA:\n")
        print(result)
    except Exception as e:
        print("\n❌ ERROR GRAVE EN LA EJECUCIÓN:")
        print(str(e))


if __name__ == "__main__":
    asyncio.run(test_hive())
