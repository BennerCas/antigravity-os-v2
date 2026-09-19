import json
import re

with open('backend/skills_v2.json', 'r', encoding='utf-8') as f:
    skills = json.load(f)

aurelios_agents = [s for s in skills if s.get('category') == 'AureliOS' and s.get('id') != 'aurelios-core']
# Wait, I also need AureliOS himself, the user said "los 12 agentes del grid de aurelios"
# Let's just get all AureliOS category agents.
aurelios_agents = [s for s in skills if s.get('category') == 'AureliOS']

# Convert them to AgentCard format
cards = []
for a in aurelios_agents:
    cards.append({
        'id': a.get('id'),
        'name': a.get('name'),
        'role': 'God-Tier Agent',
        'description': a.get('instructions', '')[:100] + '...',
        'genes': [],
        'noveltyScore': 99,
        'evalStatus': 'PASS',
        'color': '#00D9FF',
        'health': 'green'
    })

cards_json = json.dumps(cards, indent=2)

with open('apps/web-app/src/stores/useStudioStore.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# find agentCards: AgentCard[]; and replace with default values in the store
# In useStudioStore.ts, it's defined inside create<StudioState>()(...)
text = re.sub(r'agentCards:\s*\[\]\s*,', f'agentCards: {cards_json},', text)

with open('apps/web-app/src/stores/useStudioStore.ts', 'w', encoding='utf-8') as f:
    f.write(text)
