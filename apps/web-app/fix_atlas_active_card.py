import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix marquee section
marquee_old = """                {recentPrompts.concat(recentPrompts).map((prompt, i) => {
                  const isInspected = inspectedPrompt === prompt;
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}
                      className={`w-[320px] h-40 rounded-2xl p-5 shrink-0 shadow-lg relative cursor-pointer transition-colors flex flex-col justify-between overflow-hidden group border ${isInspected ? 'active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-gray-500'}`}
                    >"""

marquee_new = """                {recentPrompts.concat(recentPrompts).map((prompt, i) => {
                  const isInspected = inspectedPrompt === prompt;
                  const isGenerated = !!prompt.upgradeExplanation || (prompt.id && prompt.id.endsWith('-upgraded'));
                  const activeClass = isGenerated ? 'active-card-blue' : 'active-card';
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}
                      className={`w-[320px] h-40 rounded-2xl p-5 shrink-0 shadow-lg relative cursor-pointer transition-colors flex flex-col justify-between overflow-hidden group border ${isInspected ? activeClass : 'bg-[#151515] border-[#2A2A2A] hover:border-gray-500'}`}
                    >"""
code = code.replace(marquee_old, marquee_new)

# Fix grid section
grid_old = """            {displayPrompts.map((prompt, idx) => {
              const key = makePromptKey(prompt);
              const lastOpened = promptHistory[key];
              const inChain = isInChain(prompt);
              const isInspected = inspectedPrompt === prompt;
              const chainPos = selectedForChain.findIndex(p => makePromptKey(p) === key);

              return (
                <div
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setInspectedPrompt(prompt); 
                    const key = makePromptKey(prompt);
                    const now = new Date().toISOString();
                    setPromptHistoryEntry(key, now);
                    setPromptHistory(prev => ({ ...prev, [key]: now }));
                  }}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : isInspected ? 'active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}
                >"""

grid_new = """            {displayPrompts.map((prompt, idx) => {
              const key = makePromptKey(prompt);
              const lastOpened = promptHistory[key];
              const inChain = isInChain(prompt);
              const isInspected = inspectedPrompt === prompt;
              const chainPos = selectedForChain.findIndex(p => makePromptKey(p) === key);
              const isGenerated = !!prompt.upgradeExplanation || (prompt.id && prompt.id.endsWith('-upgraded'));
              const activeClass = isGenerated ? 'active-card-blue' : 'active-card';

              return (
                <div
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setInspectedPrompt(prompt); 
                    const key = makePromptKey(prompt);
                    const now = new Date().toISOString();
                    setPromptHistoryEntry(key, now);
                    setPromptHistory(prev => ({ ...prev, [key]: now }));
                  }}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? (isGenerated ? 'border-blue-900 active-card-blue' : 'border-[#174A1F] active-card') : isInspected ? activeClass : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}
                >"""
code = code.replace(grid_old, grid_new)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Atlas component updated!")

