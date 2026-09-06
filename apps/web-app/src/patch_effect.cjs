const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace("'border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.3)] bg-gray-800/80'", "'border-[var(--accent-cyan)] !bg-[var(--accent-soft)]'");

fs.writeFileSync(file, c);
console.log('Patched selected effect');
