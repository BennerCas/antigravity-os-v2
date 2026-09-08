import re
import os

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    atlas_code = f.read()

with open("src/pages/Agents.tsx", "r", encoding="utf-8") as f:
    agents_code = f.read()

# I will just write a new Atlas.tsx that copies Agents.tsx structure completely, 
# replacing Agent/agent with Prompt/prompt where appropriate, but keeping the correct paths 
# (e.g., promptHistory, handleSetPrompt logic, etc.)
print("Ready")
