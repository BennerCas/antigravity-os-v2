import pytest
from backend.services.character_clone_runtime import clone_complete

@pytest.mark.asyncio
async def test_clone_complete_returns_input():
    data = {"key": "value", "number": 123}
    result = await clone_complete(data)
    assert result == data
