import os
from typing import Optional
DEFAULT_LOCAL_MODEL = os.getenv("OLLAMA_MODEL", "hermes3:unlocked")
HF_HERMES_Q8_MODEL = "hf.co/mlabonne/Hermes-3-Llama-3.1-8B-lorablated-GGUF:Q8_0"
LEGACY_LOCAL_DEFAULTS = {"hermes3:8b", "hermes3:latest"}
DEFAULT_CLOUD_MODEL = os.getenv("FREE_AI_DEFAULT_MODEL", "anthropic/claude-3.5-sonnet")
FREE_AI_FALLBACK_MODEL = os.getenv("FREE_AI_FALLBACK_MODEL", "qwen7b")
LOCAL_MODEL_OPTIONS = [DEFAULT_LOCAL_MODEL, HF_HERMES_Q8_MODEL, "hermes3:8b", "llama3.1:8b", "mistral", "qwen2.5:7b", "phi3:3.8b", "qwen2.5:3b", "qwen2.5:1.5b"]
def strip_model_provider(model: Optional[str]) -> str:
    if not model: return ""
    clean = str(model).strip()
    if clean.startswith("ollama/"): return clean[len("ollama/"):]
    if clean.startswith("free.ai/"): return clean[len("free.ai/"):]
    return clean
def prefers_local_default(model: Optional[str]) -> bool:
    clean = strip_model_provider(model)
    return not clean or clean == "auto" or clean in LEGACY_LOCAL_DEFAULTS
def normalize_local_model(model: Optional[str]) -> str:
    clean = strip_model_provider(model)
    if not clean or clean == "auto" or clean in LEGACY_LOCAL_DEFAULTS: return DEFAULT_LOCAL_MODEL
    return clean
def is_local_model(model: Optional[str]) -> bool:
    clean = strip_model_provider(model)
    return bool(clean) and (clean in LOCAL_MODEL_OPTIONS or clean.startswith("hf.co/") or ":" in clean)
def normalize_ollama_base_url(url: Optional[str]) -> str:
    base = (url or "http://127.0.0.1:11434").rstrip("/")
    if not base.endswith("/v1"): base += "/v1"
    return base
