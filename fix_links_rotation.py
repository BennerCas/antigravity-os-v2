with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ── FIX 1: Remove invalid linkOpacity + remove linkThreeObject (blocks native links) ──
old_link_tail = """      .linkDirectionalParticleColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? (sourceNode.color || "#ffffff") : "#ffffff";
      })
      .linkOpacity(0.8)
      .linkThreeObjectExtend(true)
      .linkThreeObject((link: GraphSkillLink) => {
        if (!link.name) return null as unknown as THREE.Object3D;
        const sprite = new SpriteText(link.name);
        sprite.color = "#94a3b8";
        sprite.textHeight = 4;
        return sprite as unknown as THREE.Object3D;
      })
      .linkPositionUpdate((sprite: THREE.Object3D, { start, end }: { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number } }) => {
        if(!sprite) return;
        const middlePos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2,
            z: start.z + (end.z - start.z) / 2
        };
        Object.assign(sprite.position, middlePos);
      });"""

new_link_tail = """      .linkDirectionalParticleColor((link: GraphSkillLink) => {
        const sourceNode = getSourceNode(link.source);
        return sourceNode ? (sourceNode.color || "#ffffff") : "#ffffff";
      });"""

if old_link_tail in content:
    content = content.replace(old_link_tail, new_link_tail)
    print("Link tail fixed OK")
else:
    print("ERROR: link tail target not found")

# ── FIX 2: Replace camera-based rotation with SCENE rotation ──
old_rotate_loop = """    const autoRotate = () => {
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
    };"""

new_rotate_loop = """    const scene = graph.scene?.();
    const autoRotate = () => {
      if (rotActiveRef.current && scene) {
        scene.rotation.y += rotSpeedRef.current;
      }
      animId = requestAnimationFrame(autoRotate);
    };"""

if old_rotate_loop in content:
    content = content.replace(old_rotate_loop, new_rotate_loop)
    print("Rotation loop fixed OK")
else:
    print("ERROR: rotation loop target not found")

# ── FIX 3: Remove old scene.add(starMesh) block that conflicted ──
# The old code had: const scene = graph.scene?.(); after the stars. Remove that second declaration
old_scene_stars = """    const scene = graph.scene?.();
    if (scene) {
      scene.add(starMesh);
    }"""

new_scene_stars = """    const sceneForStars = graph.scene?.();
    if (sceneForStars) {
      sceneForStars.add(starMesh);
    }"""

if old_scene_stars in content:
    content = content.replace(old_scene_stars, new_scene_stars)
    print("Stars scene fixed OK")
else:
    print("Stars scene block not found - might be fine")

# ── FIX 4: Pause on pointerdown should NOT auto-resume if user is still interacting ──
# Simply remove the auto-resume since scene.rotation keeps angle without camera fighting
old_pause = """    // Pause on pointer interaction, auto-resume after 2.5 s if still ON
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

new_pause = """    // No auto-pause for scene rotation (doesn't fight zoom)
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;"""

if old_pause in content:
    content = content.replace(old_pause, new_pause)
    print("Pause removed OK")
else:
    print("ERROR: pause target not found")

# ── FIX 5: Cleanup update ──
old_cleanup = """    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimer) clearTimeout(resumeTimer);
      containerRef.current?.removeEventListener('pointerdown', pauseRotation);
      window.removeEventListener("resize", handleResize);"""

new_cleanup = """    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimer) clearTimeout(resumeTimer);
      window.removeEventListener("resize", handleResize);"""

if old_cleanup in content:
    content = content.replace(old_cleanup, new_cleanup)
    print("Cleanup updated OK")
else:
    print("ERROR: cleanup target not found")

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("All done.")
