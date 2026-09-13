import re

# 1. Update index.css to add .blue-pill-tab
with open('apps/web-app/src/index.css', 'r', encoding='utf-8') as f:
    css = f.read()

blue_tab_css = '''
/* =====================================================
   BLUE PILL TABS
   ===================================================== */
button.blue-pill-tab-active {
  background-color: #2563eb !important;
  color: #ffffff !important;
  border: none !important;
  outline: none !important;
  border-radius: 9999px !important;
}

button.blue-pill-tab-inactive {
  background-color: transparent !important;
  color: #6b7280 !important;
  border: none !important;
  outline: none !important;
  border-radius: 9999px !important;
}

button.blue-pill-tab-inactive:hover {
  color: #d1d5db !important;
  background-color: rgba(31, 41, 55, 0.5) !important;
}

span.green-text-active {
  color: #22c55e !important;
  font-weight: bold !important;
  border-bottom: 2px solid #22c55e !important;
}
'''
if 'BLUE PILL TABS' not in css:
    css += '\n' + blue_tab_css
    with open('apps/web-app/src/index.css', 'w', encoding='utf-8') as f:
        f.write(css)

# 2. Update KnowledgeGraph3D.tsx to use these classes
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    tsx = f.read()

# Replace top tabs
tsx = re.sub(r'className={activeTopFilter === \'Habilidades\' \? "[^"]+" : "[^"]+"}',
             r'className={activeTopFilter === \'Habilidades\' ? "green-text-active pb-1 cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}', tsx)

tsx = re.sub(r'className={activeTopFilter === \'Competencias\' \? "[^"]+" : "[^"]+"}',
             r'className={activeTopFilter === \'Competencias\' ? "green-text-active pb-1 cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}', tsx)

tsx = re.sub(r'className={activeTopFilter === \'Relaciones\' \? "[^"]+" : "[^"]+"}',
             r'className={activeTopFilter === \'Relaciones\' ? "green-text-active pb-1 cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}', tsx)

tsx = re.sub(r'className={activeTopFilter === \'Progreso\' \? "[^"]+" : "[^"]+"}',
             r'className={activeTopFilter === \'Progreso\' ? "green-text-active pb-1 cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}', tsx)

tsx = re.sub(r'className={activeTopFilter === \'Aprendizaje\' \? "[^"]+" : "[^"]+"}',
             r'className={activeTopFilter === \'Aprendizaje\' ? "green-text-active pb-1 cursor-pointer transition-colors" : "text-gray-500 hover:text-gray-300 cursor-pointer transition-colors pb-1"}', tsx)


# Replace sidebar tabs
tsx = re.sub(r'className={lex-1 py-1\.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none \$\{[^}]+\}\}',
             r'className={lex-1 py-1.5 px-1 text-center transition-all duration-200 }', tsx, count=1)

tsx = re.sub(r'className={lex-1 py-1\.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none \$\{[^}]+\}\}',
             r'className={lex-1 py-1.5 px-1 text-center transition-all duration-200 }', tsx, count=1)

tsx = re.sub(r'className={lex-1 py-1\.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none \$\{[^}]+\}\}',
             r'className={lex-1 py-1.5 px-1 text-center transition-all duration-200 }', tsx, count=1)

tsx = re.sub(r'className={lex-1 py-1\.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none \$\{[^}]+\}\}',
             r'className={lex-1 py-1.5 px-1 text-center transition-all duration-200 }', tsx, count=1)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx)

print("Done patching tsx")
