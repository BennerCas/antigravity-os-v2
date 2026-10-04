import asyncio, httpx

async def test():
    print("Probando hermes3:8b en Ollama...")
    try:
        async with httpx.AsyncClient(timeout=180.0) as c:
            r = await c.post("http://127.0.0.1:11434/v1/chat/completions", json={
                "model": "hermes3:8b",
                "messages": [{"role": "user", "content": "responde solo: FUNCIONA"}],
                "temperature": 0.1
            })
            print(f"Status: {r.status_code}")
            if r.status_code == 200:
                data = r.json()
                content = data["choices"][0]["message"]["content"]
                print("Respuesta Hermes:", content)
            else:
                print("Error:", r.text[:300])
    except Exception as e:
        print(f"Excepcion: {e}")

asyncio.run(test())
