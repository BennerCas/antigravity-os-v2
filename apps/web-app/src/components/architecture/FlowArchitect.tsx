import React, { useState } from 'react';
import { ArchitectureSpec } from '../../types/architecture';
import { API_URL } from '../../lib/api';

export const FlowArchitect: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [blueprint, setBlueprint] = useState<ArchitectureSpec | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const newHistory = [...chatHistory, { role: 'user', content: input }];
    setChatHistory(newHistory);
    setInput('');
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/architect/discovery/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_history: newHistory })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }
      const data = await response.json();
      setAnalysis(data.analysis);

      const goal = data.analysis?.intent?.goal || 'Objetivo extraído';
      setChatHistory(h => [...h, {
        role: 'assistant',
        content: `Entendido. He extraído el objetivo: "${goal}". ¿Quieres que genere el Blueprint o necesitas ajustar algo?`
      }]);
    } catch (err: any) {
      console.error('[FlowArchitect] analyze error:', err);
      showError(`Error al analizar: ${err.message}`);
      setChatHistory(h => [...h, { role: 'assistant', content: `Error al procesar la solicitud: ${err.message}` }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateBlueprint = async () => {
    if (!analysis) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/architect/blueprint/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: analysis.intent, requirements: analysis.requirements })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }
      const data = await response.json();
      setBlueprint(data.spec);
    } catch (err: any) {
      console.error('[FlowArchitect] blueprint error:', err);
      showError(`Error generando blueprint: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const publishToBuilder = async () => {
    if (!blueprint) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/architect/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec_data: blueprint })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }
      const data = await response.json();
      const builderFlow = data.builder_flow;

      // Convertir el builder_flow del backend al formato ReactFlow para FlowBoard
      const rfNodes = (builderFlow.nodes || []).map((n: any, idx: number) => ({
        id: n.id,
        type: 'mainPrompt',
        position: n.ui?.position || { x: 150 + idx * 380, y: 250 },
        data: {
          title: n.name || n.kind || 'Nodo',
          content: JSON.stringify(n.config || {}, null, 2),
          role: n.kind || 'architect',
          framework: 'auto',
          llm_model: 'hermes3:8b',
          temperature: 0.7,
        }
      }));

      const rfEdges = (builderFlow.edges || []).map((e: any, idx: number) => ({
        id: e.id || `e-${idx}`,
        source: e.from,
        target: e.to,
        animated: true,
        label: e.label || undefined,
        style: { stroke: '#3b82f6', strokeWidth: 2 }
      }));

      // Inyectar al FlowBoard via el bridge de eventos (builderBridge)
      window.dispatchEvent(new CustomEvent('builder:inject', {
        detail: { templateFlow: { nodes: rfNodes, edges: rfEdges } }
      }));

      setChatHistory(h => [...h, {
        role: 'assistant',
        content: `✅ Blueprint "${builderFlow.id}" transferido al FlowBoard. Cambia a la pestaña FlowBoard para verlo.`
      }]);
    } catch (err: any) {
      console.error('[FlowArchitect] publish error:', err);
      showError(`Error al exportar: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-900 text-white relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/95 text-white text-sm px-5 py-2.5 rounded-xl shadow-2xl backdrop-blur-sm border border-red-500/50">
          ⚠️ {error}
        </div>
      )}

      {/* Left panel: Discovery Chat */}
      <div className="w-1/3 flex flex-col border-r border-gray-700">
        <div className="p-4 bg-gray-800 font-bold border-b border-gray-700 flex items-center gap-2">
          <span className="text-blue-400">🏗️</span> FlowArchitect Discovery
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="text-gray-500 text-sm text-center mt-8">
              <div className="text-3xl mb-3">💬</div>
              <p>Describe la aplicación o flujo que quieres construir.</p>
              <p className="mt-1 text-xs">El FlowArchitect analizará tus requisitos y generará un blueprint.</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600/80 ml-8' : 'bg-gray-700 mr-8'}`}>
              <div className="text-xs text-gray-400 mb-1 font-mono uppercase tracking-wider">{msg.role}</div>
              <div className="text-sm leading-relaxed">{msg.content}</div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Analizando con IA...
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-l px-3 py-2 text-white text-sm outline-none focus:border-blue-500 transition-colors"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleSend()}
            placeholder="Describe la aplicación o flujo..."
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSend}
            disabled={isAnalyzing || !input.trim()}
            className="bg-blue-600 px-4 rounded-r font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Right panel: Analysis and Blueprint */}
      <div className="w-2/3 flex flex-col">
        <div className="p-4 bg-gray-800 font-bold border-b border-gray-700 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="text-green-400">🗺️</span> Architecture Blueprint
          </span>
          <div className="flex gap-2">
            {analysis && !blueprint && (
              <button
                onClick={generateBlueprint}
                disabled={isAnalyzing}
                className="bg-green-600 px-3 py-1.5 rounded text-sm font-bold hover:bg-green-500 disabled:opacity-40 transition-colors"
              >
                {isAnalyzing ? '⏳ Generando...' : '⚡ Generar Blueprint'}
              </button>
            )}
            {blueprint && (
              <button
                onClick={publishToBuilder}
                disabled={isAnalyzing}
                className="bg-purple-600 px-3 py-1.5 rounded text-sm font-bold hover:bg-purple-500 disabled:opacity-40 transition-colors ml-2"
              >
                {isAnalyzing ? '⏳ Exportando...' : '🚀 Enviar a FlowBoard'}
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex space-x-6">
          <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2">
              <span className="text-yellow-400">🎯</span> Intent & Requirements
            </h3>
            {analysis ? (
              <pre className="text-xs text-green-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-sm mt-4">El análisis aparecerá aquí luego de chatear.</div>
            )}
          </div>
          <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2">
              <span className="text-blue-400">📐</span> ArchitectureSpec v1
            </h3>
            {blueprint ? (
              <pre className="text-xs text-blue-400 overflow-x-auto leading-relaxed">
                {JSON.stringify(blueprint, null, 2)}
              </pre>
            ) : (
              <div className="text-gray-500 text-sm mt-4">El blueprint generado aparecerá aquí.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
