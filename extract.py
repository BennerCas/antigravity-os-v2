with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'export interface KnowledgeGraph3DProps' in line:
        print(f"Component starts at line {i}")
        break
