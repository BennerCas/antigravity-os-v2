import re

with open("src/pages/Agents.tsx", "r", encoding="utf-8") as f:
    agents_code = f.read()

methods_match = re.search(r"(  const handleTTS = .*?)  const handleImprove =", agents_code, re.DOTALL)
if methods_match:
    methods_code = methods_match.group(1)
    
    # Adapt to prompt
    methods_code = methods_code.replace("inspectedAgent", "inspectedPrompt")
    methods_code = methods_code.replace("setInspectedAgent", "setInspectedPrompt")
    methods_code = methods_code.replace("Agent", "Prompt")
    methods_code = methods_code.replace("newAgent", "newPrompt")
    methods_code = methods_code.replace("upgraded_agents", "upgraded_prompts")
    methods_code = methods_code.replace("setAgents(prev", "setPrompts(prev")
    
    with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
        atlas_code = f.read()
    
    atlas_code = atlas_code.replace("  const handleSuggestFlows =", methods_code + "\n  const handleSuggestFlows =")
    
    with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
        f.write(atlas_code)
    print("Methods injected successfully.")
else:
    print("Could not find methods in Agents.tsx")
