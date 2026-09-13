import re

with open('apps/web-app/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

if '<meta http-equiv="Cache-Control"' not in content:
    meta_tags = '''<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">'''
    content = content.replace('</title>', '</title>\n    ' + meta_tags)
    with open('apps/web-app/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added no-cache headers to index.html")
else:
    print("Headers already present")
