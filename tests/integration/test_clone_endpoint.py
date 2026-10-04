from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_clone_endpoint():
    payload = {"name": "TestCharacter", "attributes": {"strength": 10}}
    response = client.post("/api/v1/clone", json=payload)
    assert response.status_code == 200
    assert response.json() == payload
