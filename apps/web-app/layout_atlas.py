import re

with open("src/pages/Agents.tsx", "r", encoding="utf-8") as f:
    agents_code = f.read()

panel_match = re.search(r"(      \{/\* Right Column: AI & Inspected Agent \*/\}.*)(\s*</div>\s*\);\s*};\s*export default)", agents_code, re.DOTALL)
if panel_match:
    panel_code = panel_match.group(1)
    
    panel_code = panel_code.replace("inspectedAgent", "inspectedPrompt")
    panel_code = panel_code.replace("setInspectedAgent", "setInspectedPrompt")
    panel_code = panel_code.replace("handleSetAgent(e as any, inspectedPrompt)", "handleSetPrompt(e as any, inspectedPrompt)")
    panel_code = panel_code.replace("Agente", "Prompt")
    panel_code = panel_code.replace("agente", "prompt")
    
    with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
        atlas_code = f.read()
    
    atlas_code = atlas_code.replace('<div className="min-h-screen bg-[#0a0c10] text-gray-200 p-8 font-sans">', '<div className="flex h-screen bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">\n      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">')
    
    atlas_code = re.sub(r"(\s*</div>\s*\);\s*};\s*export default)", r"\n      </div>\n" + panel_code.replace("\\", "\\\\") + r"\1", atlas_code)
    
    atlas_code = atlas_code.replace(
        "const inChain = isInChain(prompt);",
        "const inChain = isInChain(prompt);\n              const isInspected = inspectedPrompt && makePromptKey(inspectedPrompt) === key;"
    )
    atlas_code = atlas_code.replace(
        "className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}",
        "className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : isInspected ? 'active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}"
    )
    
    atlas_code = atlas_code.replace(
        "onClick={(e) => handleSetPrompt(e, prompt)}",
        "onClick={(e) => { e.stopPropagation(); setInspectedPrompt(prompt); }}"
    )
    
    with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
        f.write(atlas_code)
    print("Layout injected successfully.")
else:
    print("Could not find panel in Agents.tsx")
