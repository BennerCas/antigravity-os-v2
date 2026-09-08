import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add Logic button to the top Tools section
tools_old = """                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⚡ Upgrade...' : '✨ Upgrade'}
                    </button>
                    <button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '🔊 Traduciendo...' : '🗣️ TTS'}
                    </button>
                  </div>"""

tools_new = """                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⚡ Upgrade...' : '✨ Upgrade'}
                    </button>
                    <button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '🔊 TTS...' : '🗣️ TTS'}
                    </button>
                    <button 
                      onClick={handleLogic}
                      disabled={isGeneratingLogic}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isGeneratingLogic ? '🧠 Analizando...' : '🧠 Lógica'}
                    </button>
                  </div>"""

code = code.replace(tools_old, tools_new)

# 2. Remove Lógica button from the tabs section
tabs_old = """                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPanelTab('content')} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 ${panelTab === 'content' ? 'bg-gray-800 text-white border-gray-500' : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200'}`}
                    >
                      💬 Original
                    </button>
                    <button 
                      onClick={handleTranslate} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 ${panelTab === 'translation' ? 'bg-green-900/40 text-green-300 border-green-700/50' : 'bg-transparent text-green-500/70 border-green-900/50 hover:text-green-400 hover:border-green-700'}`}
                    >
                      🇪🇸 Traducir
                    </button>
                    <button 
                      onClick={handleLogic} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 ${panelTab === 'logic' ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' : 'bg-transparent text-blue-500/70 border-blue-900/50 hover:text-blue-400 hover:border-blue-700'}`}
                    >
                      🧠 Lógica
                    </button>
                  </div>"""

tabs_new = """                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPanelTab('content')} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 ${panelTab === 'content' ? 'bg-gray-800 text-white border-gray-500' : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200'}`}
                    >
                      💬 Original
                    </button>
                    <button 
                      onClick={handleTranslate} 
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 ${panelTab === 'translation' ? 'bg-green-900/40 text-green-300 border-green-700/50' : 'bg-transparent text-green-500/70 border-green-900/50 hover:text-green-400 hover:border-green-700'}`}
                    >
                      🇪🇸 Traducir
                    </button>
                    {panelTab === 'logic' && (
                      <div className="text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 shadow-sm shrink-0 bg-blue-900/40 text-blue-300 border-blue-700/50">
                        🧠 Vista de Lógica
                      </div>
                    )}
                  </div>"""

code = code.replace(tabs_old, tabs_new)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Logic button successfully moved to Tools row!")

