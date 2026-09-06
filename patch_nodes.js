const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

// Patch MainPromptNode
content = content.replace(
    /className="transition-colors duration-300 p-6 rounded-xl shadow-2xl w-full h-full min-w-\[288px\] min-h-\[200px\] border-t-4 relative"/,
    'className="flex flex-col transition-colors duration-300 p-6 rounded-xl shadow-2xl w-[360px] h-[640px] border-t-4 relative"'
).replace(
    /<h3 className="font-bold text-lg mb-2 pr-6">\{data\.title \|\| "Main Prompt"\}<\/h3>/,
    '<h3 className="font-bold text-lg mb-2 pr-6 flex-shrink-0">{data.title || "Main Prompt"}</h3>'
).replace(
    /className="w-full h-\[calc\(100%-35px\)\] bg-black\/20 border border-transparent hover:border-zinc-500\/30 rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 whitespace-pre-wrap"/,
    'className="flex-grow w-full bg-black/20 border border-transparent hover:border-zinc-500/30 rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 whitespace-pre-wrap"'
);

// Patch ActionNode
content = content.replace(
    /className="transition-colors duration-300 p-5 rounded-xl shadow-\[0_20px_50px_rgba\(0,_0,_0,_0\.5\)\] w-full h-full min-w-\[288px\] min-h-\[200px\] border-t-4 transform transition-transform hover:scale-105 relative"/,
    'className="flex flex-col transition-colors duration-300 p-6 rounded-xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] w-[360px] h-[640px] border-t-4 transform transition-transform hover:scale-105 relative"'
).replace(
    /<h3 className="font-bold mb-2 pr-6">\{data\.title \|\| data\.actionType \|\| "Action Node"\}<\/h3>/,
    '<h3 className="font-bold text-lg mb-2 pr-6 flex-shrink-0">{data.title || data.actionType || "Action Node"}</h3>'
).replace(
    /className="w-full h-\[calc\(100%-35px\)\] bg-black\/20 border border-transparent hover:border-zinc-500\/30 rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 whitespace-pre-wrap"/,
    'className="flex-grow w-full bg-black/20 border border-transparent hover:border-zinc-500/30 rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 whitespace-pre-wrap"'
);

// Patch LogicaNode
content = content.replace(
    /className="transition-colors duration-300 p-5 rounded-xl shadow-\[0_20px_50px_rgba\(0,_0,_0,_0\.5\)\] w-full h-full min-w-\[320px\] min-h-\[150px\] border-t-4 transform transition-transform hover:scale-105 relative"/,
    'className="flex flex-col transition-colors duration-300 p-6 rounded-xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] w-[360px] h-[640px] border-t-4 transform transition-transform hover:scale-105 relative"'
).replace(
    /<h3 className="font-bold mb-2 pr-6 flex items-center gap-2">🧠 Lógica del Prompt<\/h3>/,
    '<h3 className="font-bold text-lg mb-2 pr-6 flex items-center gap-2 flex-shrink-0">🧠 Lógica del Prompt</h3>'
).replace(
    /className="w-full h-\[100px\] bg-black\/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap opacity-90"/,
    'className="flex-grow w-full bg-black/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap opacity-90"'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated node dimensions");
