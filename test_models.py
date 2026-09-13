import sys, os, asyncio, httpx
sys.path.append(r'C:\antigravityAS\Antigravity_OS_v2\backend')
from routers.builder_actions import FREE_AI_BASE, FREE_AI_KEY
async def run():
    print('KEY:', repr(FREE_AI_KEY))
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f'{FREE_AI_BASE}/models', headers={'Authorization': f'Bearer {FREE_AI_KEY}'})
            print(resp.status_code)
    except Exception as e:
        print('EXCEPTION:', type(e), str(e))
asyncio.run(run())
