with open('backend/routers/studio.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove the route
route_pattern = r"@router\.post\(\"/amd-gpu/activate\"\)\nasync def activate_amd_gpu\(\):[\s\S]*?return \{\"status\": \"error\", \"message\": str\(e\)\}"
content = re.sub(route_pattern, "", content)

with open('backend/routers/studio.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("AMD route removed from studio.py!")
