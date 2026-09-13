import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    tsx = f.read()

# Fix the escaped quotes
tsx = tsx.replace(r"activeTopFilter === \'Habilidades\'", "activeTopFilter === 'Habilidades'")
tsx = tsx.replace(r"activeTopFilter === \'Competencias\'", "activeTopFilter === 'Competencias'")
tsx = tsx.replace(r"activeTopFilter === \'Relaciones\'", "activeTopFilter === 'Relaciones'")
tsx = tsx.replace(r"activeTopFilter === \'Progreso\'", "activeTopFilter === 'Progreso'")
tsx = tsx.replace(r"activeTopFilter === \'Aprendizaje\'", "activeTopFilter === 'Aprendizaje'")

# Now fix the sidebar tabs properly!
target_info = """                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }"""
                  
repl_info = """                  className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }"""

target_comp = """                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }"""
                  
repl_comp = """                  className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }"""

target_sist = """                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }"""
                  
repl_sist = """                  className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }"""

target_prog = """                  className={lex-1 py-1.5 px-1 text-center rounded-full transition-all duration-200 border-none outline-none }"""
                  
repl_prog = """                  className={lex-1 py-1.5 px-1 text-center font-bold transition-all duration-200 }"""

tsx = tsx.replace(target_info, repl_info)
tsx = tsx.replace(target_comp, repl_comp)
tsx = tsx.replace(target_sist, repl_sist)
tsx = tsx.replace(target_prog, repl_prog)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx)

print("Fixed Syntax and Sidebar Tabs")
