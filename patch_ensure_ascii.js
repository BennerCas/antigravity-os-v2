const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/json\.dumps\((.*?)\)/g, 'json.dumps($1, ensure_ascii=False)');

fs.writeFileSync(path, content, 'utf8');
