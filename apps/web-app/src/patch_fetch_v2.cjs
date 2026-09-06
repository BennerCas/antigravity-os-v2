const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace("'skills.json?v=' + Date.now()", "'skills_v2.json'");

fs.writeFileSync(file, c);
console.log('Patched to skills_v2.json');
