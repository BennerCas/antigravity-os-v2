with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. REPLACE D3 FORCES  with a Fibonacci sphere pinned layout ───────────────
old_forces = '''    const d3ChargeForce = graph.d3Force("charge") as unknown as { strength?: (strength: number) => void } | undefined;
    if (d3ChargeForce && typeof d3ChargeForce.strength === 'function') {
      d3ChargeForce.strength(-400);
    }

    const d3LinkForce = graph.d3Force("link") as unknown as { distance?: (fn: (link: GraphSkillLink) => number) => void } | undefined;
    if (d3LinkForce && typeof d3LinkForce.distance === 'function') {
      d3LinkForce.distance((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 40 : 120;
      });
    }'''

new_forces = '''    // ── Fibonacci sphere: pin every node on a perfect sphere surface ──
    const SPHERE_R = 220;
    const nodes3d = initialGraphData.nodes.filter(n => n.id !== 'center');
    const totalNodes = nodes3d.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));   // ~2.399 rad

    nodes3d.forEach((node, i) => {
      const y = 1 - (i / (totalNodes - 1)) * 2;          // -1 → 1
      const radius = Math.sqrt(1 - y * y);
      const theta  = goldenAngle * i;
      node.fx = SPHERE_R * radius * Math.cos(theta);
      node.fy = SPHERE_R * y;
      node.fz = SPHERE_R * radius * Math.sin(theta);
    });

    // center node sits in the middle
    const centerNode = initialGraphData.nodes.find(n => n.id === 'center');
    if (centerNode) { centerNode.fx = 0; centerNode.fy = 0; centerNode.fz = 0; }

    // disable all forces so nothing drifts
    graph.d3Force('charge', null);
    graph.d3Force('link', null);
    graph.d3Force('center', null);

    // ── Auto-rotation animation loop ──────────────────────────────────────────
    let rotAngle = 0;
    let animId: number;
    const ROTATION_SPEED = 0.0012; // radians per frame — very gentle
    const autoRotate = () => {
      rotAngle += ROTATION_SPEED;
      const cam = graph.camera();
      const dist = cam ? Math.hypot(cam.position.x, cam.position.y, cam.position.z) : 350;
      graph.cameraPosition({
        x: dist * Math.sin(rotAngle),
        y: -50,
        z: dist * Math.cos(rotAngle)
      });
      animId = requestAnimationFrame(autoRotate);
    };
    animId = requestAnimationFrame(autoRotate);

    // pause rotation on user interaction, resume after 3 s
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    const pauseRotation = () => {
      cancelAnimationFrame(animId);
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => { animId = requestAnimationFrame(autoRotate); }, 3000);
    };
    containerRef.current.addEventListener('pointerdown', pauseRotation);'''

if old_forces in content:
    content = content.replace(old_forces, new_forces)
    print('Forces replaced OK')
else:
    print('ERROR: target not found for forces')

# ── 2. CLEANUP: cancel animId and pointerdown listener on unmount ─────────────
old_cleanup = '''    return () => {
      window.removeEventListener("resize", handleResize);
      if (graphRef.current && typeof graphRef.current._destructor === 'function') {
        graphRef.current._destructor();
      }
    };'''

new_cleanup = '''    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimer) clearTimeout(resumeTimer);
      containerRef.current?.removeEventListener('pointerdown', pauseRotation);
      window.removeEventListener("resize", handleResize);
      if (graphRef.current && typeof graphRef.current._destructor === 'function') {
        graphRef.current._destructor();
      }
    };'''

if old_cleanup in content:
    content = content.replace(old_cleanup, new_cleanup)
    print('Cleanup replaced OK')
else:
    print('ERROR: target not found for cleanup')

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done.')
