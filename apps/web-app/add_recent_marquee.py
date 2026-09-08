import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Imports
code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';")
code = code.replace("CaretRight, CheckSquare, Square, X, Sparkle", "CaretRight, CheckSquare, Square, X, Sparkle, Clock")

# 2. recentPrompts Memo
recent_prompts_code = """
  const recentPrompts = useMemo(() => {
    if (!allPrompts.length || Object.keys(promptHistory).length === 0) return [];
    
    const historyEntries = Object.entries(promptHistory).map(([key, ts]) => ({ key, ts: new Date(ts).getTime() }));
    historyEntries.sort((a, b) => b.ts - a.ts);
    
    const recent: Prompt[] = [];
    for (const entry of historyEntries) {
      const p = allPrompts.find(p => makePromptKey(p) === entry.key);
      if (p && !recent.some(rp => rp.title === p.title)) {
        recent.push(p);
      }
      if (recent.length >= 10) break;
    }
    return recent;
  }, [allPrompts, promptHistory]);

  return (
"""
code = code.replace("  return (\n    <div className=\"flex h-screen", recent_prompts_code + "    <div className=\"flex h-screen")

# 3. HTML Injection
grid_old = """          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {categories.slice(0, 12).map((cat, idx) => renderCategoryCard(cat, idx))}
          </div>"""

grid_new = """          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {categories.slice(0, 12).map((cat, idx) => renderCategoryCard(cat, idx))}
          </div>

          {recentPrompts.length > 0 && (
            <div className="mb-10 mt-10 overflow-hidden relative w-full border-t border-b border-gray-800/50 py-8 bg-[#0a0c10]">
              <div className="flex items-center gap-2 mb-6 px-4">
                <Clock weight="fill" className="text-green-500" size={24} />
                <h3 className="text-xl font-bold text-gray-200 tracking-wide">Prompts Recién Abiertos</h3>
              </div>
              <style>{`
                @keyframes marquee-recent {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-marquee-recent {
                  animation: marquee-recent 30s linear infinite;
                  width: max-content;
                }
                .animate-marquee-recent:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="flex animate-marquee-recent gap-6 px-4">
                {recentPrompts.concat(recentPrompts).map((prompt, i) => {
                  const isInspected = inspectedPrompt === prompt;
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}
                      className={`w-[320px] h-40 rounded-2xl p-5 shrink-0 shadow-lg relative cursor-pointer transition-colors flex flex-col justify-between overflow-hidden group border ${isInspected ? 'active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-gray-500'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-100 line-clamp-1 flex-1 leading-snug">{prompt.title}</h4>
                          {prompt.upgradeExplanation && (
                            <span className="text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded-full flex-shrink-0">IA</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{prompt.content}</p>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-blue-500 tracking-widest mt-2 truncate">
                        {prompt.category?.split(' > ').pop() || 'Prompt'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}"""

code = code.replace(grid_old, grid_new)

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Recent Prompts Marquee successfully added!")

