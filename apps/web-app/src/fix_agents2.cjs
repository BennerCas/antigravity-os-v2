const fs = require('fs');
let c = fs.readFileSync('c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents_cut.tsx', 'utf8');

const append = `
                    )}
                  </div>
                </div>
              );
            })}
            {displayAgentes.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10 text-lg">
                No se encontraron agentes.
              </div>
            )}
          </div>
        </div>
      )}

      </div> {/* End Left Column */}

      {/* Right Column: AI & Inspected Agent */}
      <div className="w-80 md:w-96 border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="font-bold text-gray-200 flex items-center gap-2"><Sparkle size={18} className="text-blue-400" /> Panel del Agente</h2>
          {inspectedAgent && (
            <button onClick={() => setInspectedAgent(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {inspectedAgent ? (
            <div className="flex flex-col gap-6">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{inspectedAgent.category?.split(' > ').pop() || 'Agente'}</span>
                <h3 className="text-2xl font-bold text-white mt-1 leading-tight">{inspectedAgent.title}</h3>
              </div>
              
              <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                {inspectedAgent.content}
              </div>

              <div className="flex flex-col gap-2">
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
              </div>

              <button 
                onClick={(e) => handleSetAgent(e as any, inspectedAgent)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-1"
              >
                Abrir en el Builder →
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <p>Selecciona un agente en el directorio para ver sus detalles y herramientas de IA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Agents;
`;

c = c + append;
fs.writeFileSync('c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx', c);
console.log('Done!');
