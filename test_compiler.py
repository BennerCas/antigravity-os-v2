import requests

payload = {
    "framework": "langgraph",
    "nodes": [
        {"id": "1", "title": "Node 1", "content": "Analyze this data", "role": "Analyst", "llm_model": "free.ai/qwen7b"}
    ],
    "edges": []
}

resp = requests.post("http://127.0.0.1:8000/api/v1/compile/generate", json=payload)
print("LangGraph HTTP Code:", resp.status_code)
print(resp.json()["code"][:200] if resp.status_code == 200 else resp.text)

payload["framework"] = "autogen"
resp = requests.post("http://127.0.0.1:8000/api/v1/compile/generate", json=payload)
print("AutoGen HTTP Code:", resp.status_code)
print(resp.json()["code"][:200] if resp.status_code == 200 else resp.text)

payload["framework"] = "crewai"
resp = requests.post("http://127.0.0.1:8000/api/v1/compile/generate", json=payload)
print("CrewAI HTTP Code:", resp.status_code)
print(resp.json()["code"][:200] if resp.status_code == 200 else resp.text)
