import asyncio
import sys
import os

# Asegurar que importamos desde el backend
sys.path.insert(0, os.path.abspath('backend'))

from routers.studio import _execute_swarm_pipeline

async def main():
    print('Lanzando la pipeline del Quantum Engine...')
    pipeline = [{"name": "Forjador", "system": "test", "task": "test", "is_local": True}]
    try:
        res = await _execute_swarm_pipeline("test data", "ollama/hermes3:8b", pipeline)
        print(f"EXITO: {res}")
    except Exception as e:
        print(f"FALLO CRITICO: {str(e)}")

asyncio.run(main())
