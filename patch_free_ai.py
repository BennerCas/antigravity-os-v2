import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\builder_actions.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Fix the bug
content = content.replace(
    'available = [m["id"] for m in resp.json().get("data", [])]',
    'available = [m["id"] for m in resp.json().get("models", resp.json().get("data", []))]'
)

# Also ensure FREE_AI_BASE is correct if we want to fallback gracefully
# Actually, the fix above will correctly populate available models.

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("builder_actions.py fixed.")
