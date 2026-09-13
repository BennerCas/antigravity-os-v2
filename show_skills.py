import re
content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()
# Get all gData node definitions with names
pattern = r'\{\"id\":\s*\"(n\d+)\",\s*\"name\":\s*\"([^\"]+)\"[^}]*\"color\":\s*\"([^\"]+)\"'
skills = re.findall(pattern, content)
for s in skills:
    print(s[0], '|', s[2], '|', s[1][:60])
