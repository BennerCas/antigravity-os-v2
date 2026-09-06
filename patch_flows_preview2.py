import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Flows.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

target = '''                  </div>
                </div>
  
              {/* Action Footer */}'''

replacement = '''                  </div>
                  
                  {/* Nodes Preview Section */}
                  <div className="mt-3 bg-gray-900/30 p-3 rounded-lg border border-gray-800/50">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-1 mb-2"><GitBranch size={12}/> Composición de Nodos ({tpl.nodes})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.builderData?.nodes?.map((n: any, idx: number) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/20 text-indigo-300 border border-indigo-900/40">
                          {n.data?.title || n.id}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
  
              {/* Action Footer */}'''

content = content.replace(target, replacement)

# Add GitBranch to imports
if 'GitBranch' not in content:
    content = content.replace('Lightning, Cpu, Clock, PuzzlePiece', 'Lightning, Cpu, Clock, PuzzlePiece, GitBranch')

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Nodes Preview added correctly")
