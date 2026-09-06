import codecs
import re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\components\BuilderNodes.tsx'

with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

if 'NodeResizer' not in content:
    content = content.replace("useReactFlow } from '@xyflow/react';", "useReactFlow, NodeResizer } from '@xyflow/react';")

def patch_node(node_name, min_w, min_h):
    global content
    
    replace_def = 'export const ' + node_name + ' = ({ id, data, selected }: any) => {'
    search_def = r'export const ' + node_name + r' = \(\{ id, data \}: any\) => \{'
    content = re.sub(search_def, replace_def, content)

    if node_name == 'PostItNode':
        content = re.sub(r'w-64', f'w-full h-full min-w-[{min_w}px] min-h-[{min_h}px]', content)
    elif node_name == 'LogicaNode':
        content = re.sub(r'w-80', f'w-full h-full min-w-[{min_w}px] min-h-[{min_h}px]', content)
    else:
        content = re.sub(r'w-72', f'w-full h-full min-w-[{min_w}px] min-h-[{min_h}px]', content)
        
    node_body_pattern = r'(export const ' + node_name + r'.*?return \(\s*<div[^>]*>)'
    def replacer(m):
        if 'NodeResizer' in m.group(1):
            return m.group(1)
        return m.group(1) + f'\n      <NodeResizer color="var(--theme-border, #3b82f6)" isVisible={{!!selected}} minWidth={{{min_w}}} minHeight={{{min_h}}} />'
        
    content = re.sub(node_body_pattern, replacer, content, flags=re.DOTALL)

patch_node('MainPromptNode', 288, 200)
patch_node('ActionNode', 288, 150)
patch_node('LogicaNode', 320, 150)
patch_node('TraducirNode', 288, 220)
patch_node('EditarNode', 288, 250)
patch_node('PostItNode', 256, 200)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print('Patched BuilderNodes.tsx')
