with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

links_idx = content.find('links: [')
if links_idx != -1:
    print(content[links_idx:links_idx+500])
    
    links_end = content.find('];', links_idx)
    if links_end == -1:
        links_end = content.find(']\n};', links_idx)
        
    print("\n--- END OF LINKS ---")
    print(content[links_end-500:links_end+50])
