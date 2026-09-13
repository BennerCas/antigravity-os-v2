content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx','r',encoding='utf-8').read()
# show lines around graphData call
idx = content.find('.graphData(initialGraphData)')
lines = content[:idx].split('\n')
start_line = max(0, len(lines)-10)
chunk = '\n'.join(content.split('\n')[start_line:start_line+20])
print(chunk.encode('ascii','replace').decode())
