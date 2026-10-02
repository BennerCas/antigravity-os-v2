with open('backend/services/agent_factory.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('\npayload = {', '\n            payload = {')

with open('backend/services/agent_factory.py', 'w', encoding='utf-8') as f:
    f.write(c)
