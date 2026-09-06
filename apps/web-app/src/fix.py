with open('c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
bad_chunk = '''            {displayAgentes.length === 0 && (
          <h2 className=\
font-bold
text-gray-200
flex
items-center
gap-2\><Sparkle size={18} className=\text-blue-400\ /> Panel del Agente</h2>'''
good_chunk = '''            {displayAgentes.length === 0 && (
              <div className=\
col-span-full
text-center
text-gray-500
py-10
text-lg\>
                No se encontraron agentes.
              </div>
            )}
          </div>
        </div>
      )}

      </div> {/* End Left Column */}

      {/* Right Column: AI & Inspected Agent */}
      <div className=\
w-80
md:w-96
border-l
border-gray-800
bg-[#0f111a]
flex
flex-col
z-20
flex-shrink-0
shadow-2xl\>
        <div className=\
p-5
border-b
border-gray-800
flex
items-center
justify-between
bg-gray-900/50\>
          <h2 className=\
font-bold
text-gray-200
flex
items-center
gap-2\><Sparkle size={18} className=\text-blue-400\ /> Panel del Agente</h2>'''
if bad_chunk in content:
    content = content.replace(bad_chunk, good_chunk)
    with open('c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Fixed successfully!')
else:
    print('Chunk not found!')
