import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# find the last closing brace of the component
# Since it's export default function KnowledgeGraph3D() { ... }
# The very last characters should be:
#   );
# }
idx = content.find('    </div>\n  );\n}')
if idx != -1:
    content = content[:idx + len('    </div>\n  );\n}')]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content + "\n")
