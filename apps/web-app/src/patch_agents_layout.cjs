const fs = require('fs');
const file = 'c:/antigravityAS/Antigravity_OS_v2/apps/web-app/src/pages/Agents.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add new state variables
const stateHookStr = `const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);`;
const newStateStr = `const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'logic'>('content');
  const [logicData, setLogicData] = useState<Record<string, string>>({});
  const [isGeneratingLogic, setIsGeneratingLogic] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    setPanelTab('content');
  }, [inspectedAgent?.id]);`;

if (c.includes(stateHookStr) && !c.includes('setPanelTab')) {
    c = c.replace(stateHookStr, newStateStr);
}

// 2. Add upgrade and logic handlers (insert before //  SEARCH LOGIC)
const searchLogicStr = `  //  SEARCH LOGIC `;
const handlersStr = `
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
      
      const newAgent: Agent = {
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

  //  SEARCH LOGIC `;

if (c.includes(searchLogicStr) && !c.includes('handleUpgrade')) {
    c = c.replace(searchLogicStr, handlersStr);
}

// 3. Replace the Right Column Render
const rightColRegex = /<div className="flex-1 overflow-y-auto p-5 custom-scrollbar">[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/div>\s*\);\s*};)/;

const newRightCol = `<div className="flex-1 flex flex-col overflow-hidden relative">
          {inspectedAgent ? (
            <div className="flex flex-col h-full relative">
              
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar pb-28">
                
                {/* Herramientas IA en la parte superior */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-800 pb-2 mb-1">Herramientas IA</div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⌛ Upgrade...' : '⬆️ Upgrade'}
                    </button>
                    <button 
                      onClick={(e) => handleSpeak(e as any, inspectedAgent.instructions || inspectedAgent.content)}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px]"
                    >
                      🔊 TTS
                    </button>
                  </div>
                </div>

                {/* Titulo y Boton Logica */}
                <div className="flex items-center justify-between mb-4">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{inspectedAgent.category?.split(' > ').pop() || 'Agente'}</span>
                    <h3 className="text-2xl font-bold text-white mt-1 leading-tight">{inspectedAgent.title}</h3>
                  </div>
                  <button 
                    onClick={handleLogic} 
                    className={\`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 \${panelTab === 'logic' ? 'bg-blue-600 text-white border-blue-500' : 'bg-blue-900/40 text-blue-300 border-blue-700/50 hover:bg-blue-800'}\`}
                  >
                    🧠 Lógica
                  </button>
                </div>
                
                {/* Contenido (Markdown) */}
                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' ? (
                    <ReactMarkdown>{inspectedAgent.instructions || inspectedAgent.content}</ReactMarkdown>
                  ) : (
                    <ReactMarkdown>{logicData[inspectedAgent.id || ''] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del agente... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>
                
              </div>

              {/* Botón inferior FIJO al fondo */}
              <div className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-[#0f111a] via-[#0f111a] to-transparent">
                <button 
                  onClick={(e) => handleSetAgent(e as any, inspectedAgent)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-1"
                >
                  Abrir en el Builder →
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 text-center p-5">
              <div className="text-6xl mb-4">🤖</div>
              <p>Selecciona un agente en el directorio para ver sus detalles y herramientas de IA.</p>
            </div>
          )}
        </div>`;

if (rightColRegex.test(c)) {
    c = c.replace(rightColRegex, newRightCol);
} else {
    console.log("Could not find right column match!");
}

fs.writeFileSync(file, c);
console.log('Patched UI successfully');
