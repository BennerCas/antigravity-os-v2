class AgentFactory:
    @staticmethod
    async def chat_stream(agent_id: str, user_prompt: str, override_instructions=None, model=None):
        yield "hola"

import asyncio
async def main():
    async for c in AgentFactory.chat_stream(agent_id="omni", user_prompt="a"):
        print(c)
asyncio.run(main())
