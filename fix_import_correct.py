with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad = "import ForceGraph3D\nimport SpriteText from 'three-spritetext';, { ForceGraph3DInstance } from '3d-force-graph';"
good = "import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';\nimport SpriteText from 'three-spritetext';"

content = content.replace(bad, good)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
