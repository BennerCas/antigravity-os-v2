const fs = require('fs');
let content = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');
content = content.replace('const text = `??  ${node.name}`;', 'const text = `${node.icon || "💡"}  ${node.name}`;');
fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', content);
