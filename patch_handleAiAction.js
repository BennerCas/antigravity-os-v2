const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const newFn = `  /** Call the backend and create a result node on the canvas */
  const handleAiAction = async (
    action: 'upgrade' | 'atomizar' | 'traducir' | 'editar' | 'logica',
    extras?: { target_language?: string; edit_instruction?: string }
  ) => {
    let targetNodes = nodes.filter(n => n.data?.selectedForPdf);
    if (targetNodes.length === 0) {
      const fallback = nodes.find(n => n.id === 'main') || nodes[0];
      if (fallback) targetNodes = [fallback];
    }

    if (targetNodes.length === 0) {
      setAiError('Selecciona o escribe un prompt primero');
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    setAiLoading(action);
    setAiError(null);
    setShowProgressModal(true);
    setProgressTitle(\`Procesando: \${action.toUpperCase()}\`);
    setProgressDesc('Analizando y conectando con el motor de IA...');
    setProgress(0);
    
    const EST_PER_NODE = 10;
    setTimeRemaining(targetNodes.length * EST_PER_NODE);
    
    const progressInterval = setInterval(() => {
       setTimeRemaining(t => Math.max(1, t - 1));
       setProgress(p => {
         // Fake local increment so the bar moves while waiting for current node
         if (p % 100 >= 95) return p;
         return p + 1;
       });
    }, 1000);

    try {
      let currentNodes = [...nodes];
      let currentEdges = [...edges];

      for (let i = 0; i < targetNodes.length; i++) {
        const sourceNode = targetNodes[i];
        const promptContent = String(sourceNode.data?.content || sourceNode.data?.title || '');
        
        setProgressSubtext(\`Nodo \${i + 1} de \${targetNodes.length}\`);
        setProgress(Math.floor((i / targetNodes.length) * 100));
        
        if (!promptContent.trim()) continue;

        const res = await fetch(\`\${BACKEND_URL}/builder/action\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            prompt_content: promptContent,
            target_language: extras?.target_language || 'Español',
            edit_instruction: extras?.edit_instruction || 'Mejora la claridad y precisión'
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Error del servidor');
        }

        const data = await res.json();
        const actionLabels: Record<string, string> = {
          upgrade: '⬆️ Upgrade',
          atomizar: '⚛️ Variante',
          traducir: '🌍 Traducido',
          editar: '✏️ Editado',
          logica: '🧠 Lógica'
        };

        const newId = \`ai-\${action}-\${Date.now()}-\${i}\`;
        const newNode: Node = {
          id: newId,
          type: action === 'logica' ? 'logicaNode' : action === 'traducir' ? 'traducir' : action === 'editar' ? 'editar' : 'mainPrompt',
          position: {
            x: (sourceNode.position?.x ?? 250) + 420,
            y: (sourceNode.position?.y ?? 250) + (i * 700) // 700px spacing vertical
          },
          data: {
            title: actionLabels[action],
            content: data.result,
            model: data.model_used
          }
        };

        const newEdge: Edge = {
          id: \`e-\${sourceNode.id}-\${newId}\`,
          source: sourceNode.id,
          target: newId,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 }
        };

        currentNodes = [...currentNodes, newNode];
        currentEdges = [...currentEdges, newEdge];
      }

      clearInterval(progressInterval);
      setProgress(100);
      setTimeRemaining(0);
      
      setNodes(currentNodes);
      setEdges(currentEdges);
      saveHistory(currentNodes, currentEdges);

      setTimeout(() => {
        setShowProgressModal(false);
      }, 800);

    } catch (e: any) {
      clearInterval(progressInterval);
      setAiError(\`Error: \${e.message}\`);
      setShowProgressModal(false);
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(null);
    }
  };`;

// Find everything from "const handleAiAction =" to "const [showProgressModal"
const startIdx = content.indexOf('const handleAiAction = async (');
const endIdx = content.indexOf('const [showProgressModal, setShowProgressModal]');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newFn + '\n\n  ' + content.substring(endIdx);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Replaced handleAiAction successfully.");
} else {
  console.log("Could not find boundaries.");
}
