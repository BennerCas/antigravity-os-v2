import json
import os
from fastapi import APIRouter, HTTPException
from collections import defaultdict
from pydantic import BaseModel
from typing import Optional, List, Any

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

@router.get("/list")
def list_prompts(limit: int = 500, offset: int = 0, search: str = "", category: str = ""):
    """Devuelve una lista paginada de prompts para el panel lateral del Builder."""
    data = load_db()
    if search:
        data = [p for p in data if search.lower() in (p.get("title", "") + " " + p.get("content", "")).lower()]
    if category:
        data = [p for p in data if (p.get("category", "") or "").startswith(category)]
    return data[offset: offset + limit]

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

class SavePromptRequest(BaseModel):
    title: str
    content: str
    category: Optional[str] = "Antigravity OS > Master Prompts"
    id: Optional[str] = None
    upgradeExplanation: Optional[str] = None
    isMultiPrompt: Optional[bool] = False
    chain: Optional[List[Any]] = None

@router.post("/save")
def save_prompt(prompt_data: SavePromptRequest):
    new_item = prompt_data.dict(exclude_none=True)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    target_files = [
        DB_PATH,
        os.path.join(base_dir, "apps", "web-app", "public", "prompts_db.json"),
        os.path.join(base_dir, "data", "prompts_db.json")
    ]
    saved_paths = []
    for path in target_files:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, list):
                    data = [item for item in data if not (isinstance(item, dict) and item.get("title") == new_item.get("title") and item.get("content") == new_item.get("content"))]
                    data.insert(0, new_item)
                    with open(path, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                    saved_paths.append(path)
            except Exception as e:
                print(f"Error saving prompt to {path}: {e}")
    return {"status": "ok", "saved_to": saved_paths, "prompt": new_item}
