import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

old_div = """                <div className={`bg-gray-900/80 p-6 rounded-xl border border-gray-800 leading-relaxed prose prose-invert max-w-none shadow-inner ${
                  panelTab === 'logic' 
                    ? 'text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400' 
                    : 'prose-p:text-[#4ade80] prose-p:text-[1.15rem] prose-p:font-bold prose-p:leading-snug prose-headings:text-[#4ade80] prose-headings:text-[1.15rem] prose-headings:font-bold prose-strong:text-[#4ade80] text-[#4ade80]'
                }`}>"""

new_div = """                <div className={`bg-gray-900/80 p-6 rounded-xl border border-gray-800 leading-relaxed prose prose-invert max-w-none shadow-inner ${
                  panelTab === 'logic' 
                    ? 'text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400' 
                    : `${inspectedPrompt.upgradeExplanation ? 'prose-p:text-blue-400 prose-headings:text-blue-400 prose-strong:text-blue-400 text-blue-400' : 'prose-p:text-[#4ade80] prose-headings:text-[#4ade80] prose-strong:text-[#4ade80] text-[#4ade80]'} prose-p:text-[1.15rem] prose-p:font-bold prose-p:leading-snug prose-headings:text-[1.15rem] prose-headings:font-bold`
                }`}>"""

code = code.replace(old_div, new_div)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Conditional colors successfully applied!")

