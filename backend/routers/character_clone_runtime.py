import asyncio
from fastapi import APIRouter, Body
from backend.services.character_clone_runtime import clone_complete

router = APIRouter()

@router.post("/clone")
async def clone_endpoint(payload: dict = Body(...)):
    """FastAPI endpoint that wraps the `clone_complete` service.

    It receives a JSON payload, forwards it to the async service function, and
    returns the resulting dictionary. The service currently echoes the payload
    after a short sleep, but this endpoint provides the HTTP contract required
    by the OpenAPI spec.
    """
    result = await clone_complete(payload)
    return result
