with open("backend/services/agent_factory.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("timeout=3.0", "timeout=30.0")

with open("backend/services/agent_factory.py", "w", encoding="utf-8") as f:
    f.write(content)
