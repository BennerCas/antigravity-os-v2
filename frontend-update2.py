import json
import re

with open('backend/skills_v2.json', 'r', encoding='utf-8') as f:
    skills = json.load(f)

aurelios_agents = [s for s in skills if s.get('category') == 'AureliOS']

cards = []
for a in aurelios_agents:
    # clean description from newlines
    desc = a.get('instructions', '').replace('\n', ' ')[:100] + '...'
    cards.append({
        'id': a.get('id'),
        'name': a.get('name'),
        'role': 'God-Tier Agent',
        'description': desc,
        'genes': [],
        'noveltyScore': 99,
        'evalStatus': 'PASS',
        'color': '#00D9FF',
        'health': 'green'
    })

cards_json = json.dumps(cards, indent=2)

with open('apps/web-app/src/stores/useStudioStore.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# I need to restore the previous broken JSON and replace it again.
# The broken json starts with agentCards: [\n  {\n    "id": "aurelios-core", and ends with "health": "green"\n  }\n],
text = re.sub(r'agentCards:\s*\[[\s\S]*?"health": "green"\s*\}\s*\],', f'agentCards: {cards_json},', text)

with open('apps/web-app/src/stores/useStudioStore.ts', 'w', encoding='utf-8') as f:
    f.write(text)
