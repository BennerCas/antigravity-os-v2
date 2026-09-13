const fs = require('fs');
let code = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

const bgCode = `
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
      // Load and apply background texture
      new THREE.TextureLoader().load('/images/bg_space.jpg', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      });
    }
`;

code = code.replace(`
    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
    }
`, bgCode);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', code);
