const fs = require('fs');

let mine = fs.readFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', 'utf-8');

mine = mine.replace(/  \/\/ Expanded Mode\n  useEffect\(\(\) => \{[\s\S]*?\}, \[isExpanded\]\);/g, `  // Expanded Mode
  useEffect(() => {
    // temporarily disabled
  }, [isExpanded]);`);

fs.writeFileSync('apps/web-app/src/components/academy/KnowledgeGraph3D.tsx', mine);
