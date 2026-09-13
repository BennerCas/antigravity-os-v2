import re

with open('c:/antigravityAS/scratch_kg.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('<aside className="w-[320px]')
end = content.find('</aside>', start) + len('</aside>')

aside_orig = content[start:end]
before = content[:start]
after = content[end:]

# 1. Header tabs
tabs_start = aside_orig.find('            {/* Custom Tab Bar */}')
tabs_end = aside_orig.find('          </div>\n\n          {/* TAB 1')
tabs_code = aside_orig[tabs_start:tabs_end]

# 2. Node Header
# It starts at:
h_start = aside_orig.find('                <div className="p-4 flex flex-col gap-4">')
# And ends at the <hr className="border-gray-800" />
hr_str = '                    <hr className="border-gray-800" />'
h_end = aside_orig.find(hr_str)

node_header = aside_orig[h_start:h_end]
# Note: node_header still contains the opening <div className="p-4 flex flex-col gap-4"> 
# We just need to close it:
node_header += '                </div>\n'

# 3. Tab 1 Scrollable Content (Competencias, Relaciones, Misiones)
# Starts at <hr> and ends at Próxima recomendación
scroll_start = h_end
scroll_end = aside_orig.find('                {/* Próxima recomendación panel */}')
tab1_scroll = aside_orig[scroll_start:scroll_end]
# We need to wrap it in a div:
tab1_scroll = '                <div className="p-4 flex flex-col gap-4">\n' + tab1_scroll

# Add the 'Atrás' button
btn_target = '''                        <button 
                          onClick={() => handleLaunchMission(selectedNode?.id || 'mission_id')}
                          className="w-full mt-3 py-1.5 rounded border border-gray-700 hover:bg-gray-800 active:scale-95 transition-transform text-sm text-gray-400"
                        >
                          Ver detalles completos
                        </button>'''
btn_replacement = '''                        <button 
                          onClick={() => handleLaunchMission(selectedNode?.id || 'mission_id')}
                          className="w-full mt-3 py-1.5 rounded border border-gray-700 hover:bg-gray-800 active:scale-95 transition-transform text-sm text-gray-400"
                        >
                          Ver detalles completos
                        </button>
                        <button 
                          onClick={() => setSelectedNode(null)}
                          className="w-full mt-2 py-1.5 rounded bg-transparent border border-gray-800 hover:border-gray-600 hover:text-white active:scale-95 transition-transform text-sm text-gray-500"
                        >
                          Atrás
                        </button>'''
tab1_scroll = tab1_scroll.replace(btn_target, btn_replacement)

# Since we stripped the closing </div> of the original lex-col gap-4 (it was before Próxima),
# It actually is still in the string? Wait!
# scroll_end is right at {/* Próxima recomendación panel */}.
# Just before it, there are TWO </div>\n                </div>\n. Let's just keep tab1_scroll as is, because it ALREADY contains the closing </div>s for Misiones and the wrapper p-4 flex flex-col gap-4!
# Wait, let's verify if 	ab1_scroll contains the closing </div>.
# Yes, side_orig[scroll_start:scroll_end] goes from <hr> to just before {/* Próxima.

# 4. Próxima Recomendación
proxima_start = aside_orig.find('                {/* Próxima recomendación panel */}')
proxima_end = aside_orig.find('              </>\n            )\n          )}\n\n          {/* TAB 2')
proxima_code = aside_orig[proxima_start:proxima_end]
proxima_code = proxima_code.replace('<div className="mt-auto border-t border-gray-800 p-4 bg-black">', '<div className="flex-none mt-auto border-t border-gray-800 p-4 bg-black">')


# 5. Empty State
empty_state_start = aside_orig.find('            !selectedNode ? (\n')
empty_state_end = aside_orig.find('            ) : (\n              <>\n')
empty_state = aside_orig[empty_state_start + len('            !selectedNode ? (\n'):empty_state_end]


# 6. Tabs 2, 3, 4
tabs_234_start = aside_orig.find('          {/* TAB 2: Competencias */}')
tabs_234 = aside_orig[tabs_234_start:-len('      </aside>')]


# Construct the final UI
new_aside = '''      <aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl pointer-events-auto">
          
          <div className="flex-none bg-black z-10 border-b border-gray-800">
            <div className="p-4 flex justify-between items-center">
                <h2 className="text-base font-bold text-white">
                  {activeTab === 'info' && 'Detalles de habilidad'}
                  {activeTab === 'competencias' && 'Competencias por habilidad'}
                  {activeTab === 'sistema' && 'Sistema de aprendizaje'}
                  {activeTab === 'progreso' && 'Estado de tu progreso'}
                </h2>
                {selectedNode && activeTab === 'info' && (
                  <button 
                    onClick={() => setSelectedNode(null)} 
                    className="text-gray-400 hover:text-white transition p-1 rounded hover:bg-gray-900"
                    title="Cerrar detalles"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
            </div>

''' + tabs_code + '''

            {activeTab === 'info' && selectedNode && (
''' + node_header + '''            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'info' && !selectedNode && (
''' + empty_state + '''            )}
            
            {activeTab === 'info' && selectedNode && (
              <>
''' + tab1_scroll + '''              </>
            )}

''' + tabs_234 + '''          </div>

          {activeTab === 'info' && selectedNode && (
''' + proxima_code + '''          )}
      </aside>'''


with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(before + new_aside + after)

print("Sidebar rewritten robustly.")
