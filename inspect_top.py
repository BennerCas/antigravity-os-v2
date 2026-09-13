import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('<div className="absolute top-0 left-0 right-[340px]')
if idx != -1:
    end_idx = content.find(' {/* The 3D Graph Canvas */}', idx)
    print(content[idx:end_idx])
else:
    print("Not found")
