"""Configuración central del backend Antigravity_OS v2.

Orden de carga:
1. backend/.env (local, propio de la app) — fuente principal
2. BennerAI/.env (legacy fallback) — compatibilidad durante la transición

Así la app funciona independiente y deja de depender de rutas ajenas.
"""
import os
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_ENV = os.path.join(BACKEND_DIR, ".env")
LEGACY_ENV = r"C:\antigravityAS\BennerAI\.env"

ENV_PATH = LOCAL_ENV if os.path.exists(LOCAL_ENV) else LEGACY_ENV
load_dotenv(ENV_PATH)

FREE_AI_API_KEY = os.getenv("FREE_AI_API_KEY", "")
FREE_AI_BASE_URL = os.getenv("FREE_AI_BASE_URL", "https://api.free.ai/v1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:8080/v1")

# Orígenes permitidos para CORS (frontend local v1 y v2)
CORS_ORIGINS = ["*"]
