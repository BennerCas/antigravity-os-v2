import re
with open('backend/routers/agents_factory.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'atlas_knowledge = \"\n+\s*---\n+\"\.join\(chunks\)', 'atlas_knowledge = \"\\\\n---\\\\n\".join(chunks)', text)

with open('backend/routers/agents_factory.py', 'w', encoding='utf-8') as f:
    f.write(text)
