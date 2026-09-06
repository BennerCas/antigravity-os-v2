const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Artifact states and refs
content = content.replace(
  /const \[isExecuting, setIsExecuting\] = useState\(false\);/,
  `const [isExecuting, setIsExecuting] = useState(false);\n  const [showArtifactModal, setShowArtifactModal] = useState(false);\n  const [finalOutputContent, setFinalOutputContent] = useState("");\n  const terminalLogsRef = useRef<string[]>([]);`
);

// 2. Add ReactMarkdown import if not present
if (!content.includes('import ReactMarkdown')) {
  content = content.replace(/import \{ ArrowLeft/g, "import ReactMarkdown from 'react-markdown';\nimport { ArrowLeft");
}

// 3. Update startExecution
const startExecutionOld = `  const startExecution = () => {
    try {
      console.log('startExecution triggered!');
      setIsExecuting(true);
      setTerminalLogs(['Iniciando conexión con Runtime...']);
      const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/execute');
    wsRef.current = ws;

    ws.onopen = () => {
      setTerminalLogs(prev => [...prev, 'Conectado. Enviando comando run...']);
      ws.send(JSON.stringify({ command: 'run' }));
    };

    ws.onmessage = (event) => {
      setTerminalLogs(prev => [...prev, event.data]);
    };`;

const startExecutionNew = `  const startExecution = () => {
    try {
      console.log('startExecution triggered!');
      setIsExecuting(true);
      terminalLogsRef.current = ['Iniciando conexión con Runtime...'];
      setTerminalLogs(terminalLogsRef.current);
      const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/execute');
    wsRef.current = ws;

    ws.onopen = () => {
      terminalLogsRef.current = [...terminalLogsRef.current, 'Conectado. Enviando comando run...'];
      setTerminalLogs(terminalLogsRef.current);
      ws.send(JSON.stringify({ command: 'run' }));
    };

    ws.onmessage = (event) => {
      terminalLogsRef.current = [...terminalLogsRef.current, event.data];
      setTerminalLogs(terminalLogsRef.current);
      
      if (event.data.includes('[DONE] Process exited with code 0')) {
        const fullText = terminalLogsRef.current.join('\\n');
        const match = fullText.match(/Final Output:\\s([\\s\\S]*?)(?:\\[DONE\\]|$)/);
        if (match && match[1]) {
           setFinalOutputContent(match[1].trim());
           setShowArtifactModal(true);
        }
      }
    };`;
content = content.replace(startExecutionOld, startExecutionNew);

// 4. Update handleSave
const handleSaveOld = `  const handleSave = () => {
    console.log("Guardando flujo...", { nodes, edges });
    alert("Flujo guardado con éxito.");
  };`;
const handleSaveNew = `  const handleSave = async () => {
    try {
      const payload = {
        id: crypto.randomUUID(),
        name: "Flow " + new Date().toLocaleTimeString(),
        description: "Flow guardado desde Builder",
        nodes: nodes,
        edges: edges
      };
      const res = await fetch('http://127.0.0.1:8000/api/v1/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Flujo guardado con éxito y disponible en Flows.");
      } else {
        alert("Error al guardar flujo.");
      }
    } catch (e) {
      alert("Error: " + e);
    }
  };`;
content = content.replace(handleSaveOld, handleSaveNew);

// 5. Inject Artifact Modal JSX near the end of the file, right before the closing </ReactFlowProvider></div>
const artifactModalJSX = `
      {showArtifactModal && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0f0f11] border border-zinc-800/80 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800/80 flex justify-between items-center bg-[#16161a] relative">
               <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
               <h3 className="font-bold text-xl text-zinc-100 flex items-center gap-2">
                 <span className="text-2xl">✨</span> Artefacto Generado
               </h3>
               <button onClick={() => setShowArtifactModal(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                 <X size={20} />
               </button>
            </div>

            {/* Markdown Body */}
            <div className="p-8 overflow-y-auto flex-1 bg-gradient-to-br from-[#0a0a0c] to-[#121216] text-zinc-300">
               <article className="prose prose-invert prose-blue max-w-none">
                 <ReactMarkdown>{finalOutputContent}</ReactMarkdown>
               </article>
            </div>
            
            {/* Footer Options */}
            <div className="p-4 border-t border-zinc-800 bg-[#16161a] flex justify-end items-center gap-4">
               <button onClick={() => { navigator.clipboard.writeText(finalOutputContent); alert("Copiado al portapapeles") }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm font-semibold transition-colors">
                 Copiar Markdown
               </button>
               <button onClick={() => setShowArtifactModal(false)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all">
                 Aceptar
               </button>
            </div>

          </div>
        </div>
      )}
`;

content = content.replace(/(<\/ReactFlowProvider>\s*<\/div>\s*)$/m, artifactModalJSX + '\n$1');

// 6. Support restoreFlow in useEffect
const useEffectOld = `  useEffect(() => {
    if (location.state?.promptChain && !location.state?.restoreCanvas) {
      // Logic for promptChain
      const newNodes: AppNode[] = [];`;
      
const useEffectNew = `  useEffect(() => {
    if (location.state?.restoreFlow) {
      setNodes(location.state.restoreFlow.nodes || []);
      setEdges(location.state.restoreFlow.edges || []);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    if (location.state?.promptChain && !location.state?.restoreCanvas) {
      // Logic for promptChain
      const newNodes: AppNode[] = [];`;
content = content.replace(useEffectOld, useEffectNew);

fs.writeFileSync(path, content, 'utf8');
