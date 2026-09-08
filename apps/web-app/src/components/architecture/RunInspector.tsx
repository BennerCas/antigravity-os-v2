import React, { useState, useEffect } from 'react';

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

  // MOCK FETCH - In a real app, this would poll or use WebSockets from backend/routers/runs.py
  useEffect(() => {
    // Polling simulation
    const interval = setInterval(() => {
      // Simulate fetching events for the runId
      // fetch(`/api/v1/runs/${runId}/events`).then(...)
    }, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    // Real implementation: POST /api/v1/runs/tasks/${taskId}/resolve
    alert(`Task ${taskId} resolved with action: ${action}`);
    setActiveTask(null);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Event Timeline */}
      <div className="w-1/2 border-r border-gray-800 p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-200 border-b border-gray-800 pb-2">
          Run Inspector Timeline <span className="text-xs text-gray-500 font-mono ml-2">[{runId}]</span>
        </h2>
        
        {events.length === 0 ? (
          <div className="text-gray-500 text-sm">Esperando eventos de ejecución...</div>
        ) : (
          <div className="space-y-4">
            {events.map((ev, i) => (
              <div key={i} className="flex space-x-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                  {i < events.length - 1 && <div className="w-0.5 h-full bg-gray-800 mt-1"></div>}
                </div>
                <div className="bg-gray-900 p-3 rounded shadow flex-1 border border-gray-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-blue-400">{ev.event_type}</span>
                    <span className="text-xs text-gray-600">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
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
            <p className="text-sm text-gray-400 mb-6">{activeTask.objective}</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => handleAction(activeTask.id, 'reject')}
                className="flex-1 py-2 rounded bg-gray-800 text-gray-300 hover:bg-red-900/50 hover:text-red-400 transition-colors border border-gray-700"
              >
                Rechazar / Abortar
              </button>
              <button 
                onClick={() => handleAction(activeTask.id, 'approve')}
                className="flex-1 py-2 rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors font-bold shadow-lg"
              >
                Aprobar y Continuar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-3">✅</div>
            <p>El flujo se está ejecutando autónomamente.</p>
            <p className="text-sm mt-1">No hay tareas de aprobación pendientes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
