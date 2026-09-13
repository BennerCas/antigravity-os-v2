import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Top Tabs (Green Highlight)
# The current strings:
# "text-blue-500 font-bold cursor-pointer transition-colors"
content = content.replace(
    '"text-blue-500 font-bold cursor-pointer transition-colors"',
    '"text-green-500 font-bold cursor-pointer transition-colors border-b-2 border-green-500 pb-1"'
)

# Fix 2: Sidebar Tabs (No gray borders, blue highlight)
# The container is: <div className="flex bg-[#0d1117] text-xs font-medium">
# The buttons have: className={lex-1 py-2 text-center transition }
import textwrap

old_sidebar_tabs = '''            {/* Custom Tab Bar */}
            <div className="flex bg-[#0d1117] text-xs font-medium">
                <button 
                  type="button"
                  onClick={() => { setActiveTab('info'); setActiveTopFilter('Habilidades'); }}
                  className={lex-1 py-2 text-center transition }
                >
                  Detalles
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('competencias'); setActiveTopFilter('Competencias'); }}
                  className={lex-1 py-2 text-center transition }
                >
                  Competencias
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}
                  className={lex-1 py-2 text-center transition }
                >
                  Sistema
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                  className={lex-1 py-2 text-center transition }
                >
                  Progreso
                </button>
            </div>'''

new_sidebar_tabs = '''            {/* Custom Tab Bar */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-2 text-xs font-medium border-none">
                <button 
                  type="button"
                  onClick={() => { setActiveTab('info'); setActiveTopFilter('Habilidades'); }}
                  className={lex-1 py-1.5 px-2 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Detalles
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('competencias'); setActiveTopFilter('Competencias'); }}
                  className={lex-1 py-1.5 px-2 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Competencias
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}
                  className={lex-1 py-1.5 px-2 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Sistema
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                  className={lex-1 py-1.5 px-2 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Progreso
                </button>
            </div>'''

if old_sidebar_tabs in content:
    content = content.replace(old_sidebar_tabs, new_sidebar_tabs)
    print("Replaced sidebar tabs!")
else:
    print("Could not find sidebar tabs block!")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
