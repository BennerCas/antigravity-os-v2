with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused SpriteText import
content = content.replace("import SpriteText from 'three-spritetext';\n", "")

# Remove unused rotAngle let
content = content.replace("    let rotAngle = 0;\n    let animId: number;\n    const scene = graph.scene?.();",
                           "    let animId: number;\n    const scene = graph.scene?.();")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
