import asyncio
import httpx

async def test_stream():
    url = "http://127.0.0.1:8002/api/v1/studio/freechat_stream"
    payload = {
        "messages": [{"role": "user", "content": "Hola, di solo 3 palabras."}],
        "files": []
    }
    
    print("Iniciando peticion stream...")
    async with httpx.AsyncClient(timeout=30) as client:
        async with client.stream("POST", url, json=payload) as response:
            print(f"Status: {response.status_code}")
            async for chunk in response.aiter_text():
                print(chunk, end="", flush=True)

if __name__ == "__main__":
    asyncio.run(test_stream())
