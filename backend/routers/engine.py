import json
import os
import shutil
from urllib import request as urllib_request

from fastapi import APIRouter
from pydantic import BaseModel

from backend.config import OLLAMA_BASE_URL
from backend.model_defaults import (DEFAULT_CLOUD_MODEL, DEFAULT_LOCAL_MODEL,
                                    LOCAL_MODEL_OPTIONS)

router = APIRouter(prefix="/engine", tags=["Engine"])

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
CONFIG_FILE = os.path.join(DATA_DIR, "engine_config.json")

DEFAULT_CONFIG = {
    "hybrid_enabled": False,
    "cloud_model": DEFAULT_CLOUD_MODEL,
    "local_model": DEFAULT_LOCAL_MODEL,
    "cloud_options": [
        DEFAULT_CLOUD_MODEL,
        "openai/gpt-4o",
        "meta-llama/llama-3.1-70b-instruct",
        "qwen/qwen-2.5-72b-instruct",
    ],
    "local_options": LOCAL_MODEL_OPTIONS,
}


def get_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            cfg = {**DEFAULT_CONFIG, **data}
            if cfg.get("local_model") in {"hermes3:8b", "hermes3:latest"}:
                cfg["local_model"] = DEFAULT_LOCAL_MODEL
            cfg["local_options"] = list(
                dict.fromkeys(
                    [
                        cfg["local_model"],
                        *LOCAL_MODEL_OPTIONS,
                        *(cfg.get("local_options") or []),
                    ]
                )
            )
            return cfg
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


@router.get("/local-capabilities")
def read_local_capabilities():
    def _check_binary(name: str) -> bool:
        if shutil.which(name) is not None:
            return True
        local_app_data = os.getenv("LOCALAPPDATA", "")
        android_home = os.getenv("ANDROID_HOME") or os.getenv("ANDROID_SDK_ROOT") or ""
        candidates = {
            "ollama": [
                os.path.join(local_app_data, "Programs", "Ollama", "ollama.exe"),
            ],
            "adb": [
                os.path.join(android_home, "platform-tools", "adb.exe"),
            ],
            "emulator": [
                os.path.join(android_home, "emulator", "emulator.exe"),
            ],
            "ffmpeg": [],
        }
        return any(
            candidate and os.path.exists(candidate)
            for candidate in candidates.get(name, [])
        )

    ollama_reachable = False
    try:
        with urllib_request.urlopen(
            f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags", timeout=2
        ) as response:
            ollama_reachable = response.status == 200
    except Exception:
        ollama_reachable = False

    emulator_binary = _check_binary("emulator") or _check_binary("adb")

    return {
        "ollama": {
            "installed": _check_binary("ollama"),
            "reachable": ollama_reachable,
            "ready": ollama_reachable,
            "base_url": OLLAMA_BASE_URL,
        },
        "ffmpeg": {
            "installed": _check_binary("ffmpeg"),
            "ready": _check_binary("ffmpeg"),
        },
        "android": {
            "installed": emulator_binary,
            "ready": emulator_binary,
        },
        "status": "ok",
    }
