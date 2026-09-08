import json

with open("apps/web-app/src/data/prompts_db.json", "r", encoding="utf-8") as f:
    data = json.load(f)

cats = set()
for p in data:
    if "category" in p:
        main = p["category"].split(" > ")[0]
        cats.add(main)

print("Main categories count:", len(cats))
print("Main categories:", sorted(list(cats)))

