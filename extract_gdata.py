import re

# Read current (with 68 nodes)
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    current_content = f.read()

# Read pristine (commit 6df010c)
with open('KnowledgeGraph3D_commit.tsx', 'r', encoding='utf-8') as f:
    pristine_content = f.read()

# Extract current gData
# It starts with 'export const gData:' and ends with '};' before 'export function KnowledgeGraph3D'
gdata_match = re.search(r'(export const gData[\s\S]*?\n};\n)\n*export function KnowledgeGraph3D', current_content)
if not gdata_match:
    print("Could not find gData in current file!")
    exit(1)

current_gdata = gdata_match.group(1)

# Find pristine gData
gdata_pristine_match = re.search(r'(export const gData[\s\S]*?\n};\n)\n*export function KnowledgeGraph3D', pristine_content)
if not gdata_pristine_match:
    print("Could not find gData in pristine file!")
    exit(1)

# Replace pristine gData with current gData
merged_content = pristine_content.replace(gdata_pristine_match.group(1), current_gdata)

with open('KnowledgeGraph3D_merged.tsx', 'w', encoding='utf-8') as f:
    f.write(merged_content)
print("Merged successfully!")
