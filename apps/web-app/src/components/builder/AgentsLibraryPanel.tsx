import React, { useState, useEffect } from 'react';
import { X, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import type { BuilderNodeData } from '../../types/builder';

interface AgentsLibraryPanelProps {
  onClose: () => void;
  onAddAgent: (agentData: BuilderNodeData) => void;
  nodeStyle?: string;
}

interface AgentSkill {
  id?: string;
  name: string;
  category?: string;
  description: string;
}

export default function AgentsLibraryPanel({ onClose, onAddAgent }: AgentsLibraryPanelProps) {
  const [agents, setAgents] = useState<AgentSkill[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch((import.meta.env.BASE_URL || '/') + 'skills.json')
      .then(res => res.json())
      .then((data: AgentSkill[]) => {
        setAgents(data);
        const cats = Array.from(new Set(data.map(p => (p.category || 'General').split(' > ')[0]))).sort();
        setCategories(cats);
      })
      .catch(console.error);
  }, []);

  const customPanelStyle: React.CSSProperties = {
    backgroundColor: "var(--theme-card)",
    borderColor: "var(--theme-border)",
    color: "var(--theme-text)"
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = (agent.name || '').toLowerCase().includes(search.toLowerCase()) || (agent.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter ? agent.category?.startsWith(categoryFilter) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div 
      className="w-full h-full flex-grow flex flex-col overflow-hidden min-h-0 transition-all duration-300 border-r-2 border-t-2 border-b-2 rounded-tr-2xl rounded-br-2xl shadow-2xl p-5 pointer-events-auto"
      style={customPanelStyle}
    >
      <div className="flex justify-between items-center mb-2 shrink-0">
        <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
          🤖 Catálogo de Agentes ({filteredAgents.length})
        </h3>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
          <X size={18} />
        </button>
      </div>
      <p className="text-xs opacity-70 mb-5 shrink-0 leading-relaxed">
        Haz clic en cualquier agente para agregarlo al lienzo como un nodo. Podrás conectarlo con otros nodos para orquestar flujos de trabajo.
      </p>

      <div className="flex flex-col gap-3 shrink-0 mb-4">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            placeholder="Buscar agente..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}
          />
        </div>
        <div className="relative">
          <Funnel size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none appearance-none cursor-pointer"
            style={{ backgroundColor: "var(--theme-bg)", border: "1px solid var(--theme-border)", color: "var(--theme-text)" }}
          >
            <option value="">Todas las Categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2 pl-2 pb-4 pt-1 -mx-2">
        {filteredAgents.map((agent, i) => (
          <div 
            key={i} 
            className="p-3 rounded-xl border border-transparent hover:border-[var(--theme-border)] cursor-pointer transition-all hover:translate-x-1 hover:shadow-md"
            style={{ backgroundColor: "var(--theme-bg)" }}
            onClick={() => onAddAgent({
              title: agent.name,
              content: agent.description,
              role: 'Asistente IA',
              category: agent.category
            })}
          >
            <div className="text-[10px] uppercase font-bold opacity-60 mb-1 truncate">{agent.category?.split(' > ')[0] || 'General'}</div>
            <h4 className="font-bold text-sm mb-1 leading-tight">{agent.name}</h4>
            <p className="text-xs opacity-70 line-clamp-2">{agent.description}</p>
          </div>
        ))}
        {filteredAgents.length === 0 && (
          <div className="text-center opacity-50 text-sm py-10">No se encontraron agentes</div>
        )}
      </div>
    </div>
  );
}
