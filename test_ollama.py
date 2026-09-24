import asyncio
from backend.services.agent_factory import AgentFactory

async def test():
    try:
        print('Enviando a ollama...')
        resp = await AgentFactory.chat_one_shot(
            agent_id='inquisidor-arquitecto',
            user_prompt='Hola, dime que hora es',
            override_instructions='Eres un asistente util.',
            model=None
        )
        print('RESPUESTA:', resp)
    except Exception as e:
        print('ERROR:', e)

asyncio.run(test())
