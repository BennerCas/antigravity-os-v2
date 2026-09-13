import re

content = open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8').read()

# Main skill nodes (n1-n17, no isSub)
main = re.findall(r'\{\"id\":\s*\"(n\d+)\"', content)
print(f'Main skill nodes: {len(main)}', main)

# Sub nodes
sub = re.findall(r'\"id\":\s*\"([^\"]+)\"[^}]*\"isSub\":\s*true', content)
print(f'Sub nodes: {len(sub)}')
print('Sample subs:', sub[:5])

# Links
link_pairs = re.findall(r'\{\"source\":\s*\"([^\"]+)\",\s*\"target\":\s*\"([^\"]+)\"', content)
print(f'Total links: {len(link_pairs)}')
print('Sample links:', link_pairs[:5])
