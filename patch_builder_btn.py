import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\pages\Builder.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

limpiar_btn = '''        <button
          onClick={() => {
            if (window.confirm("¿Seguro que deseas limpiar todo el lienzo?")) {
              setNodes([]);
              setEdges([]);
            }
          }}
          className="px-3 py-1.5 text-sm rounded hover:bg-red-900/40 text-red-400 transition-colors"
          title="Limpiar todo el lienzo"
        >
          🗑️ Limpiar
        </button>
        <div className="theme-divider"></div>'''

content = content.replace('<div className="theme-divider"></div>', limpiar_btn, 1)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("Added Limpiar button")
