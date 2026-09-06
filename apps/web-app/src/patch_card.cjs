const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

const oldLine = "className={`bg-gray-900 border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group ${inChain ? 'border-purple-500 shadow-purple-900/30 shadow-lg' : 'border-gray-800 hover:border-blue-500'}`}";
const newLine = "className={`bg-gray-900 border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group ${inChain ? 'border-purple-500 shadow-purple-900/30 shadow-lg' : (inspectedAgent && makeAgentKey(inspectedAgent) === key) ? 'border-[#39ff14] shadow-[0_0_20px_rgba(57,255,20,0.3)] bg-gray-800/80' : 'border-gray-800 hover:border-blue-500'}`}";

c = c.replace(oldLine, newLine);
fs.writeFileSync(file, c);
console.log('Patched agent card CSS');
