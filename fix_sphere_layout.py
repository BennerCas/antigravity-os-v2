with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_layout = '''    const SPHERE_R = 300;
    const nodes3d = initialGraphData.nodes.filter(n => n.id !== 'center');
    const totalNodes = nodes3d.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));   // ~2.399 rad

    nodes3d.forEach((node, i) => {
      const y = 1 - (i / (totalNodes - 1)) * 2;          // -1 -> 1
      const radius = Math.sqrt(1 - y * y);
      const theta  = goldenAngle * i;
      node.fx = SPHERE_R * radius * Math.cos(theta);
      node.fy = SPHERE_R * y;
      node.fz = SPHERE_R * radius * Math.sin(theta);
    });

    // center node sits in the middle
    const centerNode = initialGraphData.nodes.find(n => n.id === 'center');
    if (centerNode) { centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0; }'''

new_layout = '''    const SPHERE_R = 300;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // ── 1. Center node at origin ──────────────────────────────────────────────
    const centerNode = initialGraphData.nodes.find(n => n.id === 'center');
    if (centerNode) { centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0; }

    // ── 2. 17 skill nodes → perfect Fibonacci sphere ──────────────────────────
    const skillNodes = initialGraphData.nodes.filter(n => n.id !== 'center' && !n.isSub);
    const totalSkill = skillNodes.length;
    // Store positions keyed by skillId so sub-nodes can reference them
    const skillPos: Record<string, { x: number; y: number; z: number }> = {};

    skillNodes.forEach((node, i) => {
      const y = 1 - (i / (totalSkill - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const px = SPHERE_R * r * Math.cos(theta);
      const py = SPHERE_R * y;
      const pz = SPHERE_R * r * Math.sin(theta);
      node.fx = px;
      node.fy = py;
      node.fz = pz;
      skillPos[node.id] = { x: px, y: py, z: pz };
    });

    // ── 3. Sub-competency nodes → orbit around their parent skill node ─────────
    const subNodes = initialGraphData.nodes.filter(n => n.isSub);
    // Group subs by parent (parent id = everything before first "_mission")
    const subsByParent: Record<string, typeof subNodes> = {};
    subNodes.forEach(sub => {
      const parentId = sub.id.split('_')[0]; // e.g. "n2_mission_01" → "n2"
      if (!subsByParent[parentId]) subsByParent[parentId] = [];
      subsByParent[parentId].push(sub);
    });

    // For each parent, distribute subs in a small circle perpendicular to the
    // parent->center vector (so they fan out away from the sphere center)
    Object.entries(subsByParent).forEach(([parentId, subs]) => {
      const parent = skillPos[parentId];
      if (!parent) return;
      const total = subs.length;
      const orbitR = 55; // radius of the local sub-orbit cluster

      // Build a local coordinate frame: outward direction from center
      const outNorm = Math.sqrt(parent.x ** 2 + parent.y ** 2 + parent.z ** 2) || 1;
      const ux = parent.x / outNorm;
      const uy = parent.y / outNorm;
      const uz = parent.z / outNorm;

      // Arbitrary perpendicular vector (tangent)
      const tx = Math.abs(ux) < 0.9 ? 1 : 0;
      const ty = Math.abs(uy) < 0.9 && Math.abs(ux) >= 0.9 ? 1 : 0;
      const tz = 0;
      // Cross product: out x tangent → gives another tangent
      const bx = uy * tz - uz * ty;
      const by = uz * tx - ux * tz;
      const bz = ux * ty - uy * tx;
      const bNorm = Math.sqrt(bx ** 2 + by ** 2 + bz ** 2) || 1;

      subs.forEach((sub, j) => {
        const angle = (j / total) * Math.PI * 2;
        // Place sub in the local tangent plane, offset outward from parent
        sub.fx = parent.x + orbitR * 1.6 * ux + orbitR * Math.cos(angle) * (bx / bNorm);
        sub.fy = parent.y + orbitR * 1.6 * uy + orbitR * Math.sin(angle) * (by / bNorm);
        sub.fz = parent.z + orbitR * 1.6 * uz + orbitR * Math.cos(angle) * (bz / bNorm);
      });
    });'''

if old_layout in content:
    content = content.replace(old_layout, new_layout)
    print("Sphere layout replaced OK")
else:
    print("ERROR: layout target not found")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done.")
