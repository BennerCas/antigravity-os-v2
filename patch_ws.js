const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    "const ws = new WebSocket('ws://127.0.0.1:8000/ws/execute');",
    "const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/execute');"
);

fs.writeFileSync(path, content, 'utf8');
console.log("WebSocket URL fixed in Builder.tsx");
