import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\compiler.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
    'class Node(BaseModel):',
    'class Node(BaseModel):\n    class Config:\n        extra = "allow"'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("compiler.py extra=allow fixed.")
