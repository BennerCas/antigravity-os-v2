import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
matches = re.findall(r'className={lex-1[^]+?}', content)
print(f"Found {len(matches)} matches")
for m in matches:
    print(m)
