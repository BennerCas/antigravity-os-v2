import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://127.0.0.1:8000/ws/execute"
    try:
        async with websockets.connect(uri) as websocket:
            await websocket.send(json.dumps({"command": "run"}))
            while True:
                response = await websocket.recv()
                print(f"<- {response}")
                if "[DONE]" in response or "[HEALING-FAILED]" in response or "[SYSTEM-ERROR]" in response:
                    break
    except Exception as e:
        print(f"Connection failed: {e}")

asyncio.run(test_ws())
