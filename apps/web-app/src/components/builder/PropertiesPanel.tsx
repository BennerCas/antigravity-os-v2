import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { X, Wand2, Loader2, Brain, Volume2 } from 'lucide-react';
import type { BuilderNodeData } from '../../types/builder';
import { API_URL } from '../../lib/api';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, newData: BuilderNodeData) => void;
  onAddVariantNode?: (originalNodeId: string, suggestedData: BuilderNodeData) => void;
  onClose: () => void;
  nodeStyle?: string;
}



export default function PropertiesPanel({ selectedNode, onUpdateNode, onAddVariantNode, onClose, nodeStyle = 'default' }: PropertiesPanelProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const playTTS = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
  };


  if (!selectedNode) return null;

  const data = (selectedNode.data || {}) as BuilderNodeData;
  const isAgentConfigurable = ['mainPrompt', 'logicaNode', 'editar', 'traducir', 'ai-node'].includes(selectedNode.type || 'mainPrompt');
  const isGroupNode = selectedNode.type === 'group' || selectedNode.type === 'groupNode';

  const handleChange = (key: string, value: string) => {
    onUpdateNode(selectedNode.id, { ...data, [key]: value });
  };

  const handleAutoSuggest = async () => {
    if (!data.content) return;
    setIsSuggesting(true);
    try {
      const res = await fetch(`${API_URL}/builder/suggest-node`, {
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
          
          // Persistencia de memoria de variantes (local + backend SQLite)
          try {
            const savedVariants = JSON.parse(localStorage.getItem('generated_variants') || '[]');
            const variantRecord = { ...variantData, id: Date.now().toString() };
            savedVariants.push(variantRecord);
            localStorage.setItem('generated_variants', JSON.stringify(savedVariants));
            fetch(`${API_URL}/builder/variants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantRecord)
            }).catch(() => { /* backend offline: queda en localStorage */ });
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
  };

  // Determinar clases extra de estilo según el nodeStyle para que la columna combine con la card
  const customPanelStyle: React.CSSProperties = {
    backgroundColor: "var(--theme-card)",
    borderColor: "#2563eb",
    color: "var(--theme-text)"
  };
  
  let extraClasses = "";
  
  if (nodeStyle === 'neon') {
    customPanelStyle.boxShadow = "0 0 25px rgba(37, 99, 235, 0.4), inset 0 0 10px rgba(37, 99, 235, 0.2)";
    extraClasses = "border-2 rounded-2xl";
  } else if (nodeStyle === 'brutalist') {
    customPanelStyle.boxShadow = "8px 8px 0 var(--theme-text)";
    extraClasses = "border-4 rounded-none";
  } else if (nodeStyle === 'glass') {
    customPanelStyle.background = "rgba(0,0,0,0.1)";
    customPanelStyle.backdropFilter = "blur(12px)";
    customPanelStyle.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
    extraClasses = "border border-white/20 rounded-2xl";
  } else if (nodeStyle === 'wireframe') {
    customPanelStyle.background = "transparent";
    extraClasses = "border-2 border-dashed rounded-none";
  } else if (nodeStyle === 'comic') {
    customPanelStyle.boxShadow = "6px 6px 0 var(--theme-border)";
    extraClasses = "border-4 rounded-2xl font-comic";
  }

  return (
    <div 
      className={`absolute right-0 top-20 bottom-5 w-[340px] p-5 flex flex-col z-[150] overflow-y-auto custom-scrollbar transition-all duration-300 ${extraClasses || 'border-l-2 border-t-2 border-b-2 rounded-tl-2xl rounded-bl-2xl'}`}
      style={customPanelStyle}
    >
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-bold text-base tracking-wide flex items-center gap-2" style={{ color: "var(--theme-text)" }}>
          ⚙️ Propiedades del Nodo
        </h3>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity" style={{ color: "var(--theme-text)" }}>
          <X size={18} />
        </button>
      </div>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {!isGroupNode && (
            <>
              <div className="shrink-0">
                <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Título del Paso</label>
                <input
                  type="text"
                  value={data.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors"
                  style={{ backgroundColor: "var(--theme-bg)", border: "1px solid #2563eb", color: "var(--theme-text)" }}
                  placeholder="Ej. Redactor Publicitario"
                />
              </div>
      
              <div className="flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                   <div className="flex items-center gap-2"><label className="block text-sm font-semibold uppercase tracking-wider opacity-70">Instrucción / Prompt</label><button onClick={() => playTTS(data.content as string)} className="opacity-50 hover:opacity-100 transition-opacity"><Volume2 size={14} className="text-emerald-400"/></button></div>
                   {isAgentConfigurable && (
                     <button 
                       onClick={handleAutoSuggest} 
                       disabled={isSuggesting || !data.content}
                       title="Mejorar configuración con IA"
                       className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 font-medium text-white shadow-md bg-purple-600 hover:bg-purple-500"
                     >
                       {isSuggesting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                       <span>Mejorar</span>
                     </button>
                   )}
                </div>
                <textarea
                  value={data.content || ''}
                  onChange={(e) => handleChange('content', e.target.value)}
                  className="w-full flex-1 rounded-lg px-3 py-2 text-base focus:outline-none transition-colors resize-y theme-input"
                  placeholder="Describe la tarea que debe realizar este nodo..."
                />
              </div>
            </>
          )}

          {isGroupNode && (
            <div className="flex-1 flex flex-col min-h-[220px] space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Contexto Global (System Prompt)</label>
                <textarea
                  value={(data.system_prompt as string) || ''}
                  onChange={(e) => handleChange('system_prompt', e.target.value)}
                  className="w-full flex-1 min-h-[150px] rounded-lg px-3 py-2 text-base focus:outline-none transition-colors resize-y theme-input"
                  placeholder="Instrucciones globales para este grupo..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Modelo Global</label>
                <select
                  value={(data.global_model as string) || 'hermes3:8b'}
                  onChange={(e) => handleChange('global_model', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors cursor-pointer theme-input"
                >
                  <option value="hermes3:8b">Ollama: Hermes 3 (8B)</option>
                  <option value="qwen2.5-coder:latest">Ollama: Qwen 2.5 Coder</option>
                  <option value="llama3.2">Ollama: Llama 3.2</option>
                  <option value="gpt-4o-mini">OpenAI: GPT-4o Mini</option>
                  <option value="gpt-4o">OpenAI: GPT-4o</option>
                  <option value="claude-3-5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
                </select>
              </div>
            </div>
          )}

        {isAgentConfigurable && (
          <>
            {data.ai_reasoning && (
              <div className="p-3 rounded-lg border flex items-start gap-2 theme-input">
                <Brain size={14} className="mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed opacity-90">{data.ai_reasoning}</p>
              </div>
            )}

            <div className="h-px w-full my-2 shrink-0 opacity-20" style={{ backgroundColor: "var(--theme-text)" }} />
            
            <div>
              <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Herramientas (Tools)</label>
              <input
                type="text"
                value={(data.tools as string) || ''}
                onChange={(e) => handleChange('tools', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors theme-input"
                placeholder="Ej. tavily_search, python_repl, calculator"
              />
              <p className="text-[10px] mt-2 p-2 rounded border leading-relaxed opacity-80 theme-input">
                 Herramientas separadas por comas que este nodo puede usar.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Rol Específico</label>
              <input
                type="text"
                value={data.role || ''}
                onChange={(e) => handleChange('role', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors theme-input"
                placeholder="Ej. Senior Python Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Variables de Entrada</label>
              <input
                type="text"
                value={data.variables || ''}
                onChange={(e) => handleChange('variables', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors theme-input"
                placeholder="Ej. topic, audience_size"
              />
            </div>

            <div className="h-px w-full my-2 shrink-0 opacity-20" style={{ backgroundColor: "var(--theme-text)" }} />
            
            <div>
              <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Modelo LLM</label>
              <select
                value={data.llm_model || 'hermes3:8b'}
                onChange={(e) => handleChange('llm_model', e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-base focus:outline-none transition-colors cursor-pointer theme-input"
              >
                <option value="hermes3:8b">Ollama: Hermes 3 (8B)</option>
                <option value="qwen2.5-coder:latest">Ollama: Qwen 2.5 Coder</option>
                <option value="llama3.2">Ollama: Llama 3.2</option>
                <option value="gpt-4o-mini">OpenAI: GPT-4o Mini</option>
                <option value="gpt-4o">OpenAI: GPT-4o</option>
                <option value="claude-3-5-sonnet">Anthropic: Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold uppercase tracking-wider opacity-70">Temperatura</label>
                <span className="text-sm opacity-70 font-mono">{data.temperature || '0.7'}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.temperature || '0.7'}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full accent-fuchsia-500"
              />
              <div className="flex justify-between text-[10px] opacity-50 mt-1">
                <span>Determinista (0.0)</span>
                <span>Creativo (1.0)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 uppercase tracking-wider opacity-70">Output Schema (JSON)</label>
              <textarea
                value={data.output_schema || ''}
                onChange={(e) => handleChange('output_schema', e.target.value)}
                className="w-full min-h-[100px] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-colors resize-y"
                style={{ backgroundColor: "var(--theme-bg)", border: "1px solid #2563eb", color: "var(--theme-text)" }}
                placeholder='{
  "key": "value"
}'
              />
            </div>
          </>
        )}
      </div>
      
      <div className="pt-3 mt-3 border-t shrink-0 opacity-50" style={{ borderColor: "#2563eb" }}>
         <div className="text-[10px] text-center">ID: {selectedNode.id}</div>
      </div>
    </div>
  );
}
