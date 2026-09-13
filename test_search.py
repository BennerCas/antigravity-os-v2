import re

with open('c:/antigravityAS/scratch_kg.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

aside_start = content.find('<aside className="w-[320px] bg-black border-l')
aside_end = content.find('</aside>', aside_start) + len('</aside>')
aside_orig = content[aside_start:aside_end]

# Node Header
h_start = aside_orig.find('                <div className="p-4 flex flex-col gap-4">')
print(h_start)

# Tab 1 Scrollable Content (from Sub-competencias to before Próxima recomendación)
scroll_start = aside_orig.find('                {/* Sub-competencias */}')
print(scroll_start)

empty_state_start = aside_orig.find('            !selectedNode ? (\n')
print(empty_state_start)

