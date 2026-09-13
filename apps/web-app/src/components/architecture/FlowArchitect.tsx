import React, { useState, useEffect } from 'react';
import { ArchitectureSpec } from '../../types/architecture';
import { API_URL } from '../../lib/api';
import { useTTSStore } from '../../lib/ttsStore';

export const FlowArchitect: React.FC = () => {
  const { play, stop, isActive, currentSection } = useTTSStore();
  const [chatHistory, setChatHistory] = useState<{role: string, content: string, suggestedActions?: string[]}[]>(() => {
    try { return JSON.parse(localStorage.getItem('fa_chat_history') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(() => {
    try { const s = localStorage.getItem('fa_analysis'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [blueprint, setBlueprint] = useState<ArchitectureSpec | null>(() => {
    try { const s = localStorage.getItem('fa_blueprint'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [error, setError] = useState<string | null>(null);

  const [models, setModels] = useState<{name: string, source: string}[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  useEffect(() => {
    fetch(`${API_URL}/builder/models`)
      .then(res => res.json())
      .then(data => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(err => console.error('[FlowArchitect] error loading models:', err));
  }, []);

  useEffect(() => {
    try { localStorage.setItem('fa_chat_history', JSON.stringify(chatHistory)); } catch {}
  }, [chatHistory]);

  useEffect(() => {
    if (analysis) { try { localStorage.setItem('fa_analysis', JSON.stringify(analysis)); } catch {} }
  }, [analysis]);

  useEffect(() => {
    if (blueprint) { try { localStorage.setItem('fa_blueprint', JSON.stringify(blueprint)); } catch {} }
  }, [blueprint]);

  const handleClear = () => {
    ['fa_chat_history', 'fa_analysis', 'fa_blueprint'].forEach(k => localStorage.removeItem(k));
    setChatHistory([]);
    setAnalysis(null);
    setBlueprint(null);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleSend = async (overrideInput?: string) => {
    const txt = overrideInput !== undefined ? overrideInput : input;
    if (!txt.trim() || isAnalyzing) return;
    
    setInput('');
    setIsAnalyzing(true);
    setError(null);
    const newMsg = { role: 'user', content: txt };
    const newHistory = [...chatHistory, newMsg];
    setChatHistory(newHistory);

    try {
      const response = await fetch(`${API_URL}/architect/discovery/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversation_history: newHistory,
          model_override: selectedModel
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Error ${response.status}`);
      }
      const data = await response.json();
      setAnalysis(data.analysis);

      // Display the AI's custom conversational reply, or fallback to default
      let aiReply = data.analysis?.reply || `He extraído el objetivo: "${data.analysis?.intent?.goal || 'N/A'}". ¿Quieres que genere el Blueprint o necesitas ajustar algo?`;
      
      // Sanitizar markdown por seguridad (eliminar **, __, *, _)
      aiReply = aiReply.replace(/(\*\*|__)/g, '').replace(/(\*|_)/g, '');

      setChatHistory(h => [...h, {
        role: 'assistant',
        content: aiReply,
        suggestedActions: data.analysis?.suggested_actions || []
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
        body: JSON.stringify({ 
          intent: analysis.intent, 
          requirements: analysis.requirements,
          model_override: selectedModel
        })
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

      const rfNodes = (builderFlow.nodes || []).map((n: any, idx: number) => {
        // Build readable content from config
        const cfg = n.config || {};
        const parts = [];
        if (cfg.role) parts.push(`🎭 Rol:\n${cfg.role}`);
        if (cfg.goal) parts.push(`🎯 Meta:\n${cfg.goal}`);
        if (cfg.instructions) parts.push(`📋 Instrucciones:\n${cfg.instructions}`);
        if (cfg.prompt) parts.push(`💬 Prompt:\n${cfg.prompt}`);
        
        let nodeContent = parts.length > 0 ? parts.join('\n\n') : JSON.stringify(cfg, null, 2);
        if (!nodeContent || nodeContent === '{}') {
           nodeContent = `Instrucciones para ${n.name || n.kind}`;
        }

        let nodeType = 'mainPrompt';
        if (n.kind === 'transform' || n.kind === 'decision') {
          nodeType = 'logicaNode';
        } else if (n.kind === 'start' || n.kind === 'end') {
          nodeType = 'actionNode';
        }

        // Distributed Layout: 3 nodes per row
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const xPos = 150 + (col * 450);
        const yPos = 250 + (row * 400);

        return {
          id: n.id,
          type: nodeType,
          position: { x: xPos, y: yPos },
          data: {
            title: n.name || n.kind || 'Nodo',
            content: nodeContent,
            role: n.kind || 'architect',
            framework: 'auto',
            llm_model: 'hermes3:8b',
            temperature: 0.7,
          }
        };
      });

      const rfEdges = (builderFlow.edges || []).map((e: any, idx: number) => ({
        id: e.id || `e-${idx}`,
        source: e.from,
        target: e.to,
        sourceHandle: 'sb', // Source Bottom
        targetHandle: 'tt', // Target Top
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
      <div className="w-1/3 min-w-0 flex-shrink-0 flex flex-col border-r border-gray-700">
        <div className="p-4 bg-gray-800 font-bold border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">🏗️</span> FlowArchitect Discovery
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="bg-gray-900 text-xs text-gray-300 border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
              title="Elige el modelo de IA para chatear y generar"
            >
              {models.length === 0 && <option value="gpt-4o">gpt-4o</option>}
              {models.map(m => (
                <option key={m.name} value={m.name}>{m.name} ({m.source})</option>
              ))}
            </select>
            {(chatHistory.length > 0 || analysis || blueprint) && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-900/20"
                title="Limpiar sesión"
              >
                🗑️ Limpiar
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          {chatHistory.length === 0 && (

            <div className="text-gray-500 text-sm text-center mt-8">
              <div className="text-3xl mb-3">💬</div>
              <p>Describe la aplicación o flujo que quieres construir.</p>
              <p className="mt-1 text-xs">El FlowArchitect analizará tus requisitos y generará un blueprint.</p>
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600/80 ml-8' : 'bg-gray-700 mr-8'} group relative`}>
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-400 font-mono uppercase tracking-wider">{msg.role}</div>
                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => {
                      const sectionName = `FlowArchitect - Mensaje ${idx + 1}`;
                      if (isActive && currentSection === sectionName) {
                        stop();
                      } else {
                        play(msg.content, sectionName);
                      }
                    }}
                    className={`text-gray-400 hover:text-white transition-colors p-1 rounded-full flex items-center justify-center w-6 h-6 ${isActive && currentSection === 'FlowArchitect - Mensaje ' + (idx + 1) ? 'opacity-100 bg-blue-600' : 'opacity-50 group-hover:opacity-100 hover:bg-gray-600'}`}
                    title={isActive && currentSection === 'FlowArchitect - Mensaje ' + (idx + 1) ? "Detener audio" : "Reproducir audio"}
                  >
                    {isActive && currentSection === 'FlowArchitect - Mensaje ' + (idx + 1) ? '⏹️' : '🔊'}
                  </button>
                )}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              
              {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && idx === chatHistory.length - 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action, actionIdx) => (
                    <button
                      key={actionIdx}
                      onClick={() => {
                        if (action.toLowerCase().includes('generar blueprint') || action.toLowerCase().includes('generar el blueprint')) {
                          generateBlueprint();
                        } else {
                          handleSend(action);
                        }
                      }}
                      className="text-xs font-medium bg-blue-900/40 hover:bg-blue-600/80 text-blue-200 hover:text-white border border-blue-700/50 rounded-full px-3 py-1.5 transition-colors text-left"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
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
            onClick={() => handleSend()}
            disabled={isAnalyzing || !input.trim()}
            className="bg-blue-600 px-4 rounded-r font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Right panel: Analysis and Blueprint */}
      <div className="w-2/3 min-w-0 flex-shrink-0 flex flex-col">
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
        <div className="flex-1 overflow-hidden p-6 flex space-x-6">
          
          {/* Column 2: Intent & Requirements */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-yellow-400">🎯</span> Intent & Requirements
            </h3>
            <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`
                div::-webkit-scrollbar { display: none; }
              `}</style>
              {analysis ? (
                <pre className="text-xs text-green-400 leading-relaxed whitespace-pre-wrap break-words">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500 text-sm mt-4">El análisis aparecerá aquí luego de chatear.</div>
              )}
            </div>
          </div>

          {/* Column 3: ArchitectureSpec v1 */}
          <div className="flex-1 min-w-0 flex flex-col bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
            <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-blue-400">📐</span> ArchitectureSpec v1
            </h3>
            <div className="flex-1 overflow-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {blueprint ? (
                <pre className="text-xs text-blue-400 leading-relaxed whitespace-pre-wrap break-words">
                  {JSON.stringify(blueprint, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500 text-sm mt-4">El blueprint generado aparecerá aquí.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

