const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

const handlers = `
  const handleUpgrade = async () => {
    if (!inspectedAgent) return;
    setIsUpgrading(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: \`Mejora y haz mas profesional este prompt de sistema/agente. Añade secciones de contexto y reglas claras. Devuelve solo el resultado mejorado en Markdown.\\n\\nPrompt Original:\\n\${inspectedAgent.instructions || inspectedAgent.content}\`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error de conexión con Ollama local');
      const data = await res.json();
      
      const newAgent = {
        ...inspectedAgent,
        id: (inspectedAgent.id || Date.now().toString()) + '-upgraded',
        title: inspectedAgent.title + ' (Upgrade)',
        instructions: data.response
      };
      
      setAllAgents(prev => [newAgent, ...prev]);
      setInspectedAgent(newAgent);
    } catch (err) {
      console.error(err);
      alert('Error al mejorar el agente. Verifica que Ollama este funcionando.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogic = async () => {
    if (!inspectedAgent) return;
    setPanelTab('logic');
    if (logicData[inspectedAgent.id || '']) return;

    setIsGeneratingLogic(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: \`Analiza el siguiente agente de IA y explica detalladamente cómo funciona, qué hace, su lógica interna y su propósito principal de manera extensa y clara.\\n\\nAgente:\\n\${inspectedAgent.instructions || inspectedAgent.content}\`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error al conectar con Ollama');
      const data = await res.json();
      setLogicData(prev => ({ ...prev, [inspectedAgent.id || '']: data.response }));
    } catch (err) {
      console.error(err);
      setLogicData(prev => ({ ...prev, [inspectedAgent.id || '']: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));
    } finally {
      setIsGeneratingLogic(false);
    }
  };
`;

c = c.replace('// ─── SEARCH LOGIC', handlers + '\n  // ─── SEARCH LOGIC');
fs.writeFileSync(file, c);
console.log('Done');
