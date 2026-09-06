const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\/\/ Safe serialization/g, '# Safe serialization');
fs.writeFileSync(path, content, 'utf8');
