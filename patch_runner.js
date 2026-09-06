const fs = require('fs');
const path = 'backend/sandbox/runner.py';
let content = fs.readFileSync(path, 'utf8');
content = "# -*- coding: utf-8 -*-\n" + content;
fs.writeFileSync(path, content, 'utf8');
