const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace("'border-[var(--accent-cyan)] !bg-[var(--accent-soft)]'", "'border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.2)] !bg-[#39ff14]/10'");

fs.writeFileSync(file, c);
console.log('Patched to neon green');
