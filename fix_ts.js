const fs = require('fs');

let content = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

content = content.replace('let frameId;', 'let frameId: number;');

content = content.replace(/if\(baseNode && baseNode\.fx !== undefined\) \{([\s\S]*?)\}/, `if(baseNode && typeof baseNode.fx === 'number' && typeof baseNode.fy === 'number' && typeof baseNode.fz === 'number') {$1}`);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', content);
