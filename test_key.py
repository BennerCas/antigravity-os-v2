import os
from dotenv import load_dotenv

ENV_PATH = r"C:\antigravityAS\Antigravity_OS_v2\backend\.env"
load_dotenv(ENV_PATH)

print(f"Key loaded: {os.getenv('GEMINI_API_KEY_1')[:5]}...")