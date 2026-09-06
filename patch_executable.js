const fs = require('fs');
const path = 'backend/routers/runtime.py';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import sys')) {
    content = content.replace('import os', 'import os\nimport sys');
}
content = content.replace(/asyncio\.create_subprocess_exec\(\s*"python"/g, 'asyncio.create_subprocess_exec(\n                    sys.executable');

fs.writeFileSync(path, content, 'utf8');
