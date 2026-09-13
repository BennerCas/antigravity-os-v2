content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8').read()
idx = content.find('const SPHERE_R = 300;')
chunk = content[idx:idx+500].encode('ascii', 'replace').decode()
print(chunk)
