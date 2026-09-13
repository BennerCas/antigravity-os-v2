with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad = '''                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>'''

good = '''                        <button 
                          onClick={() => handleBack()}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>'''

content = content.replace(bad, good)

# Also fix the top close button which is still setSelectedNode(null)
bad_close = '''                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-900"
                    title="Cerrar detalles"
                  >'''

good_close = '''                  <button 
                    onClick={() => selectNode(null)} 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-900"
                    title="Cerrar detalles"
                  >'''

content = content.replace(bad_close, good_close)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
