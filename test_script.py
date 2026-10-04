import requests
import json

response = requests.post(
    "http://localhost:8001/api/v1/studio/state/transition",
    json={"phase": "phase3_blueprint", "data": "Quiero un sistema para gestionar ventas de boletos con IA."}
)
with open("test_output.json", "w", encoding="utf-8") as f:
    f.write(json.dumps(response.json(), indent=2, ensure_ascii=False))
print("Test completed. Data written to test_output.json")
