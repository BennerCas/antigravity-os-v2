import re

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
state_insertion = """  const [activeTab, setActiveTab] = useState('info');
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);"""

content = content.replace("  const [activeTab, setActiveTab] = useState('info');", state_insertion)

# Re-implement rotation
rotation_effect = """
  // Efecto de rotación de cámara
  useEffect(() => {
    if (!graphRef.current) return;
    
    let animId: number;
    const rotate = () => {
      if (rotationOn && graphRef.current) {
        const camPos = graphRef.current.cameraPosition();
        if (camPos && (camPos.x !== 0 || camPos.z !== 0)) {
          const radius = Math.sqrt(camPos.x * camPos.x + camPos.z * camPos.z);
          const angle = Math.atan2(camPos.z, camPos.x);
          const newAngle = angle + (0.002 * rotationSpeed);
          graphRef.current.cameraPosition({
            x: radius * Math.cos(newAngle),
            z: radius * Math.sin(newAngle),
            y: camPos.y
          });
        }
      }
      animId = requestAnimationFrame(rotate);
    };
    rotate();
    return () => cancelAnimationFrame(animId);
  }, [rotationOn, rotationSpeed]);

  // Efecto de expansión
  useEffect(() => {
    if (graphRef.current) {
      // Re-calentar simulación para aplicar las nuevas fuerzas
      graphRef.current.d3ReheatSimulation();
    }
  }, [isExpanded]);
"""

# Insert right before return (
ret_idx = content.find('  return (\n    <div className="flex-1 relative')
content = content[:ret_idx] + rotation_effect + content[ret_idx:]

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
