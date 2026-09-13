import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the text of the second tab in the custom tab bar
# We look for the exact button
target = "                  Competencias\n                </button>\n                <button \n                  type=\"button\"\n                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}"
replacement = "                  Habilidades\n                </button>\n                <button \n                  type=\"button\"\n                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}"

if target in content:
    content = content.replace(target, replacement)
    print("Replaced Competencias with Habilidades successfully.")
else:
    print("Could not find the target string to replace!")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
