import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if 'import SpriteText' not in content:
    content = content.replace("import ForceGraph3D", "import ForceGraph3D\nimport SpriteText from 'three-spritetext';")

# Find the end of linkDirectionalParticleColor block
ldpc_start = content.find('.linkDirectionalParticleColor')
ldpc_end = content.find('});', ldpc_start) + 3

injection = """
      .linkThreeObjectExtend(true)
      .linkThreeObject((link: GraphSkillLink) => {
        if (!link.name) return null as any;
        const sprite = new SpriteText(link.name);
        sprite.color = 'rgba(255,255,255,0.85)';
        sprite.textHeight = 2.5;
        sprite.fontFace = 'Inter, sans-serif';
        sprite.padding = 1.5;
        sprite.borderWidth = 0.2;
        sprite.borderColor = 'rgba(255,255,255,0.3)';
        sprite.backgroundColor = 'rgba(5, 8, 20, 0.8)';
        return sprite;
      })
      .linkPositionUpdate((sprite: any, { start, end }: any) => {
        if (!sprite) return;
        const middlePos = Object.assign({}, ...['x', 'y', 'z'].map(c => ({
          [c]: start[c] + (end[c] - start[c]) / 2 
        })));
        Object.assign(sprite.position, middlePos);
      })"""

# Insert the injection after ldpc_end
new_content = content[:ldpc_end] + injection + content[ldpc_end:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Link labels successfully injected.")
