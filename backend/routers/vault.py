import os
import httpx
from fastapi import APIRouter
from dotenv import dotenv_values

router = APIRouter(
    prefix="/vault",
    tags=["vault"]
)

from config import ENV_PATH

def get_masked_env():
    if not os.path.exists(ENV_PATH):
        return {}
    
    # Load raw env without setting to os.environ
    env_vars = dotenv_values(ENV_PATH)
    masked_vars = {}
    
    target_prefixes = ["GROQ", "GEMINI", "HF_", "GITHUB", "MISTRAL", "OLLAMA_AUTH", "SERPAPI", "FREE_AI"]
    
    for key, value in env_vars.items():
        if value and any(key.startswith(prefix) for prefix in target_prefixes):
            if len(value) > 8:
                masked_vars[key] = f"{value[:4]}***{value[-4:]}"
            else:
                masked_vars[key] = "***"
                
    return masked_vars

@router.get("/status")
async def get_vault_status():
    keys_status = get_masked_env()
    
    ollama_status = []
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://127.0.0.1:11434/api/ps")
            if response.status_code == 200:
                data = response.json()
                models = data.get("models", [])
                for model in models:
                    ollama_status.append({
                        "name": model.get("name"),
                        "size": model.get("size"),
                        "size_vram": model.get("size_vram")
                    })
    except Exception as e:
        print(f"Error fetching Ollama status: {e}")
        
    return {
        "api_keys": keys_status,
        "ollama_models": ollama_status
    }
