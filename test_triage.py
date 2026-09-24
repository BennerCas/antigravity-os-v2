
import asyncio
import sys
import os

backend_dir = os.path.abspath('backend')
sys.path.insert(0, backend_dir)

from routers.studio import run_triage_swarm

async def main():
    data = {
        'model': 'hermes3:8b', # Usaremos un modelo local para la prueba si está disponible
        'data': 'Quiero hacer contenido para un nicho pero no se cual'
    }
    result = await run_triage_swarm(data)
    print('--- RESULTADO DEL TRIAGE ---')
    print(result)

asyncio.run(main())

