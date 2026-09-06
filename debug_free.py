import asyncio
import os
import httpx
import dotenv

dotenv.load_dotenv(r"C:\antigravityAS\BennerAI\.env")
FREE_AI_KEY = os.getenv("FREE_AI_API_KEY")
FREE_AI_BASE = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")

async def test():
    print(f"Key: {FREE_AI_KEY[:10]}... Base: {FREE_AI_BASE}")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{FREE_AI_BASE}/models", headers={"Authorization": f"Bearer {FREE_AI_KEY}"})
            print(resp.status_code)
            print(resp.text[:200])
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
