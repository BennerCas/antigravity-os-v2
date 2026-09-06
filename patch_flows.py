import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Flows.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Update navigate parameters
old_nav = "navigate('/builder', { state: { masterPrompt: tpl.masterPrompt } })"
new_nav = "navigate('/builder', { state: { templateFlow: tpl.builderData } })"

content = content.replace(old_nav, new_nav)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Updated Flows.tsx")
