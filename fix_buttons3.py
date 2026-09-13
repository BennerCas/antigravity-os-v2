import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    full_str = match.group(0)
    bt = chr(96)
    dollar = chr(36)
    if "'info'" in full_str:
        return 'className={' + bt + 'flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ' + dollar + '{activeTab === \\'info\\' ? \\'blue-pill-tab-active\\' : \\'blue-pill-tab-inactive\\'}' + bt + '}'
    if "'competencias'" in full_str:
        return 'className={' + bt + 'flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ' + dollar + '{activeTab === \\'competencias\\' ? \\'blue-pill-tab-active\\' : \\'blue-pill-tab-inactive\\'}' + bt + '}'
    if "'sistema'" in full_str:
        return 'className={' + bt + 'flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ' + dollar + '{activeTab === \\'sistema\\' ? \\'blue-pill-tab-active\\' : \\'blue-pill-tab-inactive\\'}' + bt + '}'
    if "'progreso'" in full_str:
        return 'className={' + bt + 'flex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 ' + dollar + '{activeTab === \\'progreso\\' ? \\'blue-pill-tab-active\\' : \\'blue-pill-tab-inactive\\'}' + bt + '}'
    return full_str

content = re.sub(r'className=\{\s*' + chr(96) + r'flex-1[^}]+?bg-blue-600[^}]+?\}\s*' + chr(96) + r'\}', replacer, content, flags=re.DOTALL)

# And because my last attempt inserted \f which is form feed, I need to clean that up if it exists!
content = re.sub(r'className=\{\s*\x0clex-1[^}]*\}', '', content) # Just remove broken ones if I messed it up? 
# Wait, let's just restore from original if it's broken!

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced safely!")
