MASTER_PROMPTS = []
FREE_AI_MODELS_CASCADE = ["gemini-1.5-flash", "llama3"]
OLLAMA_BASE = "http://127.0.0.1:8080/v1"


async def call_ai(system_prompt, user_prompt):
    return ("Respuesta simulada", "dummy-model")
