import React, { useState, useEffect } from 'react';
import { Play, Translate, Pause, StopCircle, CheckCircle, Clock } from '@phosphor-icons/react';
import { useTTSStore } from '../../lib/ttsStore';
import { API_URL } from '../../lib/api';

// Example type for an execution result
export interface ExecutionRecord {
  id: string;
  run_id: string;
  status: 'completed' | 'failed' | 'running';
  result_text: string;
  created_at: string;
}

export const RunResults: React.FC = () => {
  const [results, setResults] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const { play, pause, stop, isActive, isPaused, currentSection } = useTTSStore();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // Fuente primaria: localStorage donde Builder guarda cada ejecución completada
      const stored = localStorage.getItem('builder_run_results');
      if (stored) {
        setResults(JSON.parse(stored));
      } else {
        setResults([]);
      }
    } catch (e) {
      console.error('[RunResults] Error leyendo resultados:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (id: string, text: string) => {
    setTranslatingId(id);
    try {
      const res = await fetch(`${API_URL}/engine/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: `Traduce el siguiente texto al español de forma natural: "${text}"` }] 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResults(prev => prev.map(r => r.id === id ? { ...r, result_text: data.reply || data.response || text } : r));
      }
    } catch (e) {
      console.error("Error al traducir:", e);
    } finally {
      setTranslatingId(null);
    }
  };

  const handlePlayTTS = (id: string, text: string) => {
    if (isActive && currentSection === `result-${id}`) {
      if (isPaused) play(text, `result-${id}`);
      else pause();
    } else {
      stop();
      play(text, `result-${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--surface-canvas)] text-[var(--text-primary)] p-6 overflow-y-auto">
      <div className="flex justify-between items-center border-b border-[var(--stroke-subtle)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <CheckCircle weight="fill" className="text-emerald-500" />
            Resultados Finales
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Historial de ejecuciones completadas del grafo y sus outputs correspondientes.
          </p>
        </div>
        <button 
          onClick={fetchResults}
          className="px-4 py-2 bg-[var(--surface-card)] hover:bg-[var(--surface-elevated)] border border-[var(--stroke-subtle)] text-[var(--text-primary)] rounded-lg text-sm transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* AI Prompts Toolbar */}
      <div className="py-2 mb-6 border-b border-[var(--stroke-subtle)] flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase text-[var(--text-secondary)] font-bold mr-2 whitespace-nowrap">QA & Eval Tools:</span>
        {[
          { id: 'testgen', label: 'Test Scenario Generator', icon: '🧪', desc: 'Genera escenarios de prueba comprensivos basados en los resultados.' },
          { id: 'evaluator', label: 'Output Evaluator', icon: '⚖️', desc: 'Evalúa la calidad del output generado usando métricas avanzadas.' }
        ].map(p => (
          <button
            key={p.id}
            className="whitespace-nowrap text-[10px] px-2 py-1 bg-[var(--surface-elevated)] border border-gray-700 rounded text-[var(--text-primary)] hover:bg-emerald-900/40 hover:text-emerald-300 hover:border-emerald-700 transition-all"
            onClick={() => {}}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-[var(--text-secondary)]">
          <Clock size={48} className="mb-4 opacity-50" />
          <p>No hay resultados de ejecuciones todavía.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((item) => (
            <div key={item.id} className="bg-[var(--surface-canvas)] border border-[var(--stroke-subtle)] rounded-xl p-5 shadow-sm hover:border-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-md uppercase tracking-wider">
                    {item.status}
                  </div>
                  <span className="text-[var(--text-secondary)] text-sm font-mono">{item.run_id}</span>
                </div>
                <span className="text-[var(--text-secondary)] text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className="bg-[var(--surface-card)] border border-[#1A1A1A] p-4 rounded-lg text-[var(--text-primary)] text-sm leading-relaxed mb-4">
                {item.result_text}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePlayTTS(item.id, item.result_text)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive && currentSection === `result-${item.id}` && !isPaused
                      ? 'bg-blue-900/30 text-blue-400 border border-blue-800'
                      : 'bg-[var(--surface-elevated)] hover:bg-[#252525] text-[var(--text-primary)] border border-[var(--stroke-subtle)]'
                  }`}
                >
                  {isActive && currentSection === `result-${item.id}` && !isPaused ? (
                    <><Pause weight="fill" /> Pausar</>
                  ) : (
                    <><Play weight="fill" /> Escuchar TTS</>
                  )}
                </button>
                {isActive && currentSection === `result-${item.id}` && (
                  <button
                    onClick={stop}
                    className="flex items-center justify-center p-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg border border-red-900/30"
                    title="Detener TTS"
                  >
                    <StopCircle weight="fill" size={18} />
                  </button>
                )}
                
                <button
                  onClick={() => handleTranslate(item.id, item.result_text)}
                  disabled={translatingId === item.id}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[var(--surface-elevated)] hover:bg-[#252525] text-[var(--text-primary)] border border-[var(--stroke-subtle)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {translatingId === item.id ? (
                    <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> Traduciendo...</>
                  ) : (
                    <><Translate weight="bold" /> Traducir a ES</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
