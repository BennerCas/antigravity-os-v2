import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\apps\web-app\src\components\BuilderNodes.tsx'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Replace h-[120px] with h-[calc(100%-40px)] and allow scroll!
content = content.replace(
    'className="w-full h-[120px] bg-black/10 border border-transparent rounded p-2 text-sm resize-none outline-none scrollbar-none whitespace-pre-wrap"',
    'className="w-full h-[calc(100%-35px)] bg-black/20 border border-transparent hover:border-zinc-500/30 rounded p-2 text-sm resize-none outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 whitespace-pre-wrap"'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)

print("BuilderNodes textareas are now fully responsive and scrollable.")
