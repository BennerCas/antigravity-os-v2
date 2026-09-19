import json
import re

with open('backend/skills_v2.json', 'r', encoding='utf-8') as f:
    skills = json.load(f)

aurelios_agents = [s for s in skills if s.get('category') == 'AureliOS']

prompts_list = []
for a in aurelios_agents:
    text = a.get('instructions', '').replace('\n', ' ')
    prompts_list.append({
        'key': a.get('id'),
        'used_at': 'God-Tier Pantheon',
        'text': text,
        'explanation': a.get('name')
    })

pantheon_app = {
    "id": "pantheon",
    "name": "Panteón (God-Tier Agents)",
    "page": "/agentland",
    "what": "Los 13 agentes fundacionales del Grid de AureliOS. Sistemas ultra-especializados promovidos a God-Tier con el Golden Triangle.",
    "prompts": prompts_list
}

pantheon_str = json.dumps(pantheon_app, indent=12, ensure_ascii=False)
# indent 12 to match the format of arch['apps']

with open('backend/routers/architecture.py', 'r', encoding='utf-8') as f:
    text = f.read()

# I want to insert it at the beginning of arch["apps"]
# arch["apps"] is inside get_architecture()
pattern = r'(\"apps\":\s*\[)'
replacement = r'\g<1>\n' + ' ' * 12 + pantheon_str + ','

text = re.sub(pattern, replacement, text, count=1)

with open('backend/routers/architecture.py', 'w', encoding='utf-8') as f:
    f.write(text)
