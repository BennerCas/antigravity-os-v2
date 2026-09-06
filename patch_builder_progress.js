const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename ejecutarLoading to showProgressModal, add progress details
content = content.replace(
  /const \[ejecutarLoading, setEjecutarLoading\] = useState\(false\);/,
  `const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressTitle, setProgressTitle] = useState('');
  const [progressDesc, setProgressDesc] = useState('');
  const [progressSubtext, setProgressSubtext] = useState('');`
);

// 2. Update handleEjecutar to use the new states
content = content.replace(
  /setEjecutarLoading\(true\);/,
  `setShowProgressModal(true);
    setProgressTitle('Analizando Grafo y Orquestando...');
    setProgressDesc('Conectando con el motor AI y asignando arquitecturas óptimas (CrewAI / AutoGen / LangGraph).');
    setProgressSubtext('');`
);
content = content.replace(/setEjecutarLoading\(false\);/g, 'setShowProgressModal(false);');

// 3. Update the modal render block
content = content.replace(
  /\{ejecutarLoading && \([\s\S]*?\{progress\}\% Completado<\/span>[\s\S]*?\{timeRemaining\}s restantes<\/span>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
  `{showProgressModal && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col items-center">
             <div className="text-4xl mb-4 animate-bounce">🧠</div>
             <h3 className="text-xl font-bold mb-2 text-white text-center">{progressTitle}</h3>
             <p className="text-sm text-zinc-400 mb-6 text-center">{progressDesc}</p>
             
             {progressSubtext && (
               <div className="text-xs font-mono text-purple-400 mb-2 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                 {progressSubtext}
               </div>
             )}

             <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-2 relative">
               <div 
                 className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                 style={{ width: \`\${progress}%\` }}
               />
             </div>
             <div className="w-full flex justify-between text-xs text-zinc-500 font-mono font-bold uppercase tracking-widest">
                <span>{progress}% Completado</span>
                <span>~ {timeRemaining}s restantes</span>
             </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync(path, content, 'utf8');
