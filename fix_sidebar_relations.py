import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: The 'Competencias' section logic
bad_logic = """                        {(() => {
                          const relatedNodes = selectedNode.isSub
                            ? gData.nodes.filter(n => !n.isSub && n.group === selectedNode.group)
                            : gData.nodes.filter(n => n.isSub && n.group === selectedNode.group);"""

good_logic = """                        {(() => {
                          const getParentId = (id: string) => id.split('_')[0];
                          const selectedParentId = getParentId(selectedNode.id);
                          const relatedNodes = selectedNode.isSub
                            ? gData.nodes.filter(n => !n.isSub && n.id === selectedParentId)
                            : gData.nodes.filter(n => n.isSub && getParentId(n.id) === selectedNode.id);"""

content = content.replace(bad_logic, good_logic)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
