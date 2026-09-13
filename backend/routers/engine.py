import os
import json
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/engine", tags=["Engine"])

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CONFIG_FILE = os.path.join(DATA_DIR, "engine_config.json")

DEFAULT_CONFIG = {
    "hybrid_enabled": True,
    "cloud_model": "anthropic/claude-3.5-sonnet",
    "local_model": "hermes3:8b",
    "cloud_options": [
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o",
        "meta-llama/llama-3.1-70b-instruct",
        "qwen/qwen-2.5-72b-instruct"
    ],
    "local_options": [
        "hermes3:8b",
        "llama3.1:8b",
        "mistral",
        "qwen2.5:7b",
        "phi3:3.8b"
    ]
}

def get_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {**DEFAULT_CONFIG, **data}
    return DEFAULT_CONFIG

def save_config(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)

class EngineConfigUpdate(BaseModel):
    hybrid_enabled: bool = None
    cloud_model: str = None
    local_model: str = None

@router.get("/config")
def read_config():
    return get_config()

@router.post("/config")
def update_config(update: EngineConfigUpdate):
    cfg = get_config()
    if update.hybrid_enabled is not None:
        cfg["hybrid_enabled"] = update.hybrid_enabled
    if update.cloud_model is not None:
        cfg["cloud_model"] = update.cloud_model
    if update.local_model is not None:
        cfg["local_model"] = update.local_model
    save_config(cfg)
    return cfg
