import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update states
code = code.replace(
    "const [panelTab, setPanelTab] = useState<'content' | 'instructions' | 'logic'>('content');",
    "const [panelTab, setPanelTab] = useState<'content' | 'translation' | 'logic'>('content');\n  const [translationData, setTranslationData] = useState<Record<string, string>>({});\n  const [isTranslatingContent, setIsTranslatingContent] = useState(false);"
)

# 2. Fix logicData usage
code = code.replace(
    "if (logicData[inspectedPrompt.id || '']) return;",
    "const key = makePromptKey(inspectedPrompt);\n    if (logicData[key]) return;"
)
code = code.replace(
    "setLogicData(prev => ({ ...prev, [inspectedPrompt.id || '']: data.response }));",
    "setLogicData(prev => ({ ...prev, [key]: data.response }));"
)
code = code.replace(
    "setLogicData(prev => ({ ...prev, [inspectedPrompt.id || '']: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));",
    "setLogicData(prev => ({ ...prev, [key]: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));"
)

# 3. Insert handleTranslate
handle_translate_func = """
  const handleTranslate = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('translation');
    if (translationData[key]) return;

    setIsTranslatingContent(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente prompt al español manteniendo exactamente el mismo formato, estructura, y variables (como [texto]). No agregues comentarios ni explicaciones adicionales, solo la traducción directa del texto.\\n\\nPrompt:\\n${inspectedPrompt.content}`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error al conectar con Ollama');
      const data = await res.json();
      setTranslationData(prev => ({ ...prev, [key]: data.response }));
    } catch (err) {
      console.error(err);
      setTranslationData(prev => ({ ...prev, [key]: 'Error al generar la traducción. Verifica la conexión con Ollama.' }));
    } finally {
      setIsTranslatingContent(false);
    }
  };
"""
code = code.replace("  const handleLogic = async () => {", handle_translate_func + "\n  const handleLogic = async () => {")

# 4. Fix handleTTS logic
code = code.replace(
    "const currentText = panelTab === 'content' \n      ? inspectedPrompt.content\n      : (logicData[inspectedPrompt.id || ''] || '');",
    "const key = makePromptKey(inspectedPrompt);\n    const currentText = panelTab === 'content'\n      ? inspectedPrompt.content\n      : panelTab === 'translation'\n      ? (translationData[key] || '')\n      : (logicData[key] || '');"
)

# 5. Fix UI render
ui_old = """                  {panelTab === 'content' ? (
                  <button 
                    onClick={handleLogic} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-blue-900/40 text-blue-300 border-blue-700/50 hover:bg-blue-800"
                  >
                    🧠 Lógica
                  </button>
                ) : (
                  <button 
                    onClick={() => setPanelTab('content')} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                  >
                    ⬅️ Volver
                  </button>
                )}
                </div>
                
                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' ? (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  ) : (
                    <ReactMarkdown>{logicData[inspectedPrompt.id || ''] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del prompt... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>"""

ui_new = """                  <div className="flex gap-2">
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
                  </div>
                </div>
                
                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' && (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  )}
                  {panelTab === 'translation' && (
                    <ReactMarkdown>{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Traduciendo el prompt al español de forma natural... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                  {panelTab === 'logic' && (
                    <ReactMarkdown>{logicData[makePromptKey(inspectedPrompt)] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del prompt... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>"""

code = code.replace(ui_old, ui_new)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Translation tab and Logic fixes applied successfully!")

