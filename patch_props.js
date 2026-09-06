const fs = require('fs');

const path = 'apps/web-app/src/components/builder/PropertiesPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Volume2 to lucide-react import
content = content.replace(
    "import { X, Sparkles, Loader2, Brain } from 'lucide-react';",
    "import { X, Sparkles, Loader2, Brain, Volume2 } from 'lucide-react';"
);

// 2. Add playTTS function inside the component
const ttsFunction = `
  const playTTS = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  };
`;
// Insert right after "const [isSuggesting, setIsSuggesting] = useState(false);"
content = content.replace(
    'const [isSuggesting, setIsSuggesting] = useState(false);',
    'const [isSuggesting, setIsSuggesting] = useState(false);\n' + ttsFunction
);

// 3. Rewrite handleAutoSuggest
const newHandleAutoSuggest = `
  const handleAutoSuggest = async () => {
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
          // Update the node directly with the generated values
          onUpdateNode(selectedNode.id, {
            ...data,
            content: result.content || data.content,
            role: result.role || data.role,
            variables: result.variables || data.variables,
            framework: result.framework || data.framework,
            llm_model: result.llm_model || data.llm_model,
            temperature: result.temperature || data.temperature,
            output_schema: result.output_schema ? JSON.stringify(result.output_schema, null, 2) : data.output_schema
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };
`;

// Replace the old handleAutoSuggest
content = content.replace(/const handleAutoSuggest = async \(\) => \{[\s\S]*?\};/, newHandleAutoSuggest.trim());

// 4. Add TTS buttons
// Instrucción / Prompt label
content = content.replace(
    '<label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Instrucción / Prompt</label>',
    '<div className="flex items-center gap-2"><label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Instrucción / Prompt</label><button onClick={() => playTTS(data.content)} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>'
);

// Framework Objetivo label
content = content.replace(
    '<label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1.5">Framework Objetivo</label>',
    '<div className="flex items-center gap-2 mb-1.5"><label className="block text-xs font-semibold uppercase tracking-wider opacity-70">Framework Objetivo</label><button onClick={() => playTTS(frameworkDescriptions[data.framework || \'auto\'])} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>'
);

fs.writeFileSync(path, content, 'utf8');
console.log("PropertiesPanel.tsx updated via Node.");
