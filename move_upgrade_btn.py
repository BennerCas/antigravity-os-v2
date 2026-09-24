import re

path = r"c:\antigravityAS\Antigravity_OS_v2\apps\web-app\src\pages\AgentOSStudio.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Buscamos el contenedor de los botones de la barra inferior
match = re.search(r'(<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex gap-4">).*?(</div>\s*</div>\s*</div>\s*\);\s*};)', text, re.DOTALL)

if match:
    new_buttons = """<div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex gap-4">
          {activeTab === 'synthesis' ? (
            <button 
              onClick={go2WF}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm bg-emerald-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Robot size={18} weight="duotone" />
              Go2WF
            </button>
          ) : activeTab === 'discovery' ? (
            <>
              <button 
                onClick={runMatchAndFusePipeline}
                disabled={isSynthesizing}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm ${
                  isSynthesizing
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50 shadow-none'
                    : 'bg-[#00D9FF] text-black hover:brightness-110 shadow-[0_0_20px_rgba(0,217,255,0.3)]'
                }`}
              >
                <Brain size={18} weight={isSynthesizing ? "regular" : "duotone"} />
                {isSynthesizing ? 'Sintetizando...' : 'Detectar Agentes'}
              </button>
              <button 
                onClick={() => alert('Fusión Infinita: El motor ahora analizará las conexiones (Edges) de tu grafo para orquestar y evolucionar todos los agentes cohesivamente.')}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full transition-all font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                <Network size={18} weight="duotone" />
                Upgrade
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};"""

    text = text[:match.start()] + new_buttons + text[match.end():]
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Replaced buttons logic successfully")
else:
    print("Could not find the block to replace")

