import json
with open("apps/web-app/src/data/prompts_db.json", "r", encoding="utf-8") as f:
    data = json.load(f)
c = 0
for p in data:
    if "category" in p and p["category"].startswith("Antigravity OS"):
        print(p["title"])
        c += 1
print("Total in Antigravity OS:", c)

