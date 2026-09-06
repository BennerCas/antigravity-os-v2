import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Flows.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

if 'GitBranch' not in content.split('\n')[1]:
    content = content.replace('Lightning } from', 'Lightning, GitBranch } from')

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Import added")
