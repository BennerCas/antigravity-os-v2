import asyncio, os
from google.antigravity import Agent, LocalOpenAIAgentConfig

async def run():
    config = LocalOpenAIAgentConfig(
        model='hermes3:8b',
        base_url='http://127.0.0.1:11434/v1',
        system_instructions='Eres un bot.',
        env={'OPENAI_API_KEY':'localai'}
    )
    print('agent created')
    async with Agent(config) as agent:
        print('agent started')
        resp = await agent.chat('Hola')
        print(await resp.text())

asyncio.run(run())
