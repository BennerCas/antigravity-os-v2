with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We remove the button block
pattern = r"<\s*button\s+onClick=\{activateAmdGpu\}[^>]*>[\s\S]*?<\s*/\s*button\s*>"
content = re.sub(pattern, "", content)

# We can also remove the `activateAmdGpu` function and `gpuActive` state
state_pattern = r"const \[gpuActive, setGpuActive\] = useState\(false\);\n?"
content = re.sub(state_pattern, "", content)

func_pattern = r"const activateAmdGpu = async \(\) => \{[\s\S]*?setGpuActive\(true\);\s*\} catch \(err\) \{[\s\S]*?console\.error\('Error activating AMD GPU:', err\);\s*\}\s*\};\n?"
content = re.sub(func_pattern, "", content)

with open('apps/web-app/src/pages/AgentOSStudio.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Brain icon and functions removed from React!")
