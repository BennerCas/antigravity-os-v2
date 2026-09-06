const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to replace className="..." with className={`... ${selected ? 'ring-4 ring-[var(--theme-border)] shadow-[0_0_25px_var(--theme-border)] z-50' : ''}`}
// But we only want to do this for the outermost div of each exported Node.

// Let's do it by finding:
// 1. "export const MainPromptNode" ... up to "return (" ... "<div className="
// A safe way is to replace `className="transition-colors duration-300 p-6 rounded-xl shadow-2xl w-full h-full min-w-[288px] min-h-[200px] border-t-4 relative"`
// with className={`transition-colors duration-300 p-6 rounded-xl shadow-2xl w-full h-full min-w-[288px] min-h-[200px] border-t-4 relative ${selected ? 'ring-4 ring-[var(--theme-border)] shadow-[0_0_30px_var(--theme-border)] z-50 scale-[1.02]' : ''}`}

const targetClasses = 'transition-colors duration-300 p-6 rounded-xl shadow-2xl w-full h-full min-w-[288px] min-h-[200px] border-t-4 relative';
const replacement = '`transition-colors duration-300 p-6 rounded-xl shadow-2xl w-full h-full min-w-[288px] min-h-[200px] border-t-4 relative ${selected ? \'ring-4 ring-[var(--theme-border)] shadow-[0_0_40px_var(--theme-border)] z-50 scale-[1.02]\' : \'\'}`';

content = content.replace(new RegExp(`className="${targetClasses}"`, 'g'), `className={${replacement}}`);

// Also PostItNode might have different classes:
const postItTarget = 'shadow-xl w-full h-full min-w-[200px] min-h-[200px] relative p-4';
const postItRepl = '`shadow-xl w-full h-full min-w-[200px] min-h-[200px] relative p-4 ${selected ? \'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] z-50 scale-[1.02]\' : \'\'}`';
content = content.replace(new RegExp(`className="${postItTarget}"`, 'g'), `className={${postItRepl}}`);

fs.writeFileSync(path, content, 'utf8');
console.log("Highlighted selected nodes successfully.");
