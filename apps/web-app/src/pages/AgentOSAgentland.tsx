import { useState } from 'react';
import { Brain, MagnifyingGlass, Funnel, Trash, Heartbeat, ShieldCheck, PaintBrush } from '@phosphor-icons/react';
import { useStudioStore } from '../stores/useStudioStore';

export default function AgentOSAgentland() {
  const { agentCards, setAgentCards } = useStudioStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  
  const filteredCards = agentCards.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthBadge = (health?: string) => {
    switch (health) {
      case 'green':
        return <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Heartbeat size={12}/> SALUDABLE</span>;
      case 'yellow':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Heartbeat size={12}/> ADVERTENCIA</span>;
      case 'red':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Heartbeat size={12}/> CRÍTICO</span>;
      default:
        return <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded text-[10px] font-bold">PENDIENTE</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#030712] text-[#E0E0E0] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <Brain size={28} className="text-[#00D9FF]" weight="duotone" />
            Bóveda Genómica (Agentland)
          </h1>
          <p className="text-sm text-gray-400">Administra y evalúa los agentes sintetizados en tu ecosistema.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f1115] border border-[#222] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#444] transition-colors w-64"
            />
          </div>
          <button className="bg-[#0f1115] border border-[#222] p-2 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Funnel size={18} />
          </button>
          
          <button 
            onClick={() => setMemoryEnabled(!memoryEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold tracking-widest transition-all ${memoryEnabled ? 'bg-[#0f1115] border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-[#0f1115] border-[#222] text-gray-500 hover:text-gray-300'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${memoryEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            PERSISTENCIA DE MEMORIA
          </button>
        </div>
      </div>


      {/* SECCIN GOD-TIER & AURELIOS (Placeholder) */}
      <div className="shrink-0 mb-6 border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-yellow-500" weight="duotone" />
            <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Pantheon: God-Tier Agents & AureliOS</h2>
          </div>
          <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">ESTADO: PENDIENTE DE SNTESIS</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 relative z-10">
          {/* AureliOS Placeholder */}
          <div className="min-w-[220px] h-[100px] border border-blue-500/30 bg-blue-500/10 rounded-lg flex items-center justify-center flex-col gap-2 opacity-60 border-dashed">
            <Brain size={24} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-bold tracking-wider">AureliOS (Core)</span>
          </div>

          {/* God-Tier Placeholders */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="min-w-[140px] h-[100px] border border-white/10 bg-white/5 rounded-lg flex items-center justify-center flex-col gap-2 opacity-40 border-dashed">
              <span className="text-[10px] text-gray-500 font-mono">SLOT-{String(i+1).padStart(2, '0')}</span>
              <span className="text-xs text-gray-400 font-bold">God-Tier Agent</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {filteredCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <Brain size={48} weight="thin" className="mb-4 opacity-20" />
            <p className="text-lg mb-2">No hay agentes en la bóveda</p>
            <p className="text-sm opacity-50">Sintetiza agentes en el Studio para verlos aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((agent) => (
              <div key={agent.id} className="bg-[#0a0c10] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all flex flex-col h-[320px] group relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: agent.color || '#3b82f6' }} />
                
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10" style={{ background: agent.color + '22' }}>
                      <Brain size={16} weight="bold" style={{ color: agent.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[140px] leading-tight">{agent.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: agent.color }}>{agent.role}</p>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-white transition-colors" onClick={() => {
                    if (confirm('¿Eliminar agente de la bóveda?')) {
                      setAgentCards(agentCards.filter(a => a.id !== agent.id));
                    }
                  }}>
                    <Trash size={16} />
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-2 relative z-10">
                  {getHealthBadge(agent.health)}
                  {agent.evalStatus === 'PASS' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><ShieldCheck size={12}/> EVAL PASS</span>}
                  {memoryEnabled && <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">MEMORIA ACTIVA</span>}
                </div>

                <p className="text-xs text-gray-400 mb-4 line-clamp-3 flex-1 relative z-10 leading-relaxed">
                  {agent.description}
                </p>

                <div className="space-y-3 relative z-10 mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase w-16">Herram.</span>
                    <div className="flex gap-1 overflow-hidden">
                      {agent.requiredTools?.slice(0,2).map(t => (
                        <span key={t} className="text-[9px] bg-[#1e293b] text-gray-300 px-1.5 py-0.5 rounded truncate max-w-[80px] border border-white/5">{t}</span>
                      ))}
                      {agent.requiredTools && agent.requiredTools.length > 2 && (
                        <span className="text-[9px] bg-transparent text-gray-500 px-1 py-0.5">+{agent.requiredTools.length - 2}</span>
                      )}
                      {(!agent.requiredTools || agent.requiredTools.length === 0) && <span className="text-[9px] text-gray-600 font-mono">NINGUNA</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase w-16">Genética</span>
                    <div className="flex gap-1 overflow-hidden">
                      {agent.genes?.slice(0,3).map(g => (
                        <span key={g.kind} className="text-[9px] border border-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{g.kind}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover overlay button */}
                <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center">
                  <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <PaintBrush size={16} /> Auditar & Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
