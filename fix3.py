with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

bad = "className={\\x0clex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }"
good = "className={\lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all \\}"
text = text.replace(bad, good)

# Also let's try another brute force just in case
lines = text.split('\n')
for i in range(len(lines)):
    if "MODO EXPANDIDO" in lines[i]:
        # The className is 2 lines above
        lines[i-2] = "              className={\lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all \\}"

text = '\n'.join(lines)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
