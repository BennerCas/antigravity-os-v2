const fs = require('fs');
const path = 'apps/web-app/src/components/builder/PropertiesPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Volume2
content = content.replace(
    "import { X, Sparkles, Loader2, Brain } from 'lucide-react';",
    "import { X, Sparkles, Loader2, Brain, Volume2 } from 'lucide-react';"
);

// 2. Add playTTS
const ttsFunction = `
  const playTTS = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  };
`;
if (!content.includes('const playTTS')) {
    content = content.replace(
        'const [isSuggesting, setIsSuggesting] = useState(false);',
        'const [isSuggesting, setIsSuggesting] = useState(false);\n' + ttsFunction
    );
}

// 3. Replace handleAutoSuggest
const oldHandle = `const handleAutoSuggest = async () => {
    if (!data.content) return;
    setIsSuggesting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/builder/suggest-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_content: data.content })
      });
      if (res.ok) {
        const suggested = await res.json();
        if (onAddVariantNode) {
          const variantData = {
            title: suggested.title || data.title,
            role: suggested.role || data.role,
            framework: suggested.framework || data.framework,
            variables: suggested.variables || data.variables,
            ai_reasoning: suggested.reasoning || null,
            content: data.content // keep original content but save variant metadata
          };
          onAddVariantNode(selectedNode.id, variantData);
          
          // Persistencia de memoria de variantes
          try {
            const savedVariants = JSON.parse(localStorage.getItem('generated_variants') || '[]');
            savedVariants.push({ ...variantData, id: Date.now().toString() });
            localStorage.setItem('generated_variants', JSON.stringify(savedVariants));
          } catch (err) {
            console.error("Error al guardar variante:", err);
          }
        }
      } else {
        alert("Error al conectar con la IA. El servidor respondió con un error.");
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo conectar con el servidor local. Asegúrate de que el backend de Antigravity OS esté corriendo.");
    }
    setIsSuggesting(false);
  };`;

const newHandle = `const handleAutoSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/builder/autocomplete_node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title || '',
          content: data.content || '',
          role: data.role || '',
          framework: data.framework || 'auto',
          variables: data.variables || ''
        })
      });
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.data) {
          const result = responseData.data;
          onUpdateNode(selectedNode.id, {
            ...data,
            content: result.content || data.content,
            role: result.role || data.role,
            variables: result.variables || data.variables,
            framework: result.framework || data.framework,
            llm_model: result.llm_model || data.llm_model,
            temperature: result.temperature ? parseFloat(result.temperature) : data.temperature,
            output_schema: result.output_schema ? JSON.stringify(result.output_schema, null, 2) : data.output_schema
          });
        }
      } else {
        alert("Error al conectar con la IA.");
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo conectar con el servidor local.");
    } finally {
      setIsSuggesting(false);
    }
  };`;

// Note: Because of encoding issues with alert characters (ó, á, é) in string matching, we use a regex that matches the start and end of the function exactly.
content = content.replace(/const handleAutoSuggest = async \(\) => \{[\s\S]*?setIsSuggesting\(false\);\n  \};/, newHandle);

// 4. Inject TTS labels
const targetLabel1 = '<label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Instrucción / Prompt</label>';
const repl1 = '<div className="flex items-center gap-2"><label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Instrucción / Prompt</label><button onClick={() => playTTS(data.content)} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>';

const targetLabel2 = '<label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1.5">Framework Objetivo</label>';
const repl2 = '<div className="flex items-center gap-2 mb-1.5"><label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Framework Objetivo</label><button onClick={() => playTTS(frameworkDescriptions[data.framework || \'auto\'])} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>';

content = content.replace(targetLabel1, repl1);
content = content.replace(targetLabel2, repl2);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched correctly!");
