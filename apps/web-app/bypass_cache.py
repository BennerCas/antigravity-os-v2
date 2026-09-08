import re

with open("src/pages/Atlas.tsx", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json');", "fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json?v=' + Date.now());")

with open("src/pages/Atlas.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Cache busting added!")

