import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Parse all nodes to find sub-nodes per parent
node_block_match = re.search(r'nodes:\s*\[(.*?)\]\s*,\s*links:', content, re.DOTALL)
node_block = node_block_match.group(1)

sub_nodes = re.findall(r'\"id\":\s*\"([^\"]+)\"[^}]+\"isSub\":\s*true', node_block)

subs_by_parent = {}
for sub in sub_nodes:
    parent = sub.split('_')[0]
    if parent not in subs_by_parent:
        subs_by_parent[parent] = []
    subs_by_parent[parent].append(sub)

new_links = []
for parent, subs in subs_by_parent.items():
    # Sort them so c01 -> c02 -> c03 -> c04 -> mission
    subs.sort()
    # Create a ring
    for i in range(len(subs)):
        source = subs[i]
        target = subs[(i + 1) % len(subs)]
        new_links.append(f'    {{"source": "{source}", "target": "{target}"}}')

# Insert the new links into the links array
links_close = content.rfind('  links: [')
if links_close == -1:
    print("Could not find links array")
    exit(1)

# Find where the links array ends
end_of_links = content.find(']', links_close)

# We want to insert just before the closing ']'
# Let's find the last link in the array to append a comma if needed, or just insert
insertion_point = content.rfind('}', links_close, end_of_links) + 1

new_links_str = ',\n' + ',\n'.join(new_links)

new_content = content[:insertion_point] + new_links_str + content[insertion_point:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Added {len(new_links)} new sub-to-sub links.")
