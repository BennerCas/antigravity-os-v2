import sys
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('export const gData')
end = content.find('};', start)
gdata_text = content[start:end+2]
sys.stdout.buffer.write(f"gData length: {len(gdata_text)}\n".encode('utf-8'))
sys.stdout.buffer.write(f"Contains n1_c01: {'n1_c01' in gdata_text}\n".encode('utf-8'))

lines = gdata_text.split('\n')
for i, line in enumerate(lines):
    if 'n1_c01' in line or 'n17_mission_18' in line:
        sys.stdout.buffer.write(f"Line {i}: {line}\n".encode('utf-8'))
