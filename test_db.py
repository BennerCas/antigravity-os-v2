import json
with open("apps/web-app/src/data/prompts_db.json", "r", encoding="utf-8") as f:
    data = json.load(f)
    print("Is dict:", isinstance(data, dict))
    print("Is list:", isinstance(data, list))
    if isinstance(data, list):
        categories = set(p.get("category", "") for p in data if isinstance(p, dict))
        print("Categories:", sorted(list(categories))[:10])

