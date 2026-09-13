with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add refs for rotation control after existing state declarations
old_state = "  const propsRef = useRef(props);"
new_state = """  // Rotation controls (refs so they work inside rAF without stale closure)
  const rotActiveRef   = useRef(true);
  const rotSpeedRef    = useRef(0.0012);
  const [rotationOn,   setRotationOn]   = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.6); // 0.1 → 2.0 slider value
  const propsRef = useRef(props);"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("State refs added OK")
else:
    print("ERROR: state refs target not found")

# 2. Replace the hardcoded rotation loop with a refs-driven one + bigger sphere
old_rot = """    // ── Auto-rotation animation loop ──────────────────────────────────────────
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
    containerRef.current.addEventListener('pointerdown', pauseRotation);"""

new_rot = """    // ── Auto-rotation loop driven by refs (survives re-renders) ─────────────
    let rotAngle = 0;
    let animId: number;
    const autoRotate = () => {
      if (rotActiveRef.current) {
        rotAngle += rotSpeedRef.current;
        const cam = graph.camera();
        const dist = cam ? Math.hypot(cam.position.x, cam.position.y, cam.position.z) : 450;
        graph.cameraPosition({
          x: dist * Math.sin(rotAngle),
          y: -50,
          z: dist * Math.cos(rotAngle)
        });
      }
      animId = requestAnimationFrame(autoRotate);
    };
    animId = requestAnimationFrame(autoRotate);

    // Pause on pointer interaction, auto-resume after 2.5 s if still ON
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    const pauseRotation = () => {
      if (!rotActiveRef.current) return;
      rotActiveRef.current = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        if (rotActiveRef.current === false) {
          rotActiveRef.current = true;
        }
      }, 2500);
    };
    containerRef.current.addEventListener('pointerdown', pauseRotation);"""

if old_rot in content:
    content = content.replace(old_rot, new_rot)
    print("Rotation loop replaced OK")
else:
    print("ERROR: rotation loop target not found")

# 3. Bigger sphere (220 -> 300)
content = content.replace("    const SPHERE_R = 220;", "    const SPHERE_R = 300;")
print("Sphere radius updated")

# 4. Enhance links: thicker width, full color, more particles
old_links = """      .linkWidth((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0.5 : 2;
      })
      .linkColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? `${sourceNode.color}66` : "rgba(255,255,255,0.2)"; 
      })
      .linkDirectionalParticles((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0 : 3;
      })
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? (sourceNode.color || "#ffffff") : "#ffffff";
      })"""

new_links = """      .linkWidth((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 0.8 : 2.5;
      })
      .linkColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? `${sourceNode.color}cc` : "rgba(255,255,255,0.5)";
      })
      .linkDirectionalParticles((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 1 : 5;
      })
      .linkDirectionalParticleWidth((link: GraphSkillLink) => {
        const s = getSourceNode(link.source);
        const t = getTargetNode(link.target);
        return s?.isSub || t?.isSub ? 1.5 : 3.5;
      })
      .linkDirectionalParticleSpeed(0.007)
      .linkDirectionalParticleColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? (sourceNode.color || "#ffffff") : "#ffffff";
      })
      .linkOpacity(0.8)"""

if old_links in content:
    content = content.replace(old_links, new_links)
    print("Links enhanced OK")
else:
    print("ERROR: links target not found")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("File saved.")
