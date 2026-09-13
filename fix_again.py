with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = '''                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>
                    </div>

              </>'''

good_str = '''                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>
                    </div>
                </div>
              </>'''

new_content = content.replace(bad_str, good_str)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
