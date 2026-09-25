import React from 'react';
import { ClockCounterClockwise, Trash, CheckCircle } from '@phosphor-icons/react';
import { useStudioStore } from '../stores/useStudioStore';
import { useHistoryStore } from '../stores/useHistoryStore';

export default function AgentOSHistory() {
  const { historyItems, deleteHistoryItem, loadHistoryItem } = useHistoryStore();

  return (
    <div className="flex-1 flex flex-col p-8 bg-[#030712] relative overflow-hidden h-full">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 shrink-0">
          <ClockCounterClockwise size={28} className="text-purple-500" weight="duotone" />
          Registro de Flujos (Time Travel)
        </h2>
        
        {!historyItems || historyItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
            <ClockCounterClockwise size={48} weight="thin" className="mb-4 opacity-50" />
            <p className="text-sm">No hay flujos guardados aún.</p>
            <p className="text-xs opacity-70 mt-1">Los flujos se guardan automáticamente durante el proceso.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyItems.map(item => (
                <div key={item.id} className="p-5 rounded-xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-800 transition-colors flex flex-col gap-3 relative group">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-white leading-snug break-words pr-6">{item.flowName}</h3>
                    <button onClick={() => deleteHistoryItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 absolute top-4 right-4">
                      <Trash size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{item.theme}</p>
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                     {item.detectedAgents?.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{a}</span>
                     ))}
                     {item.detectedAgents && item.detectedAgents.length > 3 && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">+{item.detectedAgents.length - 3}</span>}
                  </div>
                  <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-3">
                    <span className="text-[10px] text-zinc-500">{new Date(item.updatedAt).toLocaleString()}</span>
                    <button 
                      onClick={() => {
                        loadHistoryItem(item.id, (snapshot) => {
                          useStudioStore.setState({
                            ...snapshot
                          });
                          alert('Flujo restaurado con éxito. Revisa el chat y el InfinityBoard.');
                        });
                      }}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Restaurar <CheckCircle size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
