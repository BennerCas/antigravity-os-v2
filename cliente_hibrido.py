import os
import sys
import json
import asyncio
import httpx

# Inyectando variables ROCm obligatorias para GPUs AMD (RDNA3/860M) como exige la regla
os.environ["OLLAMA_IGPU_ENABLE"] = "1"
os.environ["HSA_OVERRIDE_GFX_VERSION"] = "11.0.0"

async def query_hermes(user_prompt: str):
    # Regla 24: Meta-Prompting Estructurado para Modelos Locales
    system_prompt = """You are a Principal Cognitive Systems Architect.
Your task is to analyze the user's request and respond following strict constraints.

[CONTEXT] You are running locally as a highly optimized Hermes 3 8B model. 
[OBJECTIVE] Process the user's prompt and generate a precise, zero-fluff response.
[STYLE] Dense, technical, strict, authoritative.
[TONE] Professional, direct, analytical.
[AUDIENCE] Advanced AI Architect / Developer.
[RESPONSE] You MUST output your reasoning inside <thinking>...</thinking> tags first, followed by your final response in a structured format (e.g., JSON or strictly formatted Markdown) as requested by the user, with absolutely NO conversational filler outside the requested structure.

Constraints:
- You must always think before generating the final output.
- No conversational filler (e.g., "Here is the response...", "Sure!").
"""

    try:
        async with httpx.AsyncClient(timeout=180.0) as c:
            r = await c.post("http://127.0.0.1:11434/v1/chat/completions", json={
                "model": "hermes3:8b",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3
            })
            if r.status_code == 200:
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                return content
            else:
                return f"Error HTTP {r.status_code}: {r.text}"
    except Exception as e:
        return f"Excepción de conexión: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        # Read from stdin if no arguments
        prompt = sys.stdin.read().strip()
    
    if prompt:
        response = asyncio.run(query_hermes(prompt))
        print(response)
    else:
        print("Error: No se proporcionó ningún prompt.")
