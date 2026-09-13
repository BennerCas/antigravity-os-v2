import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State variable
if 'const [isExpanded, setIsExpanded]' not in content:
    content = re.sub(
        r'(const \[rotationSpeed, setRotationSpeed\] = useState.*?;.*?\n)',
        r'\1  const [isExpanded, setIsExpanded] = useState(false);\n',
        content,
        count=1
    )

# 2. useEffect
effect_hook = """
  // Update graph layout when isExpanded changes
  useEffect(() => {
    if (!graphRef.current) return;
    const gData = graphRef.current.graphData();
    if (!gData || !gData.nodes || gData.nodes.length === 0) return;

    const SPHERE_R = isExpanded ? 700 : 300;
    const orbitR = isExpanded ? 90 : 45;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const skillNodes = gData.nodes.filter((n: any) => n.id !== 'center' && !n.isSub);
    const totalSkill = skillNodes.length;
    const skillPos: Record<string, { x: number; y: number; z: number }> = {};

    skillNodes.forEach((node: any, i: number) => {
      const yy = 1 - (i / (totalSkill - 1)) * 2;
      const rr = Math.sqrt(1 - yy * yy);
      const theta = goldenAngle * i;
      const px = SPHERE_R * rr * Math.cos(theta);
      const py = SPHERE_R * yy;
      const pz = SPHERE_R * rr * Math.sin(theta);
      
      node.fx = px; node.fy = py; node.fz = pz;
      skillPos[node.id] = { x: px, y: py, z: pz };
    });

    const subNodes = gData.nodes.filter((n: any) => n.isSub);
    const subsByParent: Record<string, any[]> = {};
    subNodes.forEach((sub: any) => {
      const parentId = sub.id.split('_')[0];
      if (!subsByParent[parentId]) subsByParent[parentId] = [];
      subsByParent[parentId].push(sub);
    });

    Object.entries(subsByParent).forEach(([parentId, subs]) => {
      const parent = skillPos[parentId];
      if (!parent) return;
      const total = subs.length;
      const norm = Math.sqrt(parent.x ** 2 + parent.y ** 2 + parent.z ** 2) || 1;
      const nx = parent.x / norm, ny = parent.y / norm, nz = parent.z / norm;
      const tx = Math.abs(nx) < 0.9 ? 1 : 0;
      const ty = (Math.abs(ny) < 0.9 && Math.abs(nx) >= 0.9) ? 1 : 0;
      const tz = 0;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      const bNorm = Math.sqrt(bx ** 2 + by ** 2 + bz ** 2) || 1;
      subs.forEach((sub: any, j: number) => {
        const angle = (j / total) * Math.PI * 2;
        sub.fx = parent.x + nx * orbitR * 1.8 + orbitR * Math.cos(angle) * tx + orbitR * Math.sin(angle) * (bx / bNorm);
        sub.fy = parent.y + ny * orbitR * 1.8 + orbitR * Math.cos(angle) * ty + orbitR * Math.sin(angle) * (by / bNorm);
        sub.fz = parent.z + nz * orbitR * 1.8 + orbitR * Math.cos(angle) * tz + orbitR * Math.sin(angle) * (bz / bNorm);
      });
    });

    graphRef.current.d3ReheatSimulation();
  }, [isExpanded]);
"""

if 'const SPHERE_R = isExpanded ? 700 : 300;' not in content:
    idx = content.find("const selectNode = (node: any) => {")
    if idx != -1:
        content = content[:idx] + effect_hook + "\n  " + content[idx:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
