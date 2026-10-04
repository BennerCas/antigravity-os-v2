# Character Clone Runtime Service

The **`character_clone_runtime`** service provides an asynchronous endpoint to handle character cloning operations.

## Overview
- Exposes the `clone_complete` coroutine which accepts a JSON payload representing character data.
- Logs the incoming request, simulates processing with an async sleep, broadcasts the result via the internal `manager` and returns the original payload.
- Designed to be lightweight and easily extendable for further avatar generation logic.

## Usage Example
```python
import httpx
import asyncio

async def call_clone():
    payload = {"name": "Alice", "attributes": {"strength": 10, "intelligence": 8}}
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://localhost:8000/clone", json=payload)
        print(resp.json())

asyncio.run(call_clone())
```

## Integration
- The service imports `manager` from `backend.services.manager` to broadcast updates to connected clients.
- Add this service to your FastAPI app by including the router:
```python
from backend.services.character_clone_runtime import router as clone_router
app.include_router(clone_router, prefix="/clone")
```

## Documentation
- See the full API spec in `docs/api/character_clone_runtime.yaml` (to be added).
- For further details, refer to the project’s architecture guidelines in `ESTRUCTURA.md`.
