import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import type { BuilderNodeData } from '../types/builder';
import { API_URL } from '../lib/api';
import {
  SpeakerHigh, ArrowLeft, MagnifyingGlass, MagicWand,
  CaretRight, CheckSquare, Square, X, Sparkle
} from '@phosphor-icons/react';

interface Agent {
  id?: string;
  title: string;
  category?: string;
  content: string;
  instructions?: string;
  objective?: string;
  isMultiAgent?: boolean;
  upgradeExplanation?: string;
  chain?: Agent[];
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

const HISTORY_KEY = 'agents_history';

function getAgentHistory(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
  } catch {
    return {};
  }
}

function setAgentHistoryEntry(key: string, ts: string) {
  const h = getAgentHistory();
  h[key] = ts;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

function makeAgentKey(p: Agent): string {
  return `${p.title}_${(p.category || '').replace(/\W/g, '_')}`.slice(0, 80);
}

// Scoring: simple TF match across title, category, content
function scoreAgent(p: Agent, terms: string[]): number {
  let score = 0;
  for (const t of terms) {
    if (p.title.toLowerCase().includes(t)) score += 3;
    if ((p.category || '').toLowerCase().includes(t)) score += 2;
    if (p.content.toLowerCase().includes(t)) score += 1;
  }
  return score;
}

const Agents = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'categories' | 'subcategories' | 'agentes'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [agentes, setAgentes] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<BuilderNodeData[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Agent[] | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Multi-select (chaining)
  const [selectedForChain, setSelectedForChain] = useState<Agent[]>([]);

  // History
  const [agentHistory, setAgentHistory] = useState<Record<string, string>>({});
  const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'logic'>('content');
  const [logicData, setLogicData] = useState<Record<string, string>>({});
  const [isGeneratingLogic, setIsGeneratingLogic] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeTimeLeft, setUpgradeTimeLeft] = useState('');
  const [explanationPopup, setExplanationPopup] = useState<{title: string, text: string} | null>(null);

  useEffect(() => {
    setPanelTab('content');
  }, [inspectedAgent?.id]);

  useEffect(() => {
    fetchCategories();
    setAgentHistory(getAgentHistory());
    try {
      setGeneratedVariants(JSON.parse(localStorage.getItem('generated_variants') || '[]'));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json');
      if (!res.ok) throw new Error('Failed to load JSON');
      const rawData = await res.json();
      const data: Agent[] = rawData.map((item: any) => ({
        id: item.id || item.name,
        title: item.name || item.title || 'Agente Sin Nombre',
        category: item.category || 'General > Otros',
        content: item.description || item.content || 'Sin descripción.',
        instructions: item.instructions || 'Sin instrucciones detalladas.',
      }));
      
      let upgraded: Agent[] = [];
      try {
        upgraded = JSON.parse(localStorage.getItem('upgraded_agents') || '[]');
      } catch (e) {}
      
      const mergedData = [...upgraded, ...data];
      setAllAgents(mergedData);

      const catMap: Record<string, Record<string, number>> = {};
      mergedData.forEach((p) => {
        const parts = (p.category || 'General').split(' > ');
        const main = parts[0].trim();
        const sub = parts[1] ? parts[1].trim() : 'General';
        
        if (!catMap[main]) catMap[main] = {};
        if (!catMap[main][sub]) catMap[main][sub] = 0;
        catMap[main][sub]++;
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

  
  
  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inspectedAgent) return;
    
    // Determine the text to read based on current tab
    const currentText = panelTab === 'content' 
      ? (inspectedAgent.instructions || inspectedAgent.content)
      : (logicData[inspectedAgent.id || ''] || '');
      
    if (!currentText) return;

    setIsTranslating(true);
    try {
      // Background translation to Spanish using local LLM
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente texto al español de forma natural. Si ya esta en español, devuelve el texto original sin modificaciones. No agregues saludos, explicaciones, ni notas adicionales, SOLO el texto traducido. Texto:\n\n${currentText}`,
          stream: false
        })
      });
      
      let textToSpeak = currentText;
      if (res.ok) {
        const data = await res.json();
        if (data && data.response) {
            textToSpeak = data.response;
        }
      }
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const handleUpgrade = async () => {
    if (!inspectedAgent) return;
    setIsUpgrading(true);
    setUpgradeProgress(0);
    setUpgradeTimeLeft('Calculando...');
    
    try {
      const promptText = `Eres un Ingeniero de IA hispanohablante. Tu objetivo es mejorar este prompt.
INSTRUCCIÓN CRÍTICA: Tu respuesta debe ser estrictamente un objeto JSON. Todos los textos y explicaciones deben redactarse obligatoriamente en idioma ESPAÑOL.

{
  "prompt_mejorado": "<el prompt mejorado aquí en formato Markdown, escrito en español>",
  "explicacion": "<tu justificación detallada en idioma ESPAÑOL de por qué es mejor (2 a 3 líneas)>"
}

Prompt Original a mejorar:
${inspectedAgent.instructions || inspectedAgent.content}`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          format: 'json',
          system: 'Eres un sistema nativo en idioma ESPAÑOL. Absolutamente TODO el contenido que generes (explicaciones, respuestas, código, notas) DEBE estar única y exclusivamente en ESPAÑOL. NUNCA respondas en inglés.',
          prompt: promptText,
          stream: true
        })
      });
      
      if (!res.ok || !res.body) throw new Error('Error de conexión con Ollama local');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let generatedText = '';
      let tokens = 0;
      const startTime = Date.now();
      const estimatedTotalTokens = 350; // Average estimate for a prompt upgrade
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              generatedText += parsed.response;
              tokens++;
              
              // Calculate progress %
              let progress = Math.min(95, Math.floor((tokens / estimatedTotalTokens) * 100));
              setUpgradeProgress(progress);
              
              // Calculate ETA based on tokens/sec
              const elapsedMs = Date.now() - startTime;
              if (elapsedMs > 1000) {
                const tokensPerMs = tokens / elapsedMs;
                const remainingTokens = Math.max(0, estimatedTotalTokens - tokens);
                const remainingMs = remainingTokens / tokensPerMs;
                const remainingSecs = Math.ceil(remainingMs / 1000);
                
                if (remainingSecs > 60) {
                  setUpgradeTimeLeft(`${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s`);
                } else {
                  setUpgradeTimeLeft(`${remainingSecs}s`);
                }
              }
            }
          } catch (e) {
            // ignore JSON parse errors for incomplete chunks
          }
        }
      }
      
      setUpgradeProgress(100);
      setUpgradeTimeLeft('¡Listo!');
      
      let finalPrompt = generatedText;
      let explanation = "Mejora generada exitosamente.";
      try {
        const parsedJson = JSON.parse(generatedText);
        finalPrompt = parsedJson.prompt_mejorado || parsedJson.improved_prompt || generatedText;
        explanation = parsedJson.explicacion || parsedJson.explanation || explanation;
      } catch (e) {
        console.warn("No se pudo parsear el JSON de la mejora, usando texto crudo.");
      }

      const newAgent: Agent = {
        ...inspectedAgent,
        id: (inspectedAgent.id || Date.now().toString()) + '-upgraded',
        title: inspectedAgent.title + ' (Upgrade)',
        instructions: finalPrompt,
        upgradeExplanation: explanation
      };
      
      let upgraded: Agent[] = [];
      try {
        upgraded = JSON.parse(localStorage.getItem('upgraded_agents') || '[]');
      } catch (e) {}
      upgraded.unshift(newAgent);
      localStorage.setItem('upgraded_agents', JSON.stringify(upgraded));
      
      setAllAgents(prev => [newAgent, ...prev]);
      setAgentes(prev => [newAgent, ...prev]);
      setSearchResults(prev => prev ? [newAgent, ...prev] : null);
      setInspectedAgent(newAgent);
      setExplanationPopup({ title: newAgent.title, text: explanation });
    } catch (err) {
      console.error(err);
      alert('Error al mejorar el agente. Verifica que Ollama este funcionando.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogic = async () => {
    if (!inspectedAgent) return;
    setPanelTab('logic');
    if (logicData[inspectedAgent.id || '']) return;

    setIsGeneratingLogic(true);
    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Analiza el siguiente agente de IA y explica detalladamente cómo funciona, qué hace, su lógica interna y su propósito principal de manera extensa y clara.\n\nAgente:\n${inspectedAgent.instructions || inspectedAgent.content}`,
          stream: false
        })
      });
      if (!res.ok) throw new Error('Error al conectar con Ollama');
      const data = await res.json();
      setLogicData(prev => ({ ...prev, [inspectedAgent.id || '']: data.response }));
    } catch (err) {
      console.error(err);
      setLogicData(prev => ({ ...prev, [inspectedAgent.id || '']: 'No se pudo generar la explicacion. Verifica la conexion con Ollama local.' }));
    } finally {
      setIsGeneratingLogic(false);
    }
  };

  // ─── SEARCH LOGIC ─────────────────────────────────────────────────────────
  // The user types their *desired outcome* — e.g. "launch a startup and write a pitch deck".
  // We tokenize it, score every agent in the DB, and return the top 15 ordered by relevance.
  // Multiple agentes can be selected to chain them as a workflow in the Builder.
  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) { setSearchResults(null); setIsSearchMode(false); return; }

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = allAgents
      .map(p => ({ p, score: scoreAgent(p, terms) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(({ p }) => p);

    setSearchResults(scored);
    setIsSearchMode(true);
    setView('agentes');
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setAgentes(scored);
    setSelectedForChain([]);
  };

  // ─── FLOW SUGGESTION (Agents → IA → Builder) ─────────────────────────────
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
      type: 'mainAgent',
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
        agentKey: `flow_${Date.now()}`,
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
        type: 'mainAgent',
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

  // "Mejorar" — sends the raw text directly to Builder as a new agent to work on
  const handleImprove = () => {
    if (!searchQuery.trim()) return;
    navigate('/builder', {
      state: {
        agent: { title: 'Mi Agent', content: searchQuery },
        agentKey: `custom_${Date.now()}`,
        restoreCanvas: false
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ─── CHAIN SELECTION ──────────────────────────────────────────────────────
  const toggleChainSelect = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    setSelectedForChain(prev => {
      const exists = prev.some(p => makeAgentKey(p) === makeAgentKey(agent));
      return exists ? prev.filter(p => makeAgentKey(p) !== makeAgentKey(agent)) : [...prev, agent];
    });
  };

  const isInChain = (agent: Agent) =>
    selectedForChain.some(p => makeAgentKey(p) === makeAgentKey(agent));

  // Launch all selected agentes as a chained workflow in the Builder
  const launchChain = () => {
    if (selectedForChain.length === 0) return;
    const chainKey = `chain_${Date.now()}`;
    navigate('/builder', {
      state: {
        agentChain: selectedForChain,
        agentKey: chainKey,
        restoreCanvas: false
      }
    });
  };

  // ─── SINGLE SET ───────────────────────────────────────────────────────────
  const handleSetAgent = (e: React.MouseEvent, agent: Agent) => {
    e.stopPropagation();
    const key = makeAgentKey(agent);
    const now = new Date().toISOString();
    setAgentHistoryEntry(key, now);
    setAgentHistory(prev => ({ ...prev, [key]: now }));

    const savedNodes = localStorage.getItem(`builder_nodes_${key}`);
    navigate('/builder', {
      state: {
        prompt: { ...agent, content: agent.instructions || agent.content },
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
    setView('agentes');
    setIsLoading(true);
    const filtered = allAgents.filter((p) => {
      const parts = (p.category || 'General').split(' > ');
      const main = parts[0].trim();
      const sub = parts[1] ? parts[1].trim() : 'General';
      return main === selectedCategory?.id && sub === subCat;
    });
    setAgentes(filtered);
    setSelectedForChain([]);
    setIsLoading(false);
  };

  const goBack = () => {
    setSelectedForChain([]);
    if (view === 'agentes') {
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

  const displayAgentes = (isSearchMode && searchResults) ? searchResults : agentes;

  const renderCategoryCard = (cat: Category, idx: number) => (
    <div
      key={cat.id || idx}
      onClick={() => handleCategoryClick(cat)}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col min-h-[14rem]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="bg-blue-900/40 text-blue-400 text-sm font-bold px-3 py-1 rounded-full border border-blue-800/50 w-fit">
            {cat.totalCount.toLocaleString()} Agentes
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
    <div className="flex h-screen bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">
      
      {/* Left Column: Directory */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-blue-500 tracking-wide">Directorio de Agentes</h1>
        <p className="text-gray-400 mt-2">Análisis Milimétrico de Skills y Agentes de IA</p>
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
              <span className="text-blue-400 font-bold">{searchResults.length}</span> agentes relevantes encontrados para: 
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
            <p className="text-purple-400 font-bold text-sm">{selectedForChain.length} agentes seleccionados para el flujo</p>
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
          <p className="text-gray-500 mb-6">{selectedCategory.totalCount.toLocaleString()} agentes en {selectedCategory.subCategories.length} subcategorías</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedCategory.subCategories.map((sub, idx) => (
              <div
                key={idx}
                onClick={() => handleSubCategoryClick(sub.name)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[8rem]"
              >
                <h3 className="font-semibold text-gray-100 text-md leading-snug">{sub.name}</h3>
                <span className="mt-3 bg-blue-900/30 text-blue-400 text-xs font-bold px-2 py-1 rounded-full border border-blue-800/40 w-fit">
                  {sub.count} agentes
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
              <p className="text-gray-500">{selectedCategory.title} › {selectedSubCategory} — {displayAgentes.length} agentes</p>
            </div>
          )}

          {/* hint when multiple selected */}
          {displayAgentes.length > 0 && (
            <p className="text-xs text-gray-600 mb-4">
              Haz clic en <span className="text-purple-400">☑</span> en varias cards para encadenarlas como flujo de trabajo, luego presiona <span className="text-purple-400 font-bold">✦ Lanzar Flujo</span>.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
            {displayAgentes.map((agent, idx) => {
              const key = makeAgentKey(agent);
              const lastOpened = agentHistory[key];
              const inChain = isInChain(agent);
              const chainPos = selectedForChain.findIndex(p => makeAgentKey(p) === key);

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedAgent(agent);
                  }}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${
                    inChain
                      ? 'border-[#174A1F] active-card'
                      : (inspectedAgent && makeAgentKey(inspectedAgent) === key)
                        ? 'active-card'
                        : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]'
                  }`}
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
                        onClick={(e) => toggleChainSelect(e, agent)}
                        className={`p-2 rounded-full transition-colors ${inChain ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-purple-400'}`}
                        title={inChain ? 'Quitar del flujo' : 'Añadir al flujo de trabajo'}
                      >
                        {inChain ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      {/* TTS */}
                      <button
                        onClick={(e) => handleSpeak(e, `${agent.title}. ${agent.content || ''}`)}
                        className="text-gray-400 hover:text-white bg-gray-800 p-2.5 rounded-full transition-colors"
                        title="Traducir y Escuchar"
                      >
                        <SpeakerHigh size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-lg text-gray-100 line-clamp-2 leading-snug">{agent.title}</h3>
                    {agent.upgradeExplanation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExplanationPopup({ title: agent.title, text: agent.upgradeExplanation! });
                        }}
                        className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors border border-blue-700/50 shadow-sm"
                        title="¿Por qué es mejor este agente?"
                      >
                        ?
                      </button>
                    )}
                  </div>
                  
                  {agent.isMultiAgent && agent.chain ? (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 mt-1 pr-1 custom-scrollbar">
                      {agent.chain.map((step, i) => (
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
                    <p className="text-sm text-gray-400 line-clamp-4 flex-1 leading-relaxed">{agent.content}</p>
                  )}

                  <div className="mt-4">
                    {agent.isMultiAgent ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/builder', {
                            state: {
                              agentChain: agent.chain,
                              restoreCanvas: false
                            }
                          });
                        }}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
                      >
                        <Sparkle size={18} /> Enviar Flujo a Builder
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleSetAgent(e, agent)}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full"
                        style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
                      >
                        {lastOpened ? '🔁 Continuar en Builder' : 'Abrir en Builder'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {displayAgentes.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-10 text-lg">
                No se encontraron agentes.
              </div>
            )}
          </div>
        </div>
      )}

      </div> {/* End Left Column */}

      {/* Right Column: AI & Inspected Agent */}
      <div className="w-96 md:w-[600px] border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="font-bold text-gray-200 flex items-center gap-2"><Sparkle size={18} className="text-blue-400" /> Panel del Agente</h2>
          {inspectedAgent && (
            <button onClick={() => setInspectedAgent(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {inspectedAgent ? (
            <div className="flex flex-col h-full">

              {/* Scroll content — stops 0.5cm above footer naturally */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" style={{ paddingBottom: '0.5cm' }}>
                
                {/* Herramientas IA en la parte superior */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-gray-800 pb-2 mb-1">Herramientas IA</div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⚡ Upgrade...' : '✨ Upgrade'}
                    </button>
                    <button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '🔊 Traduciendo...' : '🗣️ TTS'}
                    </button>
                  </div>
                  
                  {/* Progress Bar for Upgrade */}
                  {isUpgrading && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-[#7B9C7F] font-medium">
                        <span>Generando mejora...</span>
                        <span>{upgradeProgress}% ({upgradeTimeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-[#2A2A2A]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${upgradeProgress}%`, backgroundColor: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Titulo y Boton Logica */}
                <div className="flex items-center justify-between mb-4">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{inspectedAgent.category?.split(' > ').pop() || 'Agente'}</span>
                    <h3 className="text-2xl font-bold text-white mt-1 leading-tight">{inspectedAgent.title}</h3>
                  </div>
                  {panelTab === 'content' ? (
                  <button 
                    onClick={handleLogic} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-blue-900/40 text-blue-300 border-blue-700/50 hover:bg-blue-800"
                  >
                    🧠 Lógica
                  </button>
                ) : (
                  <button 
                    onClick={() => setPanelTab('content')} 
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 shadow-sm shrink-0 bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                  >
                    ⬅️ Volver
                  </button>
                )}
                </div>
                
                {/* Contenido (Markdown) */}
                <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-800 text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none prose-headings:text-blue-400 prose-a:text-blue-400 shadow-inner">
                  {panelTab === 'content' ? (
                    <ReactMarkdown>{inspectedAgent.instructions || inspectedAgent.content}</ReactMarkdown>
                  ) : (
                    <ReactMarkdown>{logicData[inspectedAgent.id || ''] || (isGeneratingLogic ? '🧠 Generando análisis profundo de la lógica del agente... (Esto puede tomar unos segundos)' : 'No hay datos.')}</ReactMarkdown>
                  )}
                </div>
                
              </div>

              {/* Footer — flex sibling, always visible at bottom */}
              <div className="panel-footer">
                <button
                  onClick={(e) => handleSetAgent(e as any, inspectedAgent)}
                  style={{
                    display: 'block',
                    width: '100%',
                    backgroundColor: '#2A2A2A',
                    border: 'none',
                    borderRadius: '0',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '14px',
                    letterSpacing: '0.04em',
                    padding: '18px 24px',
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    textAlign: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3a3a3a')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
                >
                  Abrir en el Builder →
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 text-center p-5">
              <div className="text-6xl mb-4">🤖</div>
              <p>Selecciona un agente en el directorio para ver sus detalles y herramientas de IA.</p>
            </div>
          )}
        </div>
      </div>

      {explanationPopup && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(5, 10, 15, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transform: 'translateZ(0)',
            animation: 'fadeIn 0.2s ease-out' 
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <div className="bg-[#0a0c10] border border-blue-500/50 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.15)] relative">
            <button 
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setExplanationPopup(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-800 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <Sparkle weight="fill" className="text-blue-400" size={24} />
              <h3 className="text-xl font-bold text-white">Mejora Aplicada</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Explicación de la optimización y cambios en <strong>{explanationPopup.title}</strong>:
            </p>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-gray-300 text-sm leading-relaxed custom-scrollbar max-h-48 overflow-y-auto">
              {explanationPopup.text}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <button 
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(explanationPopup.text);
                    utterance.lang = 'es-ES';
                    utterance.rate = 1.05;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🔊 Escuchar
              </button>
              <button 
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setExplanationPopup(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
