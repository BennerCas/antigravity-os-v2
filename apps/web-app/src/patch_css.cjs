const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/index.css';
let c = fs.readFileSync(file, 'utf8');
c = c.replace('@plugin "@tailwindcss/typography";', '');
c += '\n@plugin "@tailwindcss/typography";\n';
fs.writeFileSync(file, c);
console.log('Fixed imports order');
