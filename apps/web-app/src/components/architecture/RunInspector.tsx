import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../lib/api';

interface RunEvent {
  id: string;
  event_type: string;
  timestamp: string;
  payload: any;
}

interface ApprovalTask {
  id: string;
  run_id: string;
  pending_node_id: string;
  status: string;
  title: string;
  objective: string;
}

export const RunInspector: React.FC<{ runId: string }> = ({ runId }) => {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [activeTask, setActiveTask] = useState<ApprovalTask | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [humanInput, setHumanInput] = useState('');
  const [isResuming, setIsResuming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Usar WS_EXECUTE_URL del entorno o derivarlo de API_URL
    const wsBase = API_URL.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/ws/execute`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          console.log('[RunInspector] WebSocket connected to', wsUrl);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const newEvent: RunEvent = {
              id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              event_type: data.type || 'update',
              timestamp: new Date().toISOString(),
              payload: data.data || data,
            };
            setEvents(prev => [...prev, newEvent]);

            // Si el backend notifica un nodo humano pendiente
            if (data.type === 'paused' && data.pending_node) {
              setActiveTask({
                id: data.thread_id || runId,
                run_id: runId,
                pending_node_id: data.pending_node,
                status: 'pending',
                title: `Revisión requerida: ${data.pending_node}`,
                objective: data.message || 'El flujo requiere aprobación humana para continuar.',
              });
            }
          } catch (e) {
            console.error('[RunInspector] parse error:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
        };

        ws.onerror = (err) => {
          console.error('[RunInspector] WebSocket error:', err);
          setIsConnected(false);
        };
      } catch (e) {
        console.error('[RunInspector] Failed to connect:', e);
      }
    };

    connect();

    // También cargar el último resultado desde localStorage para mostrar contexto
    try {
      const stored = localStorage.getItem('builder_run_results');
      if (stored) {
        const results = JSON.parse(stored);
        if (results.length > 0) {
          const latest = results[0];
          setEvents([{
            id: `evt-init-${latest.id}`,
            event_type: 'completed',
            timestamp: latest.created_at || new Date().toISOString(),
            payload: { status: latest.status, result: latest.result_text?.slice(0, 200) + '...' },
          }]);
        }
      }
    } catch (e) {
      console.error('[RunInspector] localStorage read error:', e);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [runId]);

  // Auto-scroll al último evento
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    setIsResuming(true);
    try {
      const res = await fetch(`${API_URL}/engine/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: taskId,
          user_input: action === 'approve' ? (humanInput || 'Aprobado') : 'Rechazado — abortar flujo'
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al reanudar');
      }
      const data = await res.json();
      setEvents(prev => [...prev, {
        id: `evt-resume-${Date.now()}`,
        event_type: action === 'approve' ? 'resumed' : 'aborted',
        timestamp: new Date().toISOString(),
        payload: { action, response: data }
      }]);
      setActiveTask(null);
      setHumanInput('');
    } catch (err: any) {
      console.error('[RunInspector] resume error:', err);
      setEvents(prev => [...prev, {
        id: `evt-err-${Date.now()}`,
        event_type: 'error',
        timestamp: new Date().toISOString(),
        payload: { error: err.message }
      }]);
    } finally {
      setIsResuming(false);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'update': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'resumed': return 'bg-purple-500';
      case 'aborted': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-full w-full bg-gray-950 text-white">
      {/* Event Timeline */}
      <div className="w-1/2 border-r border-gray-800 p-6 overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-2">
          <h2 className="text-xl font-bold text-gray-200">
            Run Inspector Timeline
            {runId !== 'no-run' && (
              <span className="text-xs text-gray-500 font-mono ml-2">[{runId.slice(0, 12)}...]</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs text-gray-500">{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="text-gray-500 text-sm flex flex-col items-center justify-center flex-1">
            <div className="text-3xl mb-3">📡</div>
            <p>Esperando eventos de ejecución...</p>
            <p className="text-xs mt-1">Ejecuta un flujo desde FlowBoard para ver la traza aquí.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev, i) => (
              <div key={ev.id} className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${getEventColor(ev.event_type)}`} />
                  {i < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-800 mt-1 min-h-4" />}
                </div>
                <div className="bg-gray-900 p-3 rounded shadow flex-1 border border-gray-800 mb-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold text-xs uppercase tracking-wider ${
                      ev.event_type === 'error' ? 'text-red-400' :
                      ev.event_type === 'completed' ? 'text-green-400' :
                      ev.event_type === 'paused' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`}>{ev.event_type}</span>
                    <span className="text-xs text-gray-600 font-mono">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-xs text-gray-400 overflow-x-auto leading-relaxed">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
            <div ref={eventsEndRef} />
          </div>
        )}
      </div>

      {/* HITL / Task Resolution Panel */}
      <div className="w-1/2 p-6 flex flex-col items-center justify-center">
        {activeTask ? (
          <div className="bg-gray-900 p-6 rounded-xl border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)] max-w-md w-full">
            <div className="flex items-center space-x-2 text-purple-400 mb-4">
              <span className="animate-pulse">🔴</span>
              <h3 className="font-bold">Human-in-the-Loop Requerido</h3>
            </div>

            <h4 className="text-xl font-bold text-white mb-2">{activeTask.title}</h4>
            <p className="text-sm text-gray-400 mb-4">{activeTask.objective}</p>

            <textarea
              className="w-full h-20 p-2 bg-black/40 border border-gray-700 text-white rounded-lg text-sm outline-none focus:border-purple-500 mb-4 resize-none"
              placeholder="Feedback opcional para el agente..."
              value={humanInput}
              onChange={e => setHumanInput(e.target.value)}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => handleAction(activeTask.id, 'reject')}
                disabled={isResuming}
                className="flex-1 py-2 rounded bg-gray-800 text-gray-300 hover:bg-red-900/50 hover:text-red-400 transition-colors border border-gray-700 disabled:opacity-40 text-sm font-medium"
              >
                Rechazar / Abortar
              </button>
              <button
                onClick={() => handleAction(activeTask.id, 'approve')}
                disabled={isResuming}
                className="flex-1 py-2 rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors font-bold shadow-lg disabled:opacity-40 text-sm"
              >
                {isResuming ? '⏳ Enviando...' : 'Aprobar y Continuar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-400">El flujo se está ejecutando autónomamente.</p>
            <p className="text-sm mt-1">No hay tareas de aprobación pendientes.</p>
            {isConnected && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Escuchando eventos en tiempo real
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
