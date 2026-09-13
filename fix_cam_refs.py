import re
with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all graphRef.current.cameraPosition blocks in the JSX (after line 500)
# Pattern: optional if block checking x/y/z types, then cameraPosition call
pattern = r"""(\s*if \(graphRef\.current && typeof [a-zA-Z\.]+\.x === 'number' && typeof [a-zA-Z\.]+\.y === 'number' && typeof [a-zA-Z\.]+\.z === 'number'\) \{\s*(?:const hyp = Math\.hypot\([^;]+;\s*const distRatio = [^;]+;\s*)?graphRef\.current\.cameraPosition\(\s*[^;]+;\s*[^;]+;\s*\d+\s*\);\s*\})"""

# Count matches before
matches = re.findall(pattern, content, re.DOTALL)
print(f"Found {len(matches)} cameraPosition blocks to remove")

new_content = re.sub(pattern, '', content, flags=re.DOTALL)

# Also handle handleBack's cameraPosition block
old_back_cam = '''      if (prevNode && typeof prevNode.x === 'number' && typeof prevNode.y === 'number' && typeof prevNode.z === 'number') {
        if (graphRef.current) {
          const hyp = Math.hypot(prevNode.x, prevNode.y, prevNode.z);
          const distRatio = hyp > 120 ? (1 - 100 / hyp) : 1.5;
          graphRef.current.cameraPosition(
            { x: prevNode.x * distRatio, y: prevNode.y * distRatio, z: prevNode.z * distRatio },
            prevNode as unknown as { x: number; y: number; z: number },
            2000
          );
        }
      }'''
new_content = new_content.replace(old_back_cam, '')

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Done")
