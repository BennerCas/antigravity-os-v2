import re

with open('c:/antigravityAS/scratch_kg.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('<aside className="w-[320px]')
end = content.find('</aside>', start) + len('</aside>')
aside_orig = content[start:end]

h_end = aside_orig.find('                    <hr className="border-gray-800" />')
scroll_start = h_end
scroll_end = aside_orig.find('                {/* Próxima recomendación panel */}')
tab1_scroll = aside_orig[scroll_start:scroll_end]

# It currently ends with </div>\n                </div>\n\n
# We want to remove the last </div>\n\n
last_div = tab1_scroll.rfind('                </div>\n\n')
if last_div != -1:
    tab1_scroll = tab1_scroll[:last_div] + '\n'

print(repr(tab1_scroll[-100:]))
