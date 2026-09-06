import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\components\builder\PropertiesPanel.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

target = """placeholder="{`
  "key": "value"
`}\""""

replacement = """placeholder='{\n  "key": "value"\n}'"""

content = content.replace(target, replacement)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Fixed placeholder")
