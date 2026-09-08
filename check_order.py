import json

with open("apps/web-app/src/data/prompts_db.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Simulate the JS catMap building (insertion order)
cat_map = {}

# mockMultiPrompt is added first with unshift in JS code
mock = {"category": "Marketing > Flujos Completos"}
data_with_mock = [mock] + data

for p in data_with_mock:
    parts = (p.get("category", "General")).split(" > ")
    main = parts[0].strip()
    sub = parts[1].strip() if len(parts) > 1 else "General"
    if main not in cat_map:
        cat_map[main] = {}
    cat_map[main][sub] = cat_map[main].get(sub, 0) + 1

categories = list(cat_map.keys())
print(f"Total categories: {len(categories)}")
for i, cat in enumerate(categories):
    total = sum(cat_map[cat].values())
    print(f"  [{i}] {cat}: {total} prompts")

