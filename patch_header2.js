const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const CardHeaderActions = \(\{.*?\}\) => \{[\s\S]*?\}\s*;\s*\n*(?=export const MainPromptNode)/;

const newCardHeaderActions = `
const CardHeaderActions = ({ id, data, customColor }: { id: string; data: any; customColor?: string }) => {
  const { setNodes, setEdges } = useReactFlow();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const text = data.content || data.prompt || data.note || "";
  const selectedForPdf = data.selectedForPdf;

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, selectedForPdf: checked } } : n));
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  const handleAutoSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/builder/autocomplete_node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title || '',
          content: text || '',
          role: data.role || '',
          framework: data.framework || 'auto',
          variables: data.variables || ''
        })
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.data) {
          const result = responseData.data;
          setNodes((nds) => nds.map(n => {
            if (n.id === id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  content: result.content || n.data.content,
                  role: result.role || n.data.role,
                  variables: result.variables || n.data.variables,
                  framework: result.framework || n.data.framework,
                  llm_model: result.llm_model || n.data.llm_model,
                  temperature: result.temperature ? parseFloat(result.temperature) : n.data.temperature,
                  output_schema: result.output_schema ? JSON.stringify(result.output_schema, null, 2) : n.data.output_schema
                }
              };
            }
            return n;
          }));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="absolute top-2 right-2 nodrag flex items-center gap-1.5 z-10" style={customColor ? { color: customColor } : {}}>
      <button onClick={handleAutoSuggest} disabled={isSuggesting} className={\`p-1 hover:bg-black/10 rounded transition-colors \${!customColor ? "theme-node-btn" : ""} \${isSuggesting ? "opacity-50" : ""}\`} title="Mejorar Prompt con IA">
        {isSuggesting ? <Spinner size={14} className="animate-spin" /> : <MagicWand size={14} className="text-pink-400" />}
      </button>
      <button onClick={() => handleCopy(text)} className={\`p-1 hover:bg-black/10 rounded transition-colors \${!customColor ? "theme-node-btn" : ""}\`} title="Copiar">
        <Copy size={14} />
      </button>
      <button onClick={() => handleTTS(text)} className={\`p-1 hover:bg-black/10 rounded transition-colors \${!customColor ? "theme-node-btn" : ""}\`} title="TTS">
        <SpeakerHigh size={14} />
      </button>
      <button onClick={handleDelete} className={\`p-1 hover:bg-black/10 rounded transition-colors \${!customColor ? "theme-node-btn-danger" : ""}\`} title="Eliminar">
        <Trash size={14} />
      </button>
      <input 
        type="checkbox" 
        className="cursor-pointer w-4 h-4 ml-1 accent-blue-500"
        checked={!!selectedForPdf}
        onChange={handleToggle}
        title="Seleccionar para PDF/Acciones"
      />
    </div>
  );
};
`;

content = content.replace(regex, newCardHeaderActions);
fs.writeFileSync(path, content, 'utf8');
console.log("CardHeaderActions finally updated!");
