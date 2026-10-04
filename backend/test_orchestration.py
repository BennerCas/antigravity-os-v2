import asyncio
import json

import httpx
from security.sly_data_masking import (mask_sensitive_data,
                                       unmask_sensitive_data)


async def test_blackboard():
    print("\n--- TEST BLACKBOARD ---")
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                "http://127.0.0.1:8001/api/v1/orchestration/blackboard",
                json={"key": "test_agent_status", "value": "IDLE"},
            )
            print("POST Blackboard:", res.json())
            res = await client.get(
                "http://127.0.0.1:8001/api/v1/orchestration/blackboard"
            )
            print("GET Blackboard:", res.json())
        except Exception as e:
            print("API Error:", e)


async def test_supervisor():
    print("\n--- TEST SUPERVISOR ---")
    async with httpx.AsyncClient() as client:
        payload = {
            "task_description": "We need to fix a React UI issue",
            "agents": [
                {
                    "id": "a1",
                    "name": "DB Admin",
                    "description": "",
                    "capabilities": ["sql", "database"],
                },
                {
                    "id": "a2",
                    "name": "Frontend Dev",
                    "description": "",
                    "capabilities": ["react", "ui", "css"],
                },
            ],
        }
        try:
            res = await client.post(
                "http://127.0.0.1:8001/api/v1/orchestration/supervisor", json=payload
            )
            print("Supervisor Route Result:", json.dumps(res.json(), indent=2))
        except Exception as e:
            print("API Error:", e)


def test_sly_data_pipeline():
    print("\n--- TEST SLY-DATA MASKING ---")
    raw_text = "Connect to the database at 192.168.1.100 with password: 'SuperSecretPassword123' and api_key: 'sk-abcdef1234567890abcdef1234567890'."
    print("Raw text:", raw_text)

    masked_text, tokens = mask_sensitive_data(raw_text)
    print("Masked text:", masked_text)
    print("Tokens generated:", list(tokens.keys()))

    unmasked_text = unmask_sensitive_data(masked_text, tokens)
    print("Unmasked text match:", unmasked_text == raw_text)


if __name__ == "__main__":
    test_sly_data_pipeline()
    asyncio.run(test_blackboard())
    asyncio.run(test_supervisor())
