import sys
import os
import pytest
import asyncio
# Ensure project root is on PYTHONPATH
sys.path.append(os.path.abspath("."))

from backend.services.character_clone_runtime import clone_complete

def test_clone_complete_returns_input():
    data = {"key": "value", "number": 123}
    result = asyncio.run(clone_complete(data))
    assert result == data
