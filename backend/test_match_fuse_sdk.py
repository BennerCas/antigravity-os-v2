import asyncio, json, sys
sys.path.insert(0, '..')

from backend.services.match_fuse_pipeline import run_match_fuse

async def test():
    print("=== TEST PIPELINE MATCH & FUSE SDK COMPLETO ===")
    print("Prompt: flujo para automatizar creacion de contenido para linkedin")
    print("Model: hermes3:8b")
    print("=" * 50)
    
    result = await run_match_fuse(
        'flujo para automatizar creacion de contenido para linkedin',
        model_name='hermes3:8b'
    )
    
    print("\n=== RAW RESULTADO (primeros 800 chars) ===")
    print(result[:800])
    
    try:
        parsed = json.loads(result)
        print(f"\n=== AGENTES GENERADOS: {len(parsed)} ===")
        for a in parsed:
            name = a.get("name", "?")
            status = a.get("evalStatus", "?")
            novelty = a.get("noveltyScore", "?")
            health = a.get("health", "?")
            role = a.get("role", "?")
            print(f"  [{status}] {name}")
            print(f"     role={role} | novelty={novelty} | health={health}")
    except Exception as e:
        print(f"\nNo se pudo parsear como JSON: {e}")

asyncio.run(test())
