import React from 'react';
import { useStudioStore } from '../../stores/useStudioStore';
import { CheckCircle, XCircle, Clock, Info, ListChecks, ArrowRight, Target, Brain, Robot } from '@phosphor-icons/react';

export const SwarmOrchestrationPanel: React.FC = () => {
  const { activityLogs, zone2ActiveTab, setZone2ActiveTab } = useStudioStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'REJECTED': return <XCircle size={16} className="text-red-400" />;
      case 'PENDING': return <Clock size={16} className="text-amber-400" />;
      default: return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="w-full h-full flex bg-[#050505] text-gray-200">
      
      {/* ZONE 1: Activity Log */}
      <div className="w-1/3 h-full border-r border-zinc-800 flex flex-col bg-[#080808]">
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
            <Robot size={16} weight="duotone" className="text-cyan-400" /> Activity Log
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
          {activityLogs.map(log => (
            <div key={log.id} className="flex flex-col gap-1 pb-3 border-b border-zinc-800/50">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="font-bold text-zinc-300">[{log.source}]</span>
                <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 shrink-0">{getStatusIcon(log.status)}</div>
                <span className="leading-relaxed text-zinc-300">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ZONE 2: Results Panel */}
      <div className="w-2/3 h-full flex flex-col bg-[#0a0a0a]">
        
        {/* Sandwich Menu */}
        <div className="flex border-b border-zinc-800 shrink-0 p-2 gap-2 bg-[#050505]">
          <button 
            onClick={() => setZone2ActiveTab('okr')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'okr' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Target size={16} /> OKR's & Checklist
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase1')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Fase 1: Triage
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase2')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase2' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Fase 2: Extracción
          </button>
          <button 
            onClick={() => setZone2ActiveTab('phase3')}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${zone2ActiveTab === 'phase3' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Fase 3: Blueprint
          </button>
        </div>

        {/* Content Area (Invisible Scroll) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {zone2ActiveTab === 'okr' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-light text-white mb-2">Objetivo Principal</h2>
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-300">
                  Esperando definición de intención por parte del usuario...
                </div>
              </div>
              
              <div>
                <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                  <ListChecks size={24} className="text-cyan-400" /> Checklist de Enjambres
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-zinc-900 shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Fase 1: Entrevista de Triage completada</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-zinc-900 shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Fase 2: Cuestionario Técnico resuelto</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-zinc-900 shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Fase 3: Arquitectura y Nodos validados</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-black/40">
                    <div className="w-5 h-5 rounded border border-zinc-600 flex items-center justify-center bg-zinc-900 shrink-0"></div>
                    <span className="text-sm font-medium text-zinc-400">Aprobación Final y Ensamblaje (Match & Fuse)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {zone2ActiveTab === 'phase1' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center pt-20">
              <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
              <h2 className="text-xl text-zinc-500 font-light">Fase 1 inactiva</h2>
              <p className="text-sm text-zinc-600">AureliOS está esperando tu petición en el chat para desplegar al Enjambre 1.</p>
            </div>
          )}

          {zone2ActiveTab === 'phase2' && (
             <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center pt-20">
              <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
              <h2 className="text-xl text-zinc-500 font-light">Fase 2 inactiva</h2>
              <p className="text-sm text-zinc-600">Requiere la aprobación de la Fase 1 para generar el Cuestionario Avanzado.</p>
            </div>
          )}

          {zone2ActiveTab === 'phase3' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-center pt-20">
              <Brain size={48} className="mx-auto text-zinc-700 mb-4" weight="duotone" />
              <h2 className="text-xl text-zinc-500 font-light">Fase 3 inactiva</h2>
              <p className="text-sm text-zinc-600">Requiere el Contrato I/O del Enjambre 1 para diseñar la Arquitectura (Nodos y Animaciones).</p>
            </div>
          )}

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};
