import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the boundaries of the <aside>
aside_start = content.find('<aside className="w-[320px] bg-black border-l')
aside_end = content.find('</aside>', aside_start) + len('</aside>')

if aside_start == -1 or aside_end == -1:
    print("Could not find aside block!")
    exit(1)

aside_block = content[aside_start:aside_end]

# Let's fix the aside class
aside_block = aside_block.replace(
    '<aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl overflow-y-auto custom-scrollbar pointer-events-auto">',
    '<aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl pointer-events-auto">'
)

# Fix the sticky header
aside_block = aside_block.replace(
    '<div className="sticky top-0 bg-black z-10">',
    '<div className="flex-none bg-black z-10 border-b border-gray-800">'
)

# We want to extract the node header block
header_start_str = '              <>\n                <div className="p-4 flex flex-col gap-4">'
header_end_str = '                </div>\n\n                {/* Sub-competencias */}'

h_start = aside_block.find(header_start_str)
h_end = aside_block.find(header_end_str)

if h_start != -1 and h_end != -1:
    node_header_content = aside_block[h_start + len('              <>\n'):h_end + len('                </div>\n')]
    aside_block = aside_block[:h_start + len('              <>\n')] + aside_block[h_end + len('                </div>\n\n'):]
    
    tab1_marker = '          {/* TAB 1: Detalles (Info) */}'
    insert_pos = aside_block.find(tab1_marker) - len('          </div>\n\n')
    
    # Use double quotes around the python string to avoid escaping single quotes
    wrapped_header = "            {activeTab === 'info' && selectedNode && (\n" + node_header_content + "            )}\n"
    aside_block = aside_block[:insert_pos] + wrapped_header + aside_block[insert_pos:]

# Wrap the middle content in overflow-y-auto
tab1_idx = aside_block.find('          {/* TAB 1: Detalles (Info) */}')
recom_idx = aside_block.find('          {/* Próxima recomendación panel */}')

if tab1_idx != -1 and recom_idx != -1:
    middle_start = tab1_idx
    middle_end = recom_idx
    middle_wrapper_start = '          <div className="flex-1 overflow-y-auto custom-scrollbar">\n'
    middle_wrapper_end = '          </div>\n\n'
    aside_block = aside_block[:middle_start] + middle_wrapper_start + aside_block[middle_start:middle_end] + middle_wrapper_end + aside_block[middle_end:]

# Now add the "Atrás" button
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

aside_block = aside_block.replace(btn_target, btn_replacement)

# Make the bottom panel flex-none
recom_panel_target = '<div className="p-4 mt-auto border-t border-gray-800 bg-black/90">'
recom_panel_replacement = '<div className="flex-none p-4 mt-auto border-t border-gray-800 bg-black panel-footer">'
aside_block = aside_block.replace(recom_panel_target, recom_panel_replacement)

# Write back
new_content = content[:aside_start] + aside_block + content[aside_end:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Sidebar rebuilt successfully.")
