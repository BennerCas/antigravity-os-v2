import asyncio

import httpx


async def test():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                "http://localhost:8001/api/v1/builder/flowboard/copilot",
                json={"message": "¿Cómo está la memoria del sistema?"},
            )
            print(res.json())
        except Exception as e:
            print("Error:", e)


asyncio.run(test())
