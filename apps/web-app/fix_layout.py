import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Remove the old tabs from the header area
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

                  </div>"""
code = code.replace(tabs_old, "")

# 2. Add the new full-width row under the 3 tools
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
                  </div>
                  
                  <div className="flex gap-2 mt-2 w-full">
                    <button 
                      onClick={() => setPanelTab('content')} 
                      className={`flex-1 text-sm font-bold px-4 py-2 rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${panelTab === 'content' ? 'bg-gray-800 text-white border-gray-500' : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200'}`}
                    >
                      💬 Original
                    </button>
                    <button 
                      onClick={handleTranslate} 
                      className={`flex-1 text-sm font-bold px-4 py-2 rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${panelTab === 'translation' ? 'bg-green-900/40 text-green-300 border-green-700/50' : 'bg-transparent text-green-500/70 border-green-900/50 hover:text-green-400 hover:border-green-700'}`}
                    >
                      🇪🇸 Traducir
                    </button>
                  </div>"""

code = code.replace(tools_old, tools_new)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Layout adjustments applied!")

