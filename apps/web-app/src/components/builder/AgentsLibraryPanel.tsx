import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MagnifyingGlass, Robot, ArrowClockwise, Sparkle } from '@phosphor-icons/react';
import type { BuilderNodeData } from '../../types/builder';
import { API_URL } from '../../lib/api';

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
  source?: string;
  score?: number;
}

export default function AgentsLibraryPanel({ onClose, onAddAgent }: AgentsLibraryPanelProps) {
  const [allAgents, setAllAgents] = useState<AgentSkill[]>([]);
  const [filtered, setFiltered] = useState<AgentSkill[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | 'idle'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all agents once for fallback
  useEffect(() => {
    fetch((import.meta.env.BASE_URL || '/') + 'skills.json')
      .then(res => res.json())
      .then((data: AgentSkill[]) => {
        setAllAgents(data);
        // Do not auto-populate filtered list when empty (matching Prompts panel behavior)
      })
      .catch(console.error);
  }, []);

  const runSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFiltered([]);
      setSearchMode('idle');
      return;
    }
    
    setIsLoading(true);

    // Try semantic search first
    const semanticUrl = API_URL + '/semantic/search?q=' + encodeURIComponent(query) + '&top_k=40&type=skill';
    fetch(semanticUrl)
      .then(res => {
        if (!res.ok) throw new Error('semantic unavailable');
        return res.json();
      })
      .then((data: any) => {
        let results: AgentSkill[] = (data.results || []).map((r: any) => ({
          name: r.title,
          category: r.category,
          description: r.content,
          source: r.source,
          score: r.score
        }));
        setFiltered(results.slice(0, 50));
        setSearchMode(data.mode === 'semantic' ? 'semantic' : 'keyword');
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to client-side filtering
        const q = query.toLowerCase();
        let results = allAgents.filter(a => {
          const matchesSearch = !q ||
            (a.name || '').toLowerCase().includes(q) ||
            (a.description || '').toLowerCase().includes(q) ||
            (a.category || '').toLowerCase().includes(q);
          return matchesSearch;
        });
        setFiltered(results.slice(0, 50));
        setSearchMode('keyword');
        setIsLoading(false);
      });
  }, [allAgents]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(search);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, runSearch]);

  const HINTS = ['SEO', 'copywriter', 'security', 'python', 'react', 'database', 'analyst', 'design'];

  return (
    <div
      className="w-full h-full flex-grow flex flex-col overflow-hidden min-h-0 transition-all duration-300 border-r-2 border-t-2 border-b-2 rounded-tr-2xl rounded-br-2xl shadow-2xl p-5 pointer-events-auto"
      style={{ backgroundColor: 'var(--theme-card)', borderColor: '#2563eb', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2 shrink-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
            <Robot size={16} />
            Agentes {filtered.length > 0 && <span className="text-[10px] opacity-50 font-normal">({filtered.length})</span>}
          </h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 h-4">
          {(searchMode === 'semantic' || searchMode === 'idle') && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1"
              style={{ backgroundColor: '#2563eb22', color: '#2563eb' }}>
              <Sparkle size={9} weight="fill" /> {searchMode === 'idle' ? 'Motor Semántico Listo' : 'Búsqueda Semántica'}
            </span>
          )}
          {searchMode === 'keyword' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold opacity-50"
              style={{ backgroundColor: 'var(--theme-bg)' }}>
              Filtro por Keywords
            </span>
          )}
        </div>
      </div>

      <p className="text-sm opacity-60 mb-1 shrink-0 leading-relaxed">
        Escribe el <strong>rol o habilidad</strong> que necesitas
      </p>
      
      {/* Search + Filter */}
      <div className="flex flex-col gap-2 shrink-0 mb-3 mt-2">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          {isLoading && (
            <ArrowClockwise size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin opacity-40" />
          )}
          <input
            type="text"
            placeholder="Ej: desarrollador python experto en machine learning..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg text-base outline-none"
            style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid #2563eb', color: 'var(--theme-text)' }}
            autoFocus
          />
        </div>
      </div>

      {/* Hint chips */}
      {!search && (
        <div className="flex flex-wrap gap-1 mb-3 shrink-0">
          {HINTS.map(hint => (
            <button
              key={hint}
              onClick={() => setSearch(hint)}
              className="text-[10px] px-2 py-1 rounded-full border transition-all hover:opacity-100 opacity-60"
              style={{ borderColor: '#2563eb', color: '#2563eb' }}
            >
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 -mr-1">
        {isLoading && (
          <div className="text-center opacity-40 text-sm py-8">Buscando...</div>
        )}
        {!isLoading && !search && (
          <div className="text-center opacity-30 text-sm py-8">
            Escribe algo para buscar en 1,400+ agentes
          </div>
        )}
        {!isLoading && search && filtered.length === 0 && (
          <div className="text-center opacity-40 text-sm py-8">
            Sin resultados para "{search}"
          </div>
        )}
        {!isLoading && filtered.map((agent, i) => (
          <div
            key={i}
            className="p-3 rounded-xl border border-transparent hover:border-[#2563eb] cursor-pointer transition-all hover:translate-x-1 hover:shadow-md"
            style={{ backgroundColor: 'var(--theme-bg)' }}
            onClick={() => onAddAgent({
              title: agent.name,
              content: agent.description,
              role: agent.description.slice(0, 80),
              category: agent.category,
            })}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-[10px] uppercase font-bold truncate" style={{ color: '#2563eb' }}>
                {(agent.category || 'General').split(' > ')[0]}
                {agent.source && agent.source !== 'community' && (
                  <span className="ml-1 opacity-50">· {agent.source}</span>
                )}
              </div>
              {agent.score !== undefined && (
                <span className="text-[9px] opacity-40 shrink-0 ml-1">
                  {Math.round((agent.score || 0) * 100)}%
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm mb-1 leading-tight">{agent.name}</h4>
            <p className="text-[11px] opacity-60 line-clamp-2">{agent.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
