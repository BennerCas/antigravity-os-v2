import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_div = """                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' && (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  )}
                  {panelTab === 'translation' && (
                    <ReactMarkdown>{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Conectando y traduciendo...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                  {panelTab === 'logic' && (
                    <ReactMarkdown>{logicData[makePromptKey(inspectedPrompt)] || (isGeneratingLogic ? '🧠 Conectando y generando análisis...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>"""

new_div = """                <div className={`bg-gray-900/80 p-6 rounded-xl border border-gray-800 leading-relaxed prose prose-invert max-w-none shadow-inner ${
                  panelTab === 'logic' 
                    ? 'text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400' 
                    : 'prose-p:text-[#4ade80] prose-p:text-[1.15rem] prose-p:font-bold prose-p:leading-snug prose-headings:text-[#4ade80] prose-headings:text-[1.15rem] prose-headings:font-bold prose-strong:text-[#4ade80] text-[#4ade80]'
                }`}>
                  {panelTab === 'content' && (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  )}
                  {panelTab === 'translation' && (
                    <ReactMarkdown>{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Conectando y traduciendo...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                  {panelTab === 'logic' && (
                    <ReactMarkdown>{logicData[makePromptKey(inspectedPrompt)] || (isGeneratingLogic ? '🧠 Conectando y generando análisis...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>"""

code = code.replace(old_div, new_div)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Style updated!")

