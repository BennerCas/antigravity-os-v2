import React, { useState } from 'react';
import { ArchitectureSpec } from '../../types/architecture';

export const FlowArchitect: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [blueprint, setBlueprint] = useState<ArchitectureSpec | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', content: input }];
    setChatHistory(newHistory);
    setInput('');
    setIsAnalyzing(true);

    try {
      const response = await fetch('http://127.0.0.1:8001/api/v1/architect/discovery/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_history: newHistory })
      });
      const data = await response.json();
      setAnalysis(data.analysis);
      
      // Auto-reply from Architect
      setChatHistory(h => [...h, { 
        role: 'assistant', 
        content: `Entendido. He extraído el objetivo: "${data.analysis.intent.goal}". ¿Quieres que genere el Blueprint o necesitas ajustar algo?` 
      }]);
    } catch (error) {
      console.error(error);
      setChatHistory(h => [...h, { role: 'assistant', content: "Error al procesar la solicitud." }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateBlueprint = async () => {
    if (!analysis) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/v1/architect/blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: analysis.intent, requirements: analysis.requirements })
      });
      const data = await response.json();
      setBlueprint(data.spec);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const publishToBuilder = async () => {
    if (!blueprint) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://127.0.0.1:8001/api/v1/architect/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec_data: blueprint })
      });
      const data = await response.json();
      alert("Blueprint transferido al BuilderFlow: " + data.builder_flow.id);
      // Aqui integrariamos con React Router para llevar al usuario al Builder
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-900 text-white">
      {/* Left panel: Discovery Chat */}
      <div className="w-1/3 flex flex-col border-r border-gray-700">
        <div className="p-4 bg-gray-800 font-bold border-b border-gray-700">
          FlowArchitect Discovery
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 ml-8' : 'bg-gray-700 mr-8'}`}>
              <div className="text-xs text-gray-400 mb-1">{msg.role.toUpperCase()}</div>
              <div>{msg.content}</div>
            </div>
          ))}
          {isAnalyzing && <div className="text-gray-400 text-sm">Analizando...</div>}
        </div>
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex">
          <input 
            type="text" 
            className="flex-1 bg-gray-900 border border-gray-700 rounded-l px-3 py-2 text-white" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe la aplicación o flujo..."
          />
          <button onClick={handleSend} className="bg-blue-600 px-4 rounded-r font-bold hover:bg-blue-500">Enviar</button>
        </div>
      </div>

      {/* Right panel: Analysis and Blueprint */}
      <div className="w-2/3 flex flex-col">
        <div className="p-4 bg-gray-800 font-bold border-b border-gray-700 flex justify-between">
          <span>Architecture Blueprint</span>
          <div>
            {analysis && !blueprint && (
              <button onClick={generateBlueprint} className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-500">
                Generar Blueprint
              </button>
            )}
            {blueprint && (
              <button onClick={publishToBuilder} className="bg-purple-600 px-3 py-1 rounded text-sm hover:bg-purple-500 ml-2">
                Exportar a Builder
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex space-x-6">
          <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2">Intent & Requirements</h3>
            {analysis ? (
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-sm">El análisis aparecerá aquí luego de chatear.</div>
            )}
          </div>
          <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2">ArchitectureSpec v1</h3>
            {blueprint ? (
              <pre className="text-xs text-blue-400 overflow-x-auto">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-sm">El blueprint generado aparecerá aquí.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
