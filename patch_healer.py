import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\services\healer.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
    'response = await call_ai(prompt)',
    'response, _ = await call_ai("You are an AI Auto-Healer.", prompt)'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("healer.py fixed.")
