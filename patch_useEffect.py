import codecs
import re

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Builder.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Update the useEffect that restores from local storage
old_cond = "if (!location.state?.prompt && !location.state?.promptChain && !location.state?.restoreCanvas) {"
new_cond = "if (!location.state?.prompt && !location.state?.promptChain && !location.state?.restoreCanvas && !location.state?.templateFlow) {"

content = content.replace(old_cond, new_cond)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed useEffect overwriting templateFlow")
