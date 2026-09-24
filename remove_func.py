with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove activateAmdGpu block correctly
pattern = r"const activateAmdGpu = async \(\) => \{[\s\S]*?catch\(e\) \{[\s\S]*?alert\('Failed to connect to backend'\);\s*\}\s*\};"
content = re.sub(pattern, "", content)

with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Function strictly removed!")
