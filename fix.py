with open('backend/services/agent_factory.py', 'r', encoding='utf-8') as f:
    c = f.read()

import re
# The broken string spans multiple lines in the file
broken_str = 'base = f"{base}\n\n## CONOCIMIENTO MAESTRO DE ATLAS\n{atlas}"'
fixed_str = 'base = f"{base}\\n\\n## CONOCIMIENTO MAESTRO DE ATLAS\\n{atlas}"'

c = c.replace(broken_str, fixed_str)

with open('backend/services/agent_factory.py', 'w', encoding='utf-8') as f:
    f.write(c)
