const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');
c = c.replace("fetch((import.meta.env.BASE_URL || '/') + 'skills.json');", "fetch((import.meta.env.BASE_URL || '/') + 'skills.json?v=' + Date.now());");
fs.writeFileSync(file, c);
console.log('Cache busted');
