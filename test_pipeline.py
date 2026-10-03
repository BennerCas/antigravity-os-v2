import asyncio
from backend.services.freechat_pipeline import FreechatPipeline

async def run():
    pipeline = FreechatPipeline()
    try:
        async for chunk in pipeline.process_chat_stream([{"role": "user", "content": "Hola"}]):
            print(chunk)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(run())
