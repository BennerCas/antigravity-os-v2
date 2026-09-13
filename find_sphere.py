content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()
idx = content.find('SPHERE_R')
print('SPHERE_R at:', idx)
if idx > 0:
    chunk = content[idx-200:idx+300]
    print(chunk.encode('ascii','replace').decode())
