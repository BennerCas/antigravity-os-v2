import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Fix setPromptes
code = code.replace("setPromptes(", "setPrompts(")
# Fix instructions
code = code.replace("inspectedPrompt.instructions || ", "")
code = code.replace("prompt.instructions || ", "")

# Fix duplicated states (isSuggesting etc)
# Let's just find the block of states and deduplicate
states_to_remove = [
    "const [isSuggesting, setIsSuggesting] = useState(false);",
    "const [enhancedQuery, setEnhancedQuery] = useState<string | null>(null);",
    "const [recommendedFlow, setRecommendedFlow] = useState<SuggestedFlow | null>(null);",
    "const [flowAlternatives, setFlowAlternatives] = useState<FlowAlternative[]>([]);",
    "const [suggestError, setSuggestError] = useState<string | null>(null);"
]
for state in states_to_remove:
    # replace all occurrences but keep the first one
    parts = code.split(state)
    if len(parts) > 2:
        code = parts[0] + state + ("".join(parts[1:]))

# Fix duplicated handleSuggestFlows, launchFlowInBuilder, saveFlowToNexus
def deduplicate_function(code, func_name):
    # Find all occurrences of "const func_name ="
    matches = [m.start() for m in re.finditer(f"const {func_name} =", code)]
    if len(matches) > 1:
        # Keep the first, remove the second block
        # Actually, it's easier to just regex out the duplicated block.
        # But wait, Agents.tsx has these methods for Agent, Atlas has them for Prompt.
        # Which one is correct for Atlas? The original Atlas one.
        pass
    return code

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)
