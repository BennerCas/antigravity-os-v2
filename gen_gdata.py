import re
import json

with open('backend/services/academy/catalog_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

skills = {}
for block in re.finditer(r'\"([^\"]+)\": Skill\((.*?)\)', content, re.DOTALL):
    sk_id = block.group(1)
    sk_data = block.group(2)
    name_m = re.search(r'name=\"([^\"]+)\"', sk_data)
    name = name_m.group(1) if name_m else sk_id
    cat_m = re.search(r'category=\"([^\"]+)\"', sk_data)
    cat = cat_m.group(1) if cat_m else ''
    unlocked_m = re.search(r'unlocked_by=\[(.*?)\]', sk_data)
    unlocked = [m.strip('\"\' ') for m in unlocked_m.group(1).split(',')] if unlocked_m and unlocked_m.group(1).strip() else []
    
    prereqs_m = re.search(r'prerequisites=\[(.*?)\]', sk_data)
    prereqs = [m.strip('\"\' ') for m in prereqs_m.group(1).split(',')] if prereqs_m and prereqs_m.group(1).strip() else []
    
    skills[sk_id] = {'name': name, 'category': cat, 'unlocked_by': unlocked, 'prereqs': prereqs}

# Manual patch for missing mission 15
missions = {
    'mission_15': {
        'title': 'Paralelismo y joins: Investiga sin pisar datos',
        'desc': 'Crea un Fork que lance investigación de cliente, producto y riesgo en paralelo, luego un Join all con Reducer para unificar los reportes.'
    }
}
for block in re.finditer(r'MissionDefinition\((.*?)\n            \)', content, re.DOTALL):
    m_data = block.group(1)
    id_m = re.search(r'id=\"([^\"]+)\"', m_data)
    m_id = id_m.group(1) if id_m else None
    if m_id:
        title_m = re.search(r'title=\"([^\"]+)\"', m_data)
        title = title_m.group(1) if title_m else m_id
        desc_m = re.search(r'brief=\"(.*?)\",\n', m_data, re.DOTALL)
        desc = desc_m.group(1) if desc_m else ''
        missions[m_id] = {'title': title, 'desc': desc.replace('\n', ' ').strip()}

# Colors for categories
COLORS = {
    'foundation': '#00f5d4',
    'builder': '#00bbf9',
    'operator': '#fee440',
    'architect': '#f15bb5',
    'expert': '#9b5de5'
}

GROUPS = {
    'foundation': 1,
    'builder': 2,
    'operator': 3,
    'architect': 4,
    'expert': 5
}

ICONS = {
    'foundation': '🧭',
    'builder': '🏗️',
    'operator': '⚙️',
    'architect': '📐',
    'expert': '👑'
}

nodes = []
links = []

# Center node
nodes.append({
    'id': 'center',
    'name': 'FLOWARCHITECT AI',
    'desc': 'Core Ontology of the Antigravity Agentic Framework.',
    'val': 100,
    'color': '#ffffff',
    'group': 0,
    'icon': '🚀'
})

skill_id_map = {}
idx = 1
for sk_id, sk in skills.items():
    s_node_id = f"n{idx}"
    skill_id_map[sk_id] = s_node_id
    
    nodes.append({
        'id': s_node_id,
        'name': f"{idx}. {sk['name']}",
        'desc': sk['name'],
        'val': 32,
        'color': COLORS.get(sk['category'], '#ffffff'),
        'icon': ICONS.get(sk['category'], '✅'),
        'group': GROUPS.get(sk['category'], 1)
    })
    
    links.append({
        'source': 'center',
        'target': s_node_id,
        'name': 'core_competency'
    })
    
    # Sub competencies (missions)
    sub_idx = 1
    for m_id in sk['unlocked_by']:
        if m_id in missions:
            m = missions[m_id]
            sub_node_id = f"{s_node_id}_{m_id}"
            nodes.append({
                'id': sub_node_id,
                'name': m['title'],
                'desc': m['desc'],
                'val': 12,
                'color': COLORS.get(sk['category'], '#ffffff'),
                'group': GROUPS.get(sk['category'], 1),
                'isSub': True
            })
            
            links.append({
                'source': s_node_id,
                'target': sub_node_id,
                'name': 'evaluates_with'
            })
            sub_idx += 1
            
    idx += 1

# Cross-links for prerequisites
for sk_id, sk in skills.items():
    s_node_id = skill_id_map.get(sk_id)
    if s_node_id:
        for pre in sk['prereqs']:
            pre_node_id = skill_id_map.get(pre)
            if pre_node_id:
                links.append({
                    'source': pre_node_id,
                    'target': s_node_id,
                    'name': 'prerequisite'
                })

out = "export const gData: { nodes: GraphSkillNode[]; links: GraphSkillLink[] } = {\n  nodes: [\n"
for n in nodes:
    out += "    " + json.dumps(n) + ",\n"
out += "  ],\n  links: [\n"
for l in links:
    out += "    " + json.dumps(l) + ",\n"
out += "  ]\n};\n"

with open('new_gdata.ts', 'w', encoding='utf-8') as f:
    f.write(out)
