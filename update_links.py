import re, json

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. We need to parse gData.links to update names and add cross-skill links
# Finding the links array in gData
links_match = re.search(r'links:\s*\[(.*?)\]\s*,\s*// 4\. Manually', content, re.DOTALL)
if not links_match:
    links_match = re.search(r'links:\s*\[(.*?)\]\s*};', content, re.DOTALL)

if not links_match:
    print("Could not find links array")
    exit(1)

links_str = links_match.group(1)

# A simplistic parser to modify the links
# Let's extract all link lines
lines = links_str.strip().split('\n')
new_lines = []
for line in lines:
    line = line.strip()
    if not line: continue
    if line.endswith(','): line = line[:-1]
    
    try:
        obj = json.loads(line)
        # Apply names based on rules
        if obj.get('source') == 'center':
            obj['name'] = 'Núcleo'
        elif 'mission' in obj.get('target', ''):
            if obj.get('source').startswith('n'):
                obj['name'] = 'Misión'
            else:
                obj['name'] = 'Flujo'
        elif '_c' in obj.get('target', ''):
            if obj.get('source').startswith('n') and '_' not in obj.get('source'):
                obj['name'] = 'Habilidad'
            else:
                obj['name'] = 'Secuencia'
        elif obj.get('source').startswith('n') and obj.get('target').startswith('n'):
             if not obj.get('name'):
                 obj['name'] = 'Dependencia'
        
        # Serialize back
        new_lines.append('    ' + json.dumps(obj) + ',')
    except Exception as e:
        # If parsing fails, just keep it
        new_lines.append('    ' + line + ',')

# Add cross-skill relationship bridges
cross_links = [
    {"source": "n3_c01", "target": "n6_c03", "name": "Flujo de Datos"},
    {"source": "n4_c03", "target": "n8_c01", "name": "Manejo de Errores"},
    {"source": "n5_c01", "target": "n4_c01", "name": "Decisión IA"},
    {"source": "n9_c01", "target": "n7_c01", "name": "Seguridad"},
    {"source": "n11_c01", "target": "n12_c01", "name": "Input Arquitectura"},
    {"source": "n13_c01", "target": "n14_c02", "name": "Paralelismo"},
    {"source": "n15_c01", "target": "n10_c01", "name": "Telemetría"},
    {"source": "n8_c02", "target": "n12_c03", "name": "Transaccionalidad"},
    {"source": "n6_c04", "target": "n16_c02", "name": "Evaluación Masiva"},
    {"source": "n2_c02", "target": "n14_c03", "name": "Sincronización"}
]

for cl in cross_links:
    new_lines.append('    ' + json.dumps(cl) + ',')

new_links_block = '\n'.join(new_lines) + '\n  '

new_content = content[:links_match.start(1)] + '\n' + new_links_block + content[links_match.end(1):]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated links with names and injected {len(cross_links)} cross-skill bridges.")
