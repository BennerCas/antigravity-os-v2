import asyncio
from backend.services.agent_factory import actualizar_checklist

async def main():
    print(actualizar_checklist('triage', 'completed'))

asyncio.run(main())
