import re

with open('C:\\antigravityAS\\Antigravity_OS_v2\\apps\\web-app\\src\\pages\\AgentOSStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';",
    "import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Panel } from '@xyflow/react';"
)

with open('C:\\antigravityAS\\Antigravity_OS_v2\\apps\\web-app\\src\\pages\\AgentOSStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Panel import successfully!")
