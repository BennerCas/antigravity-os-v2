import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
state_var = "  const [rotationSpeed, setRotationSpeed] = useState(0.12);\n  const [isExpanded, setIsExpanded] = useState(false);"
content = content.replace("  const [rotationSpeed, setRotationSpeed] = useState(0.12);", state_var)

# 2. Add useEffect for layout change
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

# Insert effect hook after the rotation effect
insert_pos = content.find("}, [rotationSpeed, rotationOn]);")
if insert_pos != -1:
    insert_pos = content.find("  //", insert_pos)
    if insert_pos == -1: insert_pos = content.find("  const selectNode", insert_pos)
    content = content[:insert_pos] + effect_hook + "\n" + content[insert_pos:]

# 3. Add UI button
btn_ui = """
          <div className="pointer-events-auto flex items-center gap-3 bg-[#0d1117]/90 border border-gray-800 rounded-xl px-3 py-2 backdrop-blur-sm self-start ml-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title="Expandir/Contraer grafo para mejor legibilidad"
              className={lex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all }
            >
              <Crosshair size={14} />
              {isExpanded ? 'MODO DENSO' : 'MODO EXPANDIDO'}
            </button>
          </div>
"""

# Insert next to rotation controls
rot_div_idx = content.find('className="pointer-events-auto flex items-center gap-3 bg-[#0d1117]/90 border border-gray-800')
if rot_div_idx != -1:
    end_of_rot_div = content.find('</div>', content.find('</div>', rot_div_idx) + 6) + 6
    content = content[:end_of_rot_div] + btn_ui + content[end_of_rot_div:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Expanded Mode UI and Logic injected.")
