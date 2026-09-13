import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('activeTab === \'info\' && selectedNode && (')
if idx != -1:
    end_idx = content.find('activeTab === \'competencias\' && (', idx)
    print(content[idx:end_idx])
else:
    print("Not found")
