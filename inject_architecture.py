import json
import os

with open("backend/skills_v2.json", "r", encoding="utf-8") as f:
    skills = json.load(f)

aurelios_agents = [s for s in skills if s.get("category") == "AureliOS"]

prompts_list = []
for a in aurelios_agents:
    prompts_list.append({
        "key": a["id"],
        "used_at": "AgentOS Studio",
        "text": a["instructions"],
        "explanation": a["description"]
    })

prompts_str = ",\n                    ".join([repr(p) for p in prompts_list])

new_step_code = f"""            {{
                "step": 0,
                "id": "aurelios",
                "name": "AureliOS — El Motor Central",
                "page": "/studio",
                "what": "El Olimpo de los 13 Dioses de la Arquitectura. Aquí reside el Sistema Operativo (AureliOS) y su enjambre de élite. Estos son los perfiles Tier-1 que orquestan Antigravity OS en tiempo real.",
                "prompts": [
                    {prompts_str}
                ],
            }},"""

with open("backend/routers/architecture.py", "r", encoding="utf-8") as f:
    arch_py = f.read()

arch_py = arch_py.replace('"flow": [', '"flow": [\n' + new_step_code)

with open("backend/routers/architecture.py", "w", encoding="utf-8") as f:
    f.write(arch_py)

print("Architecture updated.")
