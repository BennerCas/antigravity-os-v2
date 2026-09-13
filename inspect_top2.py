with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Graph Toolbar Overlay' in line:
        print(f"Overlay found at line {i}")
    if 'export function KnowledgeGraph3D' in line:
        print(f"Component starts at line {i}")
