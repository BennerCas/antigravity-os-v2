const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const \[nodes, setNodes\] = useState<Node\[\]>\(\(\) => \{[\s\S]*?return buildInitialNodes\(\);\s*\}\);/,
    `const [nodes, setNodes] = useState<Node[]>(() => {
    if (restoreCanvas && promptKey) {
      const saved = localStorage.getItem(canvasNodesKey);
      return saved ? JSON.parse(saved) : buildInitialNodes();
    }
    if (templateFlow || incomingChain || incomingPrompt) {
      return buildInitialNodes();
    }
    const genericSaved = localStorage.getItem('builderNodes');
    if (genericSaved) return JSON.parse(genericSaved);
    return buildInitialNodes();
  });`
);

content = content.replace(
    /const \[edges, setEdges\] = useState<Edge\[\]>\(\(\) => \{[\s\S]*?return buildInitialEdges\(\);\s*\}\);/,
    `const [edges, setEdges] = useState<Edge[]>(() => {
    if (restoreCanvas && promptKey) {
      const saved = localStorage.getItem(canvasEdgesKey);
      return saved ? JSON.parse(saved) : buildInitialEdges();
    }
    if (templateFlow || incomingChain || incomingPrompt) {
      return buildInitialEdges();
    }
    const genericSaved = localStorage.getItem('builderEdges');
    if (genericSaved) return JSON.parse(genericSaved);
    return buildInitialEdges();
  });`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Builder.tsx state restoration prioritization fixed");
