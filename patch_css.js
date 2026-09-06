const fs = require('fs');
const path = 'apps/web-app/src/index.css';
let content = fs.readFileSync(path, 'utf8');

content += `\n
/* Drawing Node Eraser Mode */
.drawing-node-wrapper {
  pointer-events: none;
}
.erase-mode .drawing-node-wrapper, .erase-mode .drawing-node-wrapper svg, .erase-mode .drawing-node-wrapper path, .erase-mode .drawing-node-wrapper line {
  pointer-events: stroke !important;
  cursor: crosshair !important;
}
`;

fs.writeFileSync(path, content, 'utf8');
console.log("Added CSS for erase mode");
