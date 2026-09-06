import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BuilderNodeData } from '../types/builder';
import { API_URL } from '../lib/api';
import {
  SpeakerHigh, ArrowLeft, MagnifyingGlass, MagicWand,
  CaretRight, CheckSquare, Square, X, Sparkle
} from '@phosphor-icons/react';

interface Prompt {
  id?: string;
  title: string;
  category?: string;
  content: string;
  objective?: string;
  isMultiPrompt?: boolean;
  chain?: Prompt[];
}

interface SubCategory {
  name: string;
  count: number;
}

interface Category {
  id: string;
  title: string;
  subCategories: SubCategory[];
  totalCount: number;
}

const HISTORY_KEY = 'atlas_prompt_history';

function getPromptHistory(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
  } catch {
    return {};
  }
}

function setPromptHistoryEntry(key: string, ts: string) {
  const h = getPromptHistory();
  h[key] = ts;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

function makePromptKey(p: Prompt): string {
  return `${p.title}_${(p.category || '').replace(/\W/g, '_')}`.slice(0, 80);
}

// Scoring: simple TF match across title, category, content
function scorePrompt(p: Prompt, terms: string[]): number {
  let score = 0;
  for (const t of terms) {
    if (p.title.toLowerCase().includes(t)) score += 3;
    if ((p.category || '').toLowerCase().includes(t)) score += 2;
    if (p.content.toLowerCase().includes(t)) score += 1;
  }
  return score;
}

const Atlas = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'categories' | 'subcategories' | 'prompts'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<BuilderNodeData[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Prompt[] | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Multi-select (chaining)
  const [selectedForChain, setSelectedForChain] = useState<Prompt[]>([]);

  // History
  const [promptHistory, setPromptHistory] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
    setPromptHistory(getPromptHistory());
    try {
      setGeneratedVariants(JSON.parse(localStorage.getItem('generated_variants') || '[]'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json');
      if (!res.ok) throw new Error('Failed to load JSON');
      const data = (await res.json()) as Prompt[];
      
      const mockMultiPrompt: Prompt = {
        id: 'mock-multi-1',
        title: 'Campaña de Marketing Completa',
        category: 'Marketing > Flujos Completos',
        content: 'Flujo de trabajo multi-prompt para crear una campaña de marketing completa.',
        isMultiPrompt: true,
        chain: [
          { title: '1. Buyer Persona', content: 'Crea un buyer persona detallado para tu producto o servicio, especificando demografía, puntos de dolor y motivaciones.' },
          { title: '2. Email Copy', content: 'Escribe el copy de una secuencia de 3 correos de lanzamiento basándote en el buyer persona definido.' },
          { title: '3. Ad Script', content: 'Redacta el guion para un anuncio en video corto de TikTok/Reels que atraiga al mismo buyer persona.' }
        ]
      };
      
      data.unshift(mockMultiPrompt);
      
      setAllPrompts(data);

      const catMap: Record<string, Record<string, number>> = {};
      data.forEach((p) => {
        const parts = (p.category || 'General').split(' > ');
        const main = parts[0].trim();
        const sub = parts[1] ? parts[1].trim() : 'General';
        if (!catMap[main]) catMap[main] = {};
        catMap[main][sub] = (catMap[main][sub] || 0) + 1;
      });

      setCategories(Object.keys(catMap).map(cat => ({
        id: cat,
        title: cat,
        subCategories: Object.keys(catMap[cat]).map(sub => ({ name: sub, count: catMap[cat][sub] })),
        totalCount: Object.values(catMap[cat]).reduce((a, b) => a + b, 0)
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── SEARCH LOGIC ─────────────────────────────────────────────────────────
  // The user types their *desired outcome* — e.g. "launch a startup and write a pitch deck".
  // We tokenize it, score every prompt in the DB, and return the top 15 ordered by relevance.
  // Multiple prompts can be selected to chain them as a workflow in the Builder.
  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) { setSearchResults(null); setIsSearchMode(false); return; }

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = allPrompts
      .map(p => ({ p, score: scorePrompt(p, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(({ p }) => p);

    setSearchResults(scored);
    setIsSearchMode(true);
    setView('prompts');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setPrompts(scored);
    setSelectedForChain([]);
  };

  // ─── FLOW SUGGESTION (Atlas → IA → Builder) ─────────────────────────────
  interface SuggestedFlowNode {
    id: string; title: string; role: string; content: string;
    framework?: string; llm_model?: string; temperature?: number; variables?: string;
  }
  interface SuggestedFlow {
    name: string; description: string; framework: string;
    nodes: SuggestedFlowNode[]; edges: { source: string; target: string }[];
  }
  interface FlowAlternative {
    id: string; name: string; engine: string; category: string; description: string; score: number;
  }

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [enhancedQuery, setEnhancedQuery] = useState<string | null>(null);
  const [recommendedFlow, setRecommendedFlow] = useState<SuggestedFlow | null>(null);
  const [flowAlternatives, setFlowAlternatives] = useState<FlowAlternative[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const handleSuggestFlows = async () => {
    const query = searchQuery.trim();
    if (!query || isSuggesting) return;
    setIsSuggesting(true);
    setSuggestError(null);
    setRecommendedFlow(null);
    setFlowAlternatives([]);
    setEnhancedQuery(null);
    try {
      // 1) La IA mejora el texto del usuario
      let finalQuery = query;
      try {
        const enhRes = await fetch(`${API_URL}/enhance_query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        if (enhRes.ok) {
          const enh = await enhRes.json();
          if (enh.enhanced_query) {
            finalQuery = enh.enhanced_query;
            setEnhancedQuery(enh.enhanced_query);
          }
        }
      } catch { /* mejora opcional */ }

      // 2) La IA sugiere 1 flujo recomendado + alternativas
      const res = await fetch(`${API_URL}/suggest_flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery })
      });
      if (!res.ok) throw new Error('Error del servidor al sugerir flujos');
      const data = await res.json();
      setRecommendedFlow(data.recommended || null);
      setFlowAlternatives(data.alternatives || []);
      if (!data.recommended && data.recommended_error) {
        setSuggestError(`No se pudo generar el flujo recomendado: ${data.recommended_error}`);
      }
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSuggesting(false);
    }
  };

  // Convierte el flujo sugerido (formato plano) a nodos/edges ReactFlow y abre el Builder
  const launchFlowInBuilder = (flow: SuggestedFlow) => {
    const rfNodes = flow.nodes.map((n, i) => ({
      id: n.id || `n${i + 1}`,
      type: 'mainPrompt',
      position: { x: 100 + i * 420, y: 200 },
      data: {
        title: n.title,
        content: n.content,
        role: n.role,
        framework: n.framework || 'auto',
        llm_model: n.llm_model || 'hermes3:8b',
        temperature: n.temperature ?? 0.7,
        variables: n.variables || ''
      }
    }));
    const rfEdges = flow.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#a855f7', strokeWidth: 3 }
    }));
    navigate('/builder', {
      state: {
        templateFlow: { nodes: rfNodes, edges: rfEdges },
        promptKey: `flow_${Date.now()}`,
        restoreCanvas: false,
        flowName: flow.name
      }
    });
  };

  // Guardar el flujo recomendado directamente en Nexus (Flows) sin abrir el Builder
  const saveFlowToNexus = async (flow: SuggestedFlow) => {
    try {
      const rfNodes = flow.nodes.map((n, i) => ({
        id: n.id || `n${i + 1}`,
        type: 'mainPrompt',
        position: { x: 100 + i * 420, y: 200 },
        data: { title: n.title, content: n.content, role: n.role, framework: n.framework || 'auto', llm_model: n.llm_model || 'hermes3:8b', temperature: n.temperature ?? 0.7, variables: n.variables || '' }
      }));
      const rfEdges = flow.edges.map((e, i) => ({ id: `e-${i}`, source: e.source, target: e.target }));
      await fetch(`${API_URL}/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: flow.name,
          description: flow.description,
          nodes: rfNodes,
          edges: rfEdges
        })
      });
    } catch (e) {
      console.error('Error guardando flujo en Nexus:', e);
    }
  };

  // "Mejorar" — sends the raw text directly to Builder as a new prompt to work on
  const handleImprove = () => {
    if (!searchQuery.trim()) return;
    navigate('/builder', {
      state: {
        prompt: { title: 'Mi Prompt', content: searchQuery },
        promptKey: `custom_${Date.now()}`,
        restoreCanvas: false
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ─── CHAIN SELECTION ──────────────────────────────────────────────────────
  const toggleChainSelect = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    setSelectedForChain(prev => {
      const exists = prev.some(p => makePromptKey(p) === makePromptKey(prompt));
      return exists ? prev.filter(p => makePromptKey(p) !== makePromptKey(prompt)) : [...prev, prompt];
    });
  };

  const isInChain = (prompt: Prompt) =>
    selectedForChain.some(p => makePromptKey(p) === makePromptKey(prompt));

  // Launch all selected prompts as a chained workflow in the Builder
  const launchChain = () => {
    if (selectedForChain.length === 0) return;
    const chainKey = `chain_${Date.now()}`;
    navigate('/builder', {
      state: {
        promptChain: selectedForChain,
        promptKey: chainKey,
        restoreCanvas: false
      }
    });
  };

  // ─── SINGLE SET ───────────────────────────────────────────────────────────
  const handleSetPrompt = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    const key = makePromptKey(prompt);
    const now = new Date().toISOString();
    setPromptHistoryEntry(key, now);
    setPromptHistory(prev => ({ ...prev, [key]: now }));

    const savedNodes = localStorage.getItem(`builder_nodes_${key}`);
    navigate('/builder', {
      state: {
        prompt,
        promptKey: key,
        restoreCanvas: !!(savedNodes)
      }
    });
  };

  // ─── TTS ──────────────────────────────────────────────────────────────────
  const handleSpeak = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 400))}&langpair=en|es`);
      const data = await res.json();
      const translated = data?.responseData?.translatedText || text;
      const msg = new SpeechSynthesisUtterance(translated);
      msg.lang = 'es-ES';
      window.speechSynthesis.speak(msg);
    } catch {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'es-ES';
      window.speechSynthesis.speak(msg);
    }
  };

  // ─── NAVIGATION ───────────────────────────────────────────────────────────
  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setView('subcategories');
    setSearchResults(null);
    setIsSearchMode(false);
    setSelectedForChain([]);
  };

  const handleSubCategoryClick = (subCat: string) => {
    setSelectedSubCategory(subCat);
    setView('prompts');
    setIsLoading(true);
    const filtered = allPrompts.filter((p) => {
      const parts = (p.category || 'General').split(' > ');
      const main = parts[0].trim();
      const sub = parts[1] ? parts[1].trim() : 'General';
      return main === selectedCategory?.id && sub === subCat;
    });
    setPrompts(filtered);
    setSelectedForChain([]);
    setIsLoading(false);
  };

  const goBack = () => {
    setSelectedForChain([]);
    if (view === 'prompts') {
      setSearchResults(null);
      setIsSearchMode(false);
      if (selectedSubCategory) {
        setView('subcategories');
        setSelectedSubCategory(null);
      } else {
        setView('categories');
        setSelectedCategory(null);
      }
    } else if (view === 'subcategories') {
      setView('categories');
      setSelectedCategory(null);
    }
  };

  const formatDate = (iso: string | undefined) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) +
      ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const displayPrompts = (isSearchMode && searchResults) ? searchResults : prompts;

  const renderCategoryCard = (cat: Category, idx: number) => (
    <div
      key={cat.id || idx}
      onClick={() => handleCategoryClick(cat)}
      className="border rounded-2xl p-6 cursor-pointer transition-all flex flex-col min-h-[14rem] bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="bg-blue-900/40 text-blue-400 text-sm font-bold px-3 py-1 rounded-full border border-blue-800/50 w-fit">
            {cat.totalCount.toLocaleString()} Prompts
          </span>
          <span className="text-gray-600 text-xs">{cat.subCategories.length} subcategorías</span>
        </div>
        <button
          onClick={(e) => handleSpeak(e, `${cat.title}. Category with ${cat.subCategories.length} subcategories.`)}
          className="text-gray-400 hover:text-white bg-gray-800 p-2.5 rounded-full transition-colors flex-shrink-0"
          title="Traducir y Escuchar"
        >
          <SpeakerHigh size={18} />
        </button>
      </div>
      <h3 className="font-bold text-xl text-gray-100 mb-2">{cat.title}</h3>
      <div className="flex-1 overflow-hidden">
        {cat.subCategories.slice(0, 4).map((sub, i) => (
          <div key={i} className="text-xs text-gray-500 truncate flex items-center gap-1 mb-0.5">
            <CaretRight size={10} /> {sub.name}
            <span className="text-gray-600 ml-auto flex-shrink-0">{sub.count}</span>
          </div>
        ))}
        {cat.subCategories.length > 4 && (
          <div className="text-xs text-blue-600 mt-1">+{cat.subCategories.length - 4} más...</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-200 p-8 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-500 tracking-wide">Atlas 4.0</h1>
        <p className="text-gray-400 mt-2">Explorador de Categorías y Prompts</p>
      </header>

      {/* ─── SEARCH BOX ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-10">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Describe el resultado que quieres lograr... ej: 'lanzar mi startup con pitch deck y estrategia de ventas'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition-colors shadow-lg text-sm"
            />
            <button
              onClick={handleImprove}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-7 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <MagicWand size={18} /> Mejorar
            </button>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-7 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <MagnifyingGlass size={18} /> Buscar
            </button>
            <button
              onClick={handleSuggestFlows}
              disabled={isSuggesting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-7 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
              title="La IA mejora tu texto y diseña el flujo de trabajo ideal + 5 alternativas"
            >
              <Sparkle size={18} /> {isSuggesting ? 'Diseñando...' : 'Diseñar Flujo'}
            </button>
          </div>
          {isSearchMode && searchResults !== null && (
            <p className="text-xs text-gray-500 pl-1">
              <span className="text-blue-400 font-bold">{searchResults.length}</span> prompts relevantes encontrados para: 
              <span className="text-white"> "{searchQuery}"</span>
              <span className="text-gray-600"> — Puedes seleccionar varios con </span>
              <span className="text-purple-400">☑</span>
              <span className="text-gray-600"> y encadenarlos en el Builder como un flujo de trabajo.</span>
            </p>
          )}

          {/* ─── FLOW SUGGESTION PANEL ─── */}
          {(isSuggesting || recommendedFlow || flowAlternatives.length > 0 || suggestError || enhancedQuery) && (
            <div className="mt-4 bg-gray-900/80 border border-emerald-800/50 rounded-2xl p-5 shadow-2xl">
              {isSuggesting && (
                <div className="flex items-center gap-3 text-emerald-300 text-sm">
                  <span className="animate-spin text-lg">⚙️</span>
                  <span>La IA está mejorando tu texto y diseñando el flujo de trabajo ideal...</span>
                </div>
              )}
              {enhancedQuery && !isSuggesting && (
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Tu objetivo, mejorado por IA:</div>
                  <p className="text-sm text-gray-300 italic border-l-2 border-emerald-600 pl-3">{enhancedQuery}</p>
                </div>
              )}
              {suggestError && (
                <p className="text-sm text-red-400">⚠️ {suggestError}</p>
              )}
              {recommendedFlow && (
                <div className="mb-5 bg-emerald-950/40 border border-emerald-700/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">⭐ Flujo Recomendado por la IA</div>
                      <h4 className="text-white font-bold text-lg">{recommendedFlow.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{recommendedFlow.description}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">{recommendedFlow.framework}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">{recommendedFlow.nodes.length} agentes</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {recommendedFlow.nodes.map((n) => (
                          <span key={n.id} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300 border border-indigo-800/40" title={n.role}>
                            {n.title}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => launchFlowInBuilder(recommendedFlow)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Abrir en Builder →
                      </button>
                      <button
                        onClick={() => saveFlowToNexus(recommendedFlow)}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Guardar en Nexus
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {flowAlternatives.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Flujos alternativos:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {flowAlternatives.map((alt) => (
                      <button
                        key={alt.id}
                        onClick={() => navigate('/flows')}
                        className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-emerald-700 rounded-lg p-3 transition-colors"
                        title={alt.description}
                      >
                        <div className="text-sm font-bold text-gray-200">{alt.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{alt.engine} · {alt.category}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── CHAIN TOOLBAR ──────────────────────────────────────────────────── */}
      {selectedForChain.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-purple-500 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-3xl w-full mx-4">
          <div className="flex-1">
            <p className="text-purple-400 font-bold text-sm">{selectedForChain.length} prompts seleccionados para el flujo</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedForChain.map((p, i) => (
                <span key={i} className="bg-purple-900/40 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-800/50 flex items-center gap-1">
                  {i + 1}. {p.title.slice(0, 25)}{p.title.length > 25 ? '…' : ''}
                  <button onClick={(e) => toggleChainSelect(e, p)} className="hover:text-white ml-1"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={launchChain}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap transition-colors"
          >
            <Sparkle size={18} /> Lanzar Flujo
          </button>
          <button onClick={() => setSelectedForChain([])} className="text-gray-500 hover:text-white p-2">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ─── BREADCRUMB ─────────────────────────────────────────────────────── */}
      {(view !== 'categories' || isSearchMode) && (
        <button
          onClick={goBack}
          className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors px-4 py-2 bg-gray-900 rounded-lg w-fit"
        >
          <ArrowLeft size={20} />
          {view === 'subcategories' ? 'Volver a Categorías' : selectedSubCategory ? `Volver a ${selectedCategory?.title}` : 'Volver a Categorías'}
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      ) : view === 'categories' && !isSearchMode ? (

        /* ─── CATEGORÍAS ──────────────────────────────────────────────────── */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {categories.slice(0, 12).map((cat, idx) => renderCategoryCard(cat, idx))}
          </div>

          {generatedVariants.length > 0 && (
            <div className="mb-10 mt-10 overflow-hidden relative w-full border-t border-b border-gray-800/50 py-8 bg-[#0a0c10]">
              <div className="flex items-center gap-2 mb-6 px-4">
                <Sparkle weight="light" className="text-blue-500" size={24} />
                <h3 className="text-xl font-bold text-gray-200 tracking-wide">Variantes IA Generadas</h3>
              </div>
              <style>{`
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                  animation: marquee 25s linear infinite;
                  width: max-content;
                }
                .animate-marquee:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="flex animate-marquee gap-6">
                {generatedVariants.concat(generatedVariants).map((v, i) => (
                  <div key={i} className="w-[320px] h-40 bg-gradient-to-br from-blue-900/20 to-purple-900/10 border border-blue-800/40 rounded-2xl p-5 shrink-0 shadow-lg relative cursor-pointer hover:border-blue-400 transition-colors flex flex-col justify-between overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <Sparkle weight="light" className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-300 text-lg truncate mb-1 pr-6">{v.title}</h4>
                      <p className="text-xs text-purple-400/80 mb-2 truncate uppercase tracking-widest">{v.role}</p>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-3 opacity-80 leading-snug">{v.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.slice(12).map((cat, idx) => renderCategoryCard(cat, idx + 12))}
          </div>
        </div>

      ) : view === 'subcategories' && selectedCategory ? (

        /* ─── SUBCATEGORÍAS ───────────────────────────────────────────────── */
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{selectedCategory.title}</h2>
          <p className="text-gray-500 mb-6">{selectedCategory.totalCount.toLocaleString()} prompts en {selectedCategory.subCategories.length} subcategorías</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedCategory.subCategories.map((sub, idx) => (
              <div
                key={idx}
                onClick={() => handleSubCategoryClick(sub.name)}
                className="border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between min-h-[8rem] bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]"
              >
                <h3 className="font-semibold text-gray-100 text-md leading-snug">{sub.name}</h3>
                <span className="mt-3 bg-blue-900/30 text-blue-400 text-xs font-bold px-2 py-1 rounded-full border border-blue-800/40 w-fit">
                  {sub.count} prompts
                </span>
              </div>
            ))}
          </div>
        </div>

      ) : (

        /* ─── PROMPTS ─────────────────────────────────────────────────────── */
        <div>
          {selectedCategory && selectedSubCategory && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedSubCategory}</h2>
              <p className="text-gray-500">{selectedCategory.title} › {selectedSubCategory} — {displayPrompts.length} prompts</p>
            </div>
          )}

          {/* hint when multiple selected */}
          {displayPrompts.length > 0 && (
            <p className="text-xs text-gray-600 mb-4">
              Haz clic en <span className="text-purple-400">☑</span> en varias cards para encadenarlas como flujo de trabajo, luego presiona <span className="text-purple-400 font-bold">✦ Lanzar Flujo</span>.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
            {displayPrompts.map((prompt, idx) => {
              const key = makePromptKey(prompt);
              const lastOpened = promptHistory[key];
              const inChain = isInChain(prompt);
              const chainPos = selectedForChain.findIndex(p => makePromptKey(p) === key);

              return (
                <div
                  key={idx}
                  onClick={(e) => handleSetPrompt(e, prompt)}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${inChain ? 'border-[#174A1F] active-card' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'}`}
                >
                  {/* Chain position badge */}
                  {inChain && (
                    <div className="absolute -top-3 -left-3 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg z-10">
                      {chainPos + 1}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-500 text-xs font-bold bg-gray-800 px-3 py-1 rounded-full w-fit">#{idx + 1}</span>
                      {lastOpened && (
                        <span className="text-green-500/70 text-[10px] leading-tight">🕐 {formatDate(lastOpened)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Chain toggle */}
                      <button
                        onClick={(e) => toggleChainSelect(e, prompt)}
                        className={`p-2 rounded-full transition-colors ${inChain ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-purple-400'}`}
                        title={inChain ? 'Quitar del flujo' : 'Añadir al flujo de trabajo'}
                      >
                        {inChain ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      {/* TTS */}
                      <button
                        onClick={(e) => handleSpeak(e, `${prompt.title}. ${prompt.content || ''}`)}
                        className="text-gray-400 hover:text-white bg-gray-800 p-2.5 rounded-full transition-colors"
                        title="Traducir y Escuchar"
                      >
                        <SpeakerHigh size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-gray-100 mb-2 line-clamp-2 leading-snug">{prompt.title}</h3>
                  
                  {prompt.isMultiPrompt && prompt.chain ? (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 mt-1 pr-1 custom-scrollbar">
                      {prompt.chain.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-gray-800/40 p-2.5 rounded-lg border border-gray-700/50">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 flex flex-col">
                            <span className="font-semibold text-gray-200 line-clamp-1">{step.title}</span>
                            <span className="text-xs text-gray-500 line-clamp-1">{step.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 line-clamp-4 flex-1 leading-relaxed">{prompt.content}</p>
                  )}

                  <div className="mt-4">
                    {prompt.isMultiPrompt ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/builder', {
                            state: {
                              promptChain: prompt.chain,
                              restoreCanvas: false
                            }
                          });
                        }}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2" style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
                      >
                        <Sparkle size={18} /> Enviar Flujo a Builder
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleSetPrompt(e, prompt)}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full" style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
                      >
                        {lastOpened ? '🔁 Continuar en Builder' : 'Abrir en Builder'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {displayPrompts.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10 text-lg">
                No se encontraron prompts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Atlas;
