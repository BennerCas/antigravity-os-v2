import json
import os
from fastapi import APIRouter, HTTPException
from collections import defaultdict

router = APIRouter(tags=["Prompts Drill-Down"])

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts_db.json")

def load_db():
    if not os.path.exists(DB_PATH):
        return []
    try:
        with open(DB_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict):
                flattened = []
                for cat, prompts in data.items():
                    if isinstance(prompts, list):
                        for p in prompts:
                            if isinstance(p, dict):
                                p["category"] = cat
                                flattened.append(p)
                            else:
                                flattened.append({"category": cat, "content": p})
                return flattened
            return data
    except Exception as e:
        print(f"Error loading {DB_PATH}: {e}")
        return []

@router.get("/categories")
def get_categories():
    data = load_db()
    
    category_counts = defaultdict(int)
    for item in data:
        cat = item.get("category", "Uncategorized")
        category_counts[cat] += 1
        
    result = []
    for cat, count in category_counts.items():
        result.append({
            "category": cat,
            "count": count,
            "objective": f"Colección de prompts para dominar el área de {cat}"
        })
        
    return result

@router.get("/prompts/{category}")
def get_prompts_by_category(category: str):
    data = load_db()
    
    filtered_prompts = []
    for item in data:
        cat = item.get("category", "Uncategorized")
        if cat.lower() == category.lower():
            # Enrich with objective
            enriched_item = dict(item)
            enriched_item["objective"] = f"Este prompt ayuda a resolver problemas de {category}"
            filtered_prompts.append(enriched_item)
            
    return filtered_prompts
