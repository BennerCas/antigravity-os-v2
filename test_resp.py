import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath('backend'))
from google.antigravity import Agent
from google.antigravity.connections.local.local_openai_connection_config import LocalOpenAIAgentConfig

async def main():
    config = LocalOpenAIAgentConfig(
        model="hermes3:8b",
        base_url="http://localhost:11434/v1",
        system_instructions="test",
        env={"OPENAI_API_KEY": "localai"}
    )
    async with Agent(config) as agent:
        resp = await agent.chat("hi")
        import inspect
        if inspect.iscoroutinefunction(resp.text):
            print("It is async: await resp.text()")
            t = await resp.text()
        else:
            print("It is sync: resp.text()")
            t = resp.text()
        print(f"Result: {t}")
        
asyncio.run(main())
