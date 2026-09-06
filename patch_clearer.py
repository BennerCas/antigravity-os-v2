import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Builder.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_cond = "if (incomingPrompt || incomingChain) {"
new_cond = "if (incomingPrompt || incomingChain || templateFlow) {"

content = content.replace(old_cond, new_cond)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Added templateFlow to state clearer")
