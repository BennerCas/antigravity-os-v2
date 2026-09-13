import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\/\* Custom Tab Bar \*\/\}.*?(?=\<\/div\>\s*\<\/div\>\s*\{\/\* TAB 1: Detalles \(Info\) \*\/\})', re.DOTALL)

# Safely construct the string in Python without PS variable expansion
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

# We have to fix PowerShell interpolation by unescaping what we need
# Wait, let's just write it directly to a file using python to avoid powershell parsing issues
