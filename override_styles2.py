import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We can regex replace the button block in the sidebar
pattern = re.compile(r'\{\/\* Custom Tab Bar \*\/\}.*?(?=\<\/div\>\s*\<\/div\>\s*\{\/\* TAB 1: Detalles \(Info\) \*\/\})', re.DOTALL)

match = pattern.search(content)
if match:
    print("Found sidebar tabs with regex!")
    new_sidebar_tabs = '''{/* Custom Tab Bar */}
            <div className="flex items-center gap-1 bg-[#0d1117] p-2 text-[11px] font-medium border-none">
                <button 
                  type="button"
                  onClick={() => { setActiveTab('info'); setActiveTopFilter('Habilidades'); }}
                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Detalles
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('competencias'); setActiveTopFilter('Competencias'); }}
                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Competencias
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('sistema'); setActiveTopFilter('Aprendizaje'); }}
                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Sistema
                </button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('progreso'); setActiveTopFilter('Progreso'); }}
                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }
                >
                  Progreso
                </button>
            </div>'''
    content = content[:match.start()] + new_sidebar_tabs + content[match.end():]
    
    with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
else:
    print("Regex failed to find the block!")
