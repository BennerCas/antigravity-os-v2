const fs = require('fs');
const path = 'apps/web-app/src/pages/Flows.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add states
content = content.replace(
  /const \[savedFlows, setSavedFlows\] = useState<any\[\]>\(\[\]\);/,
  `const [savedFlows, setSavedFlows] = useState<any[]>([]);\n  const [openMenuId, setOpenMenuId] = useState<string | null>(null);`
);

// Add handleDeleteFlow after useEffect
const useEffectStr = `  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/flows')
      .then(res => res.json())
      .then(data => setSavedFlows(Array.isArray(data) ? data : (data.flows || [])))
      .catch(err => console.error('Failed to fetch flows:', err));
  }, []);`;

const deleteLogic = `\n  const handleDeleteFlow = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este ecosistema?")) return;
    try {
      await fetch(\`http://127.0.0.1:8000/api/v1/flows/\${id}\`, { method: 'DELETE' });
      setSavedFlows(prev => prev.filter(f => f.id !== id));
      setOpenMenuId(null);
    } catch (e) {
      console.error(e);
    }
  };\n`;

content = content.replace(useEffectStr, useEffectStr + deleteLogic);

// Replace the dots button
const dotsOld = `<button className="text-gray-500 hover:text-white">
                    <DotsThreeOutlineVertical size={20} weight="fill" />
                  </button>`;
const dotsNew = `<div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === flow.id ? null : flow.id)} className="text-gray-500 hover:text-white relative">
                      <DotsThreeOutlineVertical size={20} weight="fill" />
                    </button>
                    {openMenuId === flow.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                        <button onClick={() => handleDeleteFlow(flow.id)} className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 text-sm font-semibold transition-colors">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>`;
content = content.replace(dotsOld, dotsNew);

// Replace the Play button
const playOld = `<button className="w-12 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-900/50 rounded-xl flex items-center justify-center transition-colors">
                    <Play size={18} weight="fill" />
                  </button>`;
const playNew = `<button onClick={() => alert("Próximamente: Ejecución Headless. Te permitirá correr este ecosistema en segundo plano y recibir los resultados directamente aquí, sin tener que abrir el entorno del Builder.")} className="w-12 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-900/50 rounded-xl flex items-center justify-center transition-colors" title="Ejecución Headless (Próximamente)">
                    <Play size={18} weight="fill" />
                  </button>`;
content = content.replace(playOld, playNew);

fs.writeFileSync(path, content, 'utf8');
