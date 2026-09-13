import sys

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Fix <aside> class
for i, line in enumerate(lines):
    if '<aside className="w-[320px] bg-black border-l border-gray-800 flex flex-col z-20 shrink-0 absolute right-0 top-0 bottom-0 shadow-2xl overflow-y-auto custom-scrollbar pointer-events-auto">' in line:
        lines[i] = line.replace('overflow-y-auto custom-scrollbar ', '')
        break

# 2. Fix the sticky header wrapper
for i, line in enumerate(lines):
    if '<div className="sticky top-0 bg-black z-10">' in line:
        lines[i] = line.replace('sticky top-0', 'flex-none')
        break

# 3. Find the end of the custom tab bar (it's a </div>)
tab_bar_end = -1
for i, line in enumerate(lines):
    if '{/* TAB 1: Detalles (Info) */}' in line:
        tab_bar_end = i - 1 # The line before is the </div> closing the sticky container
        break

# We need to inject a conditional block inside the fixed header for the Node Header
injection_idx = tab_bar_end

# We want to move the Node Header out of the scrollable area.
# Wait, let's just create a completely new structure for the aside.
# Since it's complex, let's inject <div className="flex-1 overflow-y-auto custom-scrollbar"> right after the sticky header closes!
# Wait, actually the sticky header closes at 	ab_bar_end.
# Let's just wrap the rest in <div className="flex-1 overflow-y-auto custom-scrollbar">
# And then at the bottom, just before </aside>, we close the scrollable div.
# BUT we want the Próxima recomendación panel to be fixed at the bottom!
# So we need to put Próxima recomendación panel outside the scrollable area.

# Actually, this is too fragile with line-by-line python.
# Let's just download the whole file to python, use regex or string replace.
