import json
import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        req = {
            "prompts": [{"key": "test_prompt", "category": "prompt", "text": "Este es un test"}],
            "stream": True
        }
        async with client.stream('POST', 'http://127.0.0.1:8000/api/v1/architecture/evolve-batch', json=req) as response:
            async for line in response.aiter_lines():
                print(line)

asyncio.run(main())
