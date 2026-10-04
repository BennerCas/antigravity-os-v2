import asyncio
import httpx
from dotenv import load_dotenv
load_dotenv("backend/.env")

async def test_stream():
    url = "http://127.0.0.1:8001/api/v1/studio/freechat_stream"
    payload = {
        "messages": [{"role": "user", "content": "hola dime 1 2 3"}]
    }
    
    print("Iniciando peticion stream...")
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", url, json=payload) as response:
            print(f"Status: {response.status_code}")
            async for chunk in response.aiter_text():
                print(chunk, end="", flush=True)

asyncio.run(test_stream())
