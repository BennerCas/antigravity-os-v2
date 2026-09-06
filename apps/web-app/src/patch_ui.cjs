const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace('className="w-80 md:w-96 border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl"', 'className="w-96 md:w-[600px] border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl"');

const oldContentDiv = `              <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                {inspectedAgent.content}
              </div>`;

const newContentDiv = `              <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] whitespace-pre-wrap font-mono text-[13px]">
                {inspectedAgent.instructions || inspectedAgent.content}
              </div>`;

c = c.replace(oldContentDiv, newContentDiv);

const oldButtons = `<div className="flex flex-col gap-2">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-800 pb-2 mb-1">Botones AI</div>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  ⬆️ Upgrade
                </button>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  ⚛️ Atomizar
                </button>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  🌍 Traducir
                </button>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  ✏️ Editar
                </button>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  📝 Nota
                </button>
                <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-start gap-3 w-full px-4 py-2.5 text-sm font-medium transition-all shadow-sm">
                  🧠 Lógica
                </button>
              </div>`;

const newButtons = `<div className="flex flex-col gap-2">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-800 pb-2 mb-1">Herramientas IA</div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    ⬆️ Upgrade
                  </button>
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    ⚛️ Atomizar
                  </button>
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    🌍 Traducir
                  </button>
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    ✏️ Editar
                  </button>
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    📝 Nota
                  </button>
                  <button className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]">
                    🧠 Lógica
                  </button>
                </div>
              </div>`;

c = c.replace(oldButtons, newButtons);

fs.writeFileSync(file, c);
console.log('Patched UI for Agent details!');
