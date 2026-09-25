file_path = 'C:\\antigravityAS\\Antigravity_OS_v2\\apps\\web-app\\src\\pages\\AgentOSStudio.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('<Panel position="top-left" className="!m-4">')
print(f"start_idx: {start_idx}")

end_idx = content.find('/>\n        </ReactFlow>', start_idx)
print(f"end_idx: {end_idx}")

if end_idx == -1:
    end_idx = content.find('</ReactFlow>', start_idx)
    print(f"fallback end_idx: {end_idx}")
