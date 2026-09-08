import json
with open("apps/web-app/dist/prompts_db.json", "r", encoding="utf-8") as f:
    data = json.load(f)
found = [p for p in data if p.get("category","").startswith("Antigravity OS")]
print("Found in dist prompts_db.json:", len(found))
for p in found:
    print("  -", p.get("title"), "|", p.get("category"))

