from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
import asyncio
import os
from dotenv import load_dotenv

ENV_PATH = r"C:\antigravityAS\Antigravity_OS_v2\backend\.env"
load_dotenv(ENV_PATH)

async def test():
    config = LocalAgentConfig(
        api_key=os.getenv("GEMINI_API_KEY_1", "invalid"),
        system_instructions="Eres un asistente util.",
        tools=[],
        capabilities=CapabilitiesConfig(enable_subagents=False),
        model=None
    )
    if "GEMINI_API_BASE_URL" in os.environ:
        del os.environ["GEMINI_API_BASE_URL"]
        
    async with Agent(config) as agent:
        response = await agent.chat("Hola")
        text = await response.text()
        print(text)

asyncio.run(test())