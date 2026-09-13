with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken import
# It probably looks like: import ForceGraph3D
# import SpriteText from 'three-spritetext'; from 'react-force-graph-3d';
content = content.replace("import ForceGraph3D\nimport SpriteText from 'three-spritetext'; from 'react-force-graph-3d';", "import ForceGraph3D from 'react-force-graph-3d';\nimport SpriteText from 'three-spritetext';")
content = content.replace("import ForceGraph3D\nimport SpriteText from 'three-spritetext';from 'react-force-graph-3d';", "import ForceGraph3D from 'react-force-graph-3d';\nimport SpriteText from 'three-spritetext';")
content = content.replace("import ForceGraph3D\nimport SpriteText from 'three-spritetext'; { ForceGraph3DInstance }", "import ForceGraph3D, { ForceGraph3DInstance }")

# Just find the top imports to see what went wrong
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
