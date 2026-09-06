import asyncio
from backend.routers.builder_actions import call_ai
import os
import dotenv

dotenv.load_dotenv(r"C:\antigravityAS\BennerAI\.env")

async def test():
    try:
        sys_p = "You are a test."
        usr_p = "Reply with 'OK'"
        res, model = await call_ai(sys_p, usr_p)
        print(f"SUCCESS: {res} using {model}")
    except Exception as e:
        print(f"FAILED: {e}")

asyncio.run(test())
