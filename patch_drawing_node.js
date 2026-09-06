const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /className="drawing-node-wrapper" style=\{\{ pointerEvents: "none" \}\}/g,
    'className="drawing-node-wrapper" style={{ pointerEvents: "none", width: 1, height: 1, overflow: "visible" }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed DrawingNode dimensions");
