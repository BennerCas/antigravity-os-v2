const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\/\*\* Get the content[\s\S]*?const getActivePromptContent[\s\S]*?return String\(target\.data\?\.content \|\| target\.data\?\.title \|\| ''\);\s*\};\s*/, '');

fs.writeFileSync(path, content, 'utf8');
