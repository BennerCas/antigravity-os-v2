const fs = require('fs');
let mine = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

mine = mine.replace(/  const isFirstRender = useRef\(true\);\n  \/\/ Expanded Mode\n  useEffect\(\(\) => \{[\s\S]*?\}, \[isExpanded\]\);/g, `  // Expanded Mode handled by camera radius`);
mine = mine.replace(/  \/\/ Camera Rotation\n  useEffect\(\(\) => \{[\s\S]*?\}, \[rotationOn, rotationSpeed\]\);/g, `  // Camera Rotation
  useEffect(() => {
    let frameId: number;
    let angle = 0;
    const rotateCamera = () => {
      if(rotationOn && graphRef.current) {
        angle += 0.005 * rotationSpeed;
        const radius = isExpanded ? 300 : 500;
        graphRef.current.cameraPosition({
          x: radius * Math.sin(angle),
          z: radius * Math.cos(angle),
          y: isExpanded ? 200 : 350
        });
      }
      frameId = requestAnimationFrame(rotateCamera);
    };
    rotateCamera();
    return () => cancelAnimationFrame(frameId);
  }, [rotationOn, rotationSpeed, isExpanded]);`);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', mine);
