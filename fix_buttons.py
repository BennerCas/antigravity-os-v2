import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the info tab
content = re.sub(
    r'className={lex-1[^]+?activeTab === \'info\'[^]+?}',
    r'className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }',
    content
)

# Replace the competencias tab
content = re.sub(
    r'className={lex-1[^]+?activeTab === \'competencias\'[^]+?}',
    r'className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }',
    content
)

# Replace the sistema tab
content = re.sub(
    r'className={lex-1[^]+?activeTab === \'sistema\'[^]+?}',
    r'className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }',
    content
)

# Replace the progreso tab
content = re.sub(
    r'className={lex-1[^]+?activeTab === \'progreso\'[^]+?}',
    r'className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }',
    content
)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Buttons fixed with regex.")
