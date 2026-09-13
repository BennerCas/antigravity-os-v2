import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the handleLaunchMission logic
old_logic = "const matched = currentMissions.find((m) => m.id === targetId || m.skills_trained?.includes(targetId));"
new_logic = "const cleanTargetId = targetId.includes('_mission_') ? targetId.substring(targetId.indexOf('_') + 1) : targetId;\n    const matched = currentMissions.find((m) => m.id === cleanTargetId || m.skills_trained?.includes(cleanTargetId));"

content = content.replace(old_logic, new_logic)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
