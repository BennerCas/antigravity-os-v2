const fs = require('fs');
const path = 'apps/web-app/src/components/builder/PropertiesPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetLabel = '<label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider opacity-70">Framework Objetivo</label>';
const replacement = '<div className="flex items-center gap-2 mb-1.5"><label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Framework Objetivo</label><button onClick={() => playTTS(frameworkDescriptions[data.framework || \'auto\'])} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>';

content = content.replace(targetLabel, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed Framework TTS icon.");
