import os
import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/v1/studio/registries", tags=["Registries"])

REGISTRY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "registries", "swarms")

os.makedirs(REGISTRY_DIR, exist_ok=True)

class SwarmModel(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

@router.get("/swarms", response_model=List[Dict[str, Any]])
async def list_swarms():
    swarms = []
    for filename in os.listdir(REGISTRY_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(REGISTRY_DIR, filename), "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    swarms.append(data)
                except Exception as e:
                    pass
    return swarms

@router.post("/swarms")
async def save_swarm(swarm: SwarmModel):
    filename = f"{swarm.id}.json"
    filepath = os.path.join(REGISTRY_DIR, filename)
    
    data = swarm.dict()
    data["created_at"] = datetime.utcnow().isoformat()
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        
    return {"status": "success", "message": f"Swarm {swarm.id} guardado correctamente."}

@router.delete("/swarms/{swarm_id}")
async def delete_swarm(swarm_id: str):
    filename = f"{swarm_id}.json"
    filepath = os.path.join(REGISTRY_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Swarm not found")

@router.get("/swarms/{swarm_id}", response_model=Dict[str, Any])
async def get_swarm(swarm_id: str):
    filename = f"{swarm_id}.json"
    filepath = os.path.join(REGISTRY_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Swarm not found")
