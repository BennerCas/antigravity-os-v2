import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MagnifyingGlass, Funnel, BookOpen, ArrowClockwise, Sparkle } from '@phosphor-icons/react';
import type { BuilderNodeData } from '../../types/builder';
import { API_URL } from '../../lib/api';

interface PromptsLibraryPanelProps {
  onClose: () => void;
  onAddPrompt: (promptData: BuilderNodeData) => void;
}

interface PromptItem {
  title: string;
  category?: string;
  content: string;
  source?: string;
  score?: number;
}

export default function PromptsLibraryPanel({ onClose, onAddPrompt }: PromptsLibraryPanelProps) {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | 'idle'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories once
  useEffect(() => {
    fetch(API_URL + '/prompts/categories')
      .then(res => res.json())
      .then((data: any) => {
        const cats: string[] = Array.isArray(data)
          ? data.map((c: any) => typeof c === 'string' ? c : (c.name || '')).filter(Boolean)
          : Object.keys(data);
        setCategories(cats.sort());
      })
      .catch(() => {});
  }, []);

  const runSearch = useCallback((query: string, cat: string) => {
    if (!query.trim()) {
      setPrompts([]);
      setSearchMode('idle');
      return;
    }
    setIsLoading(true);

    // Try semantic search first
    const semanticUrl = API_URL + '/semantic/search?q=' + encodeURIComponent(query) + '&top_k=40&type=prompt';
    fetch(semanticUrl)
      .then(res => {
        if (!res.ok) throw new Error('semantic unavailable');
        return res.json();
      })
      .then((data: any) => {
        let results: PromptItem[] = (data.results || []);
        if (cat) results = results.filter(p => (p.category || '').startsWith(cat));
        setPrompts(results.slice(0, 50));
        setSearchMode(data.mode === 'semantic' ? 'semantic' : 'keyword');
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to keyword endpoint
        const params = new URLSearchParams({ limit: '50', offset: '0', search: query });
        if (cat) params.set('category', cat);
        fetch(API_URL + '/prompts/list?' + params.toString())
          .then(res => res.json())
          .then((data: any) => {
            const list: PromptItem[] = Array.isArray(data) ? data : (data.prompts || []);
            setPrompts(list);
            setSearchMode('keyword');
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(search, categoryFilter);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, categoryFilter, runSearch]);

  const HINTS = ['analizar competidores', 'email marketing', 'SEO', 'liderazgo', 'copywriting', 'estrategia'];

  return (
    <div
      className="w-full h-full flex-grow flex flex-col overflow-hidden min-h-0 transition-all duration-300 border-r-2 border-t-2 border-b-2 rounded-tr-2xl rounded-br-2xl shadow-2xl p-5 pointer-events-auto"
      style={{ backgroundColor: 'var(--theme-card)', borderColor: '#7c3aed', color: 'var(--theme-text)' }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 mb-2 shrink-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
            <BookOpen size={16} />
            Prompts {prompts.length > 0 && <span className="text-[10px] opacity-50 font-normal">({prompts.length})</span>}
          </h3>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 h-4">
          {(searchMode === 'semantic' || searchMode === 'idle') && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1"
              style={{ backgroundColor: '#7c3aed22', color: '#7c3aed' }}>
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

      <p className="text-sm opacity-60 mb-4 shrink-0 leading-relaxed">
        Describe <strong>qué quieres hacer</strong> en lenguaje natural
      </p>

      {/* Search */}
      <div className="flex flex-col gap-2 shrink-0 mb-3">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
          {isLoading && (
            <ArrowClockwise size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin opacity-40" />
          )}
          <input
            type="text"
            placeholder="Ej: analizar competidores en redes sociales..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg text-base outline-none"
            style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid #7c3aed', color: 'var(--theme-text)' }}
            autoFocus
          />
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <Funnel size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-base outline-none appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid #7c3aed', color: 'var(--theme-text)' }}
            >
              <option value="">Todas las Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Hint chips */}
      {!search && (
        <div className="flex flex-wrap gap-1 mb-3 shrink-0">
          {HINTS.map(hint => (
            <button key={hint} onClick={() => setSearch(hint)}
              className="text-[10px] px-2 py-1 rounded-full border transition-all hover:opacity-100 opacity-50"
              style={{ borderColor: '#7c3aed', color: '#7c3aed' }}>
              {hint}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 -mr-1">
        {isLoading && <div className="text-center opacity-40 text-sm py-8">Buscando...</div>}
        {!isLoading && search && prompts.length === 0 && (
          <div className="text-center opacity-40 text-sm py-8">Sin resultados para "{search}"</div>
        )}
        {!isLoading && !search && (
          <div className="text-center opacity-30 text-sm py-8">Escribe algo para buscar en 22,000+ prompts</div>
        )}
        {!isLoading && prompts.map((prompt, i) => (
          <div key={i}
            className="p-3 rounded-xl border border-transparent hover:border-[#7c3aed] cursor-pointer transition-all hover:translate-x-1 hover:shadow-md"
            style={{ backgroundColor: 'var(--theme-bg)' }}
            onClick={() => onAddPrompt({
              title: prompt.title || 'Prompt',
              content: prompt.content,
              role: prompt.category || 'Prompt',
              category: prompt.category,
            })}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="text-[10px] uppercase font-bold truncate" style={{ color: '#7c3aed' }}>
                {(prompt.category || '').split(' > ')[0] || 'General'}
              </div>
              {prompt.score !== undefined && (
                <span className="text-[9px] opacity-40 shrink-0 ml-1">
                  {Math.round((prompt.score || 0) * 100)}%
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm mb-1 leading-tight">{prompt.title}</h4>
            <p className="text-[11px] opacity-60 line-clamp-2">{prompt.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
