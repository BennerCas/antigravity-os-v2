import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Builder.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_modal = '''      {executionResult && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                🚀 Meta-Orquestador
              </h2>
              <button onClick={() => setExecutionResult(null)} className="text-zinc-400 hover:text-white p-1">✕</button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-zinc-400 mb-1">Framework Seleccionado:</div>
              <div className="text-lg font-bold" style={{ color: '#a855f7' }}>
                {executionResult.framework.toUpperCase()}
              </div>
            </div>
            
            <div className="mb-2">
              <div className="text-sm text-zinc-400 mb-1">Plan de Ejecución ({executionResult.model_used}):</div>
              <pre className="text-sm bg-zinc-950 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-zinc-300 border border-zinc-800">
                {executionResult.execution_plan}
              </pre>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setExecutionResult(null)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}'''

new_modal = '''      {executionResult && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                🚀 Meta-Orquestador
              </h2>
              <button onClick={() => setExecutionResult(null)} className="text-zinc-400 hover:text-white p-2 text-xl">✕</button>
            </div>
            
            <div className="mb-4 flex-shrink-0 flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-zinc-800/50">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Framework Recomendado</div>
                <div className="text-xl font-black" style={{ color: '#a855f7' }}>
                  {executionResult.framework.toUpperCase()}
                </div>
              </div>
              <div className="w-px h-10 bg-zinc-800 mx-2"></div>
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cerebro Utilizado</div>
                <div className="text-sm font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded">
                  {executionResult.model_used}
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col mb-2">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-semibold">Plan Estratégico de Ejecución:</div>
              <div className="flex-1 overflow-y-auto bg-zinc-950/80 rounded-xl border border-zinc-800 shadow-inner p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <pre className="text-sm whitespace-pre-wrap text-zinc-300 font-mono leading-relaxed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  {executionResult.execution_plan}
                </pre>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-zinc-500">
                Fase de planificación completada. Falta conectar con el motor de ejecución nativo.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setExecutionResult(null)} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Cerrar
                </button>
                <button disabled className="px-5 py-2.5 bg-blue-600/50 text-white/50 cursor-not-allowed rounded-lg text-sm font-bold flex items-center gap-2">
                  <span className="text-lg">⚙️</span> Generar Scripts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}'''

content = content.replace(old_modal, new_modal)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Modal patched to be wider, better structured, and without full-page scroll.")
