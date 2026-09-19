import asyncio
import os
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8")

from backend.services.match_fuse_pipeline import run_match_fuse

async def main():
    print("="*60)
    print("INICIANDO SIMULACION DE MATCH & FUSE v2")
    print("="*60)
    prompt = "Disena un agente especializado en auditoria de seguridad de contratos inteligentes y analisis de vulnerabilidades DeFi."
    
    # FORZAMOS MODO LOCAL CON qwen2.5:7b
    result = await run_match_fuse(prompt, "qwen2.5:7b")
    
    print("="*60)
    print("RESULTADO FINAL DEL PIPELINE (JSON AgentCards):")
    print(result)
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
