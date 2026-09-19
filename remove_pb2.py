import re

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("gap-4 pb-2 [&::-webkit", "gap-4 pb-1 [&::-webkit")

with open("apps/web-app/src/pages/AgentOSStudio.tsx", "w", encoding="utf-8") as f:
    f.write(text)
