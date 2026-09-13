with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');"
states = """const [activeTopFilter, setActiveTopFilter] = useState('Habilidades');
  const [rotationOn, setRotationOn] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.0);
  const [isExpanded, setIsExpanded] = useState(false);"""

content = content.replace(target, states)

with open('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
