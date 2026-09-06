const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const handleEjecutar = async \(\) => \{[\s\S]*?setEjecutarLoading\(false\);\n\s*\};/;

const newHandleEjecutar = `const handleEjecutar = async () => {
    const nodesData = nodes.filter(n => n.type !== 'postIt' && n.type !== 'drawingNode' && n.type !== 'rulerNode').map(n => ({
      id: n.id,
      title: n.data?.title || 'Sin Título',
      content: String(n.data?.content || ''),
      role: n.data?.role || 'Default Agent',
      framework: n.data?.framework || 'auto',
      type: n.type || 'mainPrompt',
      variables: n.data?.variables || '',
      llm_model: n.data?.llm_model || 'hermes3:8b',
      temperature: n.data?.temperature || 0.7,
      output_schema: n.data?.output_schema || '{"type": "object"}'
    }));
    const edgesData = edges.map(e => ({ source: e.source, target: e.target }));

    if (nodesData.length === 0) {
      setAiError('No hay nodos configurables en el canvas para ejecutar');
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    setEjecutarLoading(true);
    setAiError(null);
    setProgress(0);
    setTimeRemaining(nodesData.length * 5);
    
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.floor(Math.random() * 5) + 1;
      });
      setTimeRemaining(t => Math.max(1, t - 1));
    }, 1000);

    try {
      const res = await fetch(\`\${BACKEND_URL}/execute/task\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_description: String(nodes[0]?.data?.content || 'Flujo Automático'),
          nodes: nodesData,
          edges: edgesData
        })
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setTimeRemaining(0);

      if (res.ok) {
        const data = await res.json();
        
        if (data.updated_nodes && Array.isArray(data.updated_nodes)) {
          setNodes((nds) => nds.map(n => {
            const updated = data.updated_nodes.find((u: any) => u.id === n.id);
            if (updated) {
              return {
                ...n,
                data: {
                  ...n.data,
                  content: updated.content || n.data.content,
                  role: updated.role || n.data.role,
                  framework: updated.framework || n.data.framework,
                  variables: updated.variables || n.data.variables
                }
              };
            }
            return n;
          }));
        }

        setTimeout(() => setExecutionResult(data), 500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAiError(errData.detail || 'Error al orquestar la ejecución');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error(err);
      setAiError('No se pudo conectar con el motor local');
    } finally {
      setTimeout(() => {
        setEjecutarLoading(false);
        setProgress(0);
      }, 600);
    }
  };`;

content = content.replace(regex, newHandleEjecutar);
fs.writeFileSync(path, content, 'utf8');
console.log("Successfully replaced handleEjecutar");
