import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Locate the rotation controls
rot_start = content.find('{/*  Rotation Controls  */}')
# Find where the button expanded block ends
rot_end = content.find('</button>\n          </div>', rot_start) + 21

controls_html = content[rot_start:rot_end]

# Remove controls from old position
content = content[:rot_start] + content[rot_end:]

# 2. Locate the place to insert (Below global progress)
# Find the context selector block end
context_end = content.find('</select>\n                  </div>\n              </div>')
insert_pos = context_end + len('</select>\n                  </div>\n              </div>')

# Create the wrapper for the controls
wrapper = """
              {/* Controls Wrapper */}
              <div className="flex items-center gap-3 mt-3">
                  """ + controls_html.replace('self-start ml-3', '').replace('self-start', '') + """
              </div>"""

content = content[:insert_pos] + wrapper + content[insert_pos:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
