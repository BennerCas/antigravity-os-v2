import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../lib/api';
import { logicTaskManager, LogicTaskState } from '../lib/logicTaskManager';
import {
  SpeakerHigh, ArrowLeft, MagnifyingGlass, MagicWand,
  CaretRight, CheckSquare, Square, X, Sparkle, Clock
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

export function isGeneratedAgent(p?: Agent | null): boolean {
  if (!p) return false;
  if (p.category?.includes('Master Prompts') && !p.title?.includes('(Upgrade)')) {
    return false;
  }
  if (!p.title?.includes('(Upgrade)') && !(p.id && (p.id.endsWith('-upgraded') || p.id.includes('upgraded') || p.id.startsWith('gen-'))) && !p.upgradeExplanation && !(p as any).isGenerated) {
    return false;
  }
  return Boolean(
    p.upgradeExplanation ||
    (p.id && (p.id.endsWith('-upgraded') || p.id.includes('upgraded') || p.id.startsWith('gen-'))) ||
    p.title?.includes('(Upgrade)') ||
    (p as any).isGenerated
  );
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
  const [view, setView] = useState<'categories' | 'subcategories' | 'agentes'>(() => {
    return (localStorage.getItem('agents_view') as any) || 'categories';
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
    const saved = localStorage.getItem('agents_selected_category');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(() => {
    return localStorage.getItem('agents_selected_subcategory') || null;
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [agentes, setAgentes] = useState<Agent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Agent[] | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Multi-select (chaining)
  const [selectedForChain, setSelectedForChain] = useState<Agent[]>([]);

  // History
  const [agentHistory, setAgentHistory] = useState<Record<string, string>>({});
  const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'translation' | 'logic'>(() => {
    return (localStorage.getItem('agents_panel_tab') as any) || 'content';
  });
  const [translationData, setTranslationData] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('agents_translation_data');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [isTranslatingContent, setIsTranslatingContent] = useState(false);
  const [currentLogicTask, setCurrentLogicTask] = useState<LogicTaskState | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeTimeLeft, setUpgradeTimeLeft] = useState('');
  const [explanationPopup, setExplanationPopup] = useState<{title: string, text: string} | null>(null);

  // Suscripción reactiva al gestor global de tareas de lógica
  useEffect(() => {
    if (!inspectedAgent) {
      setCurrentLogicTask(null);
      return;
    }
    const key = `agent_${inspectedAgent.id || makeAgentKey(inspectedAgent)}`;
    const unsubscribe = logicTaskManager.subscribe(key, (state) => {
      setCurrentLogicTask({ ...state });
    });
    return () => unsubscribe();
  }, [inspectedAgent?.id, inspectedAgent?.title]);

  // Persistir vista y selección en localStorage
  useEffect(() => {
    localStorage.setItem('agents_view', view);
  }, [view]);

  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem('agents_selected_category', JSON.stringify(selectedCategory));
    } else {
      localStorage.removeItem('agents_selected_category');
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubCategory) {
      localStorage.setItem('agents_selected_subcategory', selectedSubCategory);
    } else {
      localStorage.removeItem('agents_selected_subcategory');
    }
  }, [selectedSubCategory]);

  useEffect(() => {
    localStorage.setItem('agents_panel_tab', panelTab);
  }, [panelTab]);

  useEffect(() => {
    if (inspectedAgent) {
      localStorage.setItem('agents_inspected_agent', JSON.stringify(inspectedAgent));
    } else {
      localStorage.removeItem('agents_inspected_agent');
    }
  }, [inspectedAgent]);

  // Restaurar agentes filtrados y agente inspeccionado al cargar allAgents
  useEffect(() => {
    if (allAgents.length === 0) return;
    
    if (view === 'agentes' && selectedCategory && selectedSubCategory) {
      const filtered = allAgents.filter((p) => {
        const parts = (p.category || 'General').split(' > ');
        const main = parts[0].trim();
        const sub = parts[1] ? parts[1].trim() : 'General';
        return main === selectedCategory.id && sub === selectedSubCategory;
      });
      setAgentes(filtered);
    } else if (view === 'agentes' && (!selectedCategory || !selectedSubCategory) && !isSearchMode) {
      setView('categories');
    } else if (view === 'subcategories' && !selectedCategory) {
      setView('categories');
    }

    if (!inspectedAgent) {
      const saved = localStorage.getItem('agents_inspected_agent');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = allAgents.find(a => (a.id && a.id === parsed.id) || makeAgentKey(a) === makeAgentKey(parsed));
          if (found) setInspectedAgent(found);
          else setInspectedAgent(parsed);
        } catch (e) {}
      }
    }
  }, [allAgents]);

  useEffect(() => {
    fetchCategories();
    setAgentHistory(getAgentHistory());
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json?t=' + Date.now());
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

  
  
  const handleTranslate = async () => {
    if (!inspectedAgent) return;
    const key = makeAgentKey(inspectedAgent);
    setPanelTab('translation');
    if (translationData[key]) return;

    setIsTranslatingContent(true);
    setTranslationData(prev => ({ ...prev, [key]: '' }));

    try {
      const promptTranslate = `Traduce el siguiente agente al español manteniendo exactamente el mismo formato, estructura, y variables (como [texto]). No agregues comentarios ni explicaciones adicionales, solo la traducción directa del texto.\n\nAgente:\n${inspectedAgent.instructions || inspectedAgent.content}`;
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'agents_module_assistant',
          message: promptTranslate,
        })
      });
      if (!res.ok) throw new Error('Error al conectar con AgentFactory');

      const data = await res.json();
      const fullText = data.response ?? '';

      setTranslationData(prev => {
        const updated = { ...prev, [key]: fullText };
        localStorage.setItem('agents_translation_data', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error(err);
      setTranslationData(prev => ({ ...prev, [key]: 'Error al generar la traducción. Verifica la conexión con AgentFactory.' }));
    } finally {
      setIsTranslatingContent(false);
    }
  };

  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inspectedAgent) return;
    
    // Determine the text to read based on current tab
    const key = makeAgentKey(inspectedAgent);
    const currentText = panelTab === 'content' 
      ? (inspectedAgent.instructions || inspectedAgent.content)
      : panelTab === 'translation'
      ? (translationData[key] || '')
      : (currentLogicTask?.result || '');
      
    if (!currentText) return;

    setIsTranslating(true);
    try {
      // Background translation to Spanish using AgentFactory
      const promptTTS = `Traduce el siguiente texto al español de forma natural. Si ya esta en español, devuelve el texto original sin modificaciones. No agregues saludos, explicaciones, ni notas adicionales, SOLO el texto traducido. Texto:\n\n${currentText}`;
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'agents_module_assistant',
          message: promptTTS,
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
      const promptText = `Eres un Arquitecto de Agentes de IA de Élite (Staff AI Agent Systems Architect). Tu misión es transformar la descripción o instrucciones de un agente en una DIRECTIVA AUTÓNOMA DE GRADO INDUSTRIAL lista para ser ejecutada en runtime por motores multi-agente modernos (LangGraph, CrewAI, AutoGen o sistemas nativos).

### 1. ARQUITECTURA COGNITIVA Y SELECCIÓN DE PATRÓN
Analiza el agente original delimitado en <agente_original>. Selecciona OBLIGATORIAMENTE el patrón de agente más robusto:
- ReAct (Reasoning + Acting): OBLIGATORIO para agentes que requieren análisis continuo, toma de decisiones dinámica y consultas externas secuenciales [Pensamiento -> Acción -> Observación].
- Plan-and-Solve: OBLIGATORIO para agentes que descomponen problemas de alta complejidad, dividiéndolos en sub-tareas atómicas antes de ejecutar la primera acción.
- Tool-Orchestrator: OBLIGATORIO para agentes cuya principal responsabilidad es invocar APIs, bases de datos o servicios externos con validación estricta de esquemas.
- Reflexion (Self-Correction & Evaluation): OBLIGATORIO para agentes de auditoría, revisión de código o control de calidad que evalúan críticamente su propia salida y corrigen desviaciones.
- Supervisor/Worker: Para agentes que coordinan delegación, control de flujo y sintetización de múltiples fuentes subordinadas.

### 2. REQUISITOS OBLIGATORIOS DE INGENIERÍA PARA AGENTES
1. Identidad y Misión Crítica (Persona & Directive): Define con claridad quirúrgica el rol profesional, alcance operativo y límites infranqueables (lo que tiene PROHIBIDO hacer).
2. Ciclo de Ejecución Autónomo: Describe explícitamente cómo procesa la entrada, descompone la meta, ejecuta y sintetiza el resultado.
3. Contratos de Herramientas y Fallbacks: Define qué herramientas o fuentes de datos consume, validando esquemas y especificando qué hacer si una herramienta externa falla (degradación elegante).
4. Gestión de Memoria y Estado: Reglas para mantener estado relevante de sesión y descarte de ruido.
5. Criterios de Parada y Anti-Bucle (Guardrails): Condición estricta de éxito (Success Criteria), límite de iteraciones para evitar bucles infinitos y gatillos para solicitar confirmación humana (Human-in-the-Loop) ante acciones irreversibles.

### 3. FORMATO CRÍTICO DE RESPUESTA
Responde EXACTAMENTE con esta estructura (manteniendo los encabezados Markdown para procesamiento automatizado):

### EXPLICACION
[Escribe en 2 a 3 líneas la justificación técnica del patrón de agente elegido (ReAct, Plan-and-Solve, etc.) y las mejoras arquitectónicas aplicadas]

### AGENTE MEJORADO
**[FRAMEWORK UTILIZADO: <Nombre del Patrón de Agente Elegido>]**

[Escribe aquí la directiva de agente autónomo completa de grado industrial, estructurada en secciones Markdown (Identidad, Ciclo de Ejecución, Herramientas, Guardrails y Condición de Parada)]

<agente_original>
${inspectedAgent.instructions || inspectedAgent.content}
</agente_original>`;

      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: 'agents_module_assistant',
          message: promptText,
        })
      });

      if (!res.ok) throw new Error('Error de conexión con AgentFactory');

      // Simulate progress while waiting for response
      setUpgradeProgress(50);
      setUpgradeTimeLeft('Procesando...');

      const data = await res.json();
      const generatedText = data.response ?? '';

      setUpgradeProgress(100);
      setUpgradeTimeLeft('¡Listo!');
      
      let finalPrompt = generatedText;
      let explanation = "Mejora generada exitosamente.";
      
      try {
        const expMatch = generatedText.match(/### EXPLICACION\s*([\s\S]*?)(?:### AGENTE MEJORADO|### PROMPT MEJORADO|$)/i);
        const promptMatch = generatedText.match(/(?:### AGENTE MEJORADO|### PROMPT MEJORADO)\s*([\s\S]*)$/i);
        
        if (expMatch && expMatch[1]) {
          explanation = expMatch[1].trim();
        }
        if (promptMatch && promptMatch[1]) {
          finalPrompt = promptMatch[1].trim();
        }
      } catch (e) {
        console.warn("Error al extraer secciones del texto generado.");
      }

      const newAgent: Agent = {
        ...inspectedAgent,
        id: (inspectedAgent.id || Date.now().toString()) + '-upgraded',
        title: inspectedAgent.title + ' (Upgrade)',
        instructions: finalPrompt,
        content: finalPrompt,
        upgradeExplanation: explanation
      };
      
      let upgraded: Agent[] = [];
      try {
        upgraded = JSON.parse(localStorage.getItem('upgraded_agents') || '[]');
      } catch (e) {}
      // Remove previous duplicate if re-upgraded
      upgraded = upgraded.filter(a => a.id !== newAgent.id && a.title !== newAgent.title);
      upgraded.unshift(newAgent);
      localStorage.setItem('upgraded_agents', JSON.stringify(upgraded));
      
      // Persist also to backend disk storage
      try {
        fetch(`${API_URL}/prompts/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newAgent.title,
            content: newAgent.instructions,
            category: newAgent.category || 'Agentes > Master Agents',
            id: newAgent.id,
            upgradeExplanation: newAgent.upgradeExplanation
          })
        }).catch(err => console.warn('Sync backend agent save error:', err));
      } catch (err) {
        console.warn('Silent save failed:', err);
      }

      setAllAgents(prev => [newAgent, ...prev.filter(a => a.id !== newAgent.id)]);
      setAgentes(prev => [newAgent, ...prev.filter(a => a.id !== newAgent.id)]);
      setSearchResults(prev => prev ? [newAgent, ...prev.filter(a => a.id !== newAgent.id)] : null);
      setInspectedAgent(newAgent);
      setExplanationPopup({ title: newAgent.title, text: explanation });
    } catch (err) {
      console.error(err);
      alert('Error al mejorar el agente. Verifica que Ollama este funcionando.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleLogic = () => {
    if (!inspectedAgent) return;
    setPanelTab('logic');
    const key = `agent_${inspectedAgent.id || makeAgentKey(inspectedAgent)}`;
    const textToAnalyze = inspectedAgent.instructions || inspectedAgent.content;
    logicTaskManager.startTask(key, textToAnalyze, inspectedAgent.title);
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
  };

  // ─── SINGLE SET ───────────────────────────────────────────────────────────
  const handleSetAgent = (e: React.MouseEvent, agent: Agent) => {
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
      className="bg-gray-900 border border-orange-400 rounded-2xl p-4 cursor-pointer hover:border-orange-400 hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col justify-between min-h-[10.5rem]"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="bg-blue-900/40 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-400 w-fit">
              {cat.totalCount.toLocaleString()} Agentes
            </span>
            <span className="text-gray-600 text-[11px]">{cat.subCategories.length} subcat.</span>
          </div>
          <button
            onClick={(e) => handleSpeak(e, `${cat.title}. Category with ${cat.subCategories.length} subcategories.`)}
            className="text-gray-400 hover:text-white bg-gray-800 p-1.5 rounded-full transition-colors flex-shrink-0"
            title="Traducir y Escuchar"
          >
            <SpeakerHigh size={15} />
          </button>
        </div>
        <h3 className="font-bold text-lg text-orange-400 mb-2 leading-tight truncate">{cat.title}</h3>
      </div>
      
      <div className="overflow-hidden">
        {cat.subCategories.slice(0, 4).map((sub, i) => (
          <div key={i} className="text-xs text-gray-500 truncate flex items-center gap-1 mb-0.5 leading-snug">
            <CaretRight size={10} className="text-blue-500/70 flex-shrink-0" /> <span className="truncate">{sub.name}</span>
            <span className="text-gray-600 ml-auto flex-shrink-0 text-[11px]">{sub.count}</span>
          </div>
        ))}
        {cat.subCategories.length > 4 && (
          <div className="text-[11px] text-blue-500 mt-0.5 font-medium">+{cat.subCategories.length - 4} más...</div>
        )}
      </div>
    </div>
  );

  const recentAgents = useMemo(() => {
    if (!allAgents.length) return [];
    
    let upgradedList: Agent[] = [];
    try {
      upgradedList = JSON.parse(localStorage.getItem('upgraded_agents') || '[]');
    } catch (e) {}

    const historyEntries = Object.entries(agentHistory).map(([key, ts]) => ({ key, ts: new Date(ts).getTime() }));
    historyEntries.sort((a, b) => b.ts - a.ts);
    
    const recent: Agent[] = [];
    
    for (const u of upgradedList) {
      if (!recent.some(r => r.title === u.title)) {
        recent.push(u);
      }
    }

    for (const entry of historyEntries) {
      const p = allAgents.find(a => makeAgentKey(a) === entry.key);
      if (p && !recent.some(rp => rp.title === p.title)) {
        recent.push(p);
      }
      if (recent.length >= 15) break;
    }

    if (recent.length === 0) {
      return allAgents.slice(0, 10);
    }

    return recent;
  }, [allAgents, agentHistory]);

  return (
    <div className="flex h-screen bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">
      
      {/* Left Column: Directory */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Fixed Top Section: Header, Search & Filters */}
        <div className="flex-shrink-0 px-8 pt-5 pb-3 bg-[#0a0c10]/95 backdrop-blur-md border-b border-orange-400/80 z-20 shadow-md">
          <header className="mb-4 text-center">
            <h1 className="text-3xl font-bold text-orange-400 tracking-wide">Directorio de Agentes</h1>
            <p className="text-gray-400 mt-1 text-xs">Análisis Milimétrico de Skills y Agentes de IA</p>
          </header>

          {/* ─── SEARCH BOX ─────────────────────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Describe el resultado que quieres lograr... ej: 'lanzar mi startup con pitch deck y estrategia de ventas'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-gray-900 border border-orange-400 rounded-xl p-3.5 text-white outline-none focus:border-blue-500 transition-colors shadow-lg text-sm"
                />
                <button
                  onClick={handleImprove}
                  className="bg-transparent border border-orange-500 text-orange-400 hover:bg-orange-500/20 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                >
                  <MagicWand size={18} /> Mejorar
                </button>
                <button
                  onClick={handleSearch}
                  className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                >
                  <MagnifyingGlass size={18} /> Buscar
                </button>
                <button
                  onClick={handleSuggestFlows}
                  disabled={isSuggesting}
                  className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-wait text-sm"
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
                <div className="mt-2 bg-gray-900/90 border border-orange-400 rounded-2xl p-4 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                  {isSuggesting && (
                    <div className="flex items-center gap-3 text-emerald-300 text-sm">
                      <span className="animate-spin text-lg">⚙️</span>
                      <span>La IA está mejorando tu texto y diseñando el flujo de trabajo ideal...</span>
                    </div>
                  )}

                  {suggestError && (
                    <div className="text-red-400 text-sm">{suggestError}</div>
                  )}

                  {enhancedQuery && !isSuggesting && (
                    <div className="mb-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-2 flex items-start gap-2">
                      <Sparkle size={14} className="mt-0.5 flex-shrink-0" />
                      <span><strong>Búsqueda enriquecida:</strong> "{enhancedQuery}"</span>
                    </div>
                  )}

                  {recommendedFlow && (
                    <div className="mb-4 bg-emerald-950/40 border border-orange-400/60 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">⭐ Flujo Recomendado por la IA</div>
                          <h4 className="text-white font-bold text-sm">{recommendedFlow.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{recommendedFlow.description}</p>
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
                            className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Abrir en Builder →
                          </button>
                          <button
                            onClick={() => saveFlowToNexus(recommendedFlow)}
                            className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Guardar en Nexus
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {flowAlternatives.length > 0 && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">Flujos alternativos</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {flowAlternatives.map((alt) => (
                          <button
                            key={alt.id}
                            onClick={() => navigate('/flows')}
                            className="text-left bg-gray-800/60 hover:bg-gray-800 border border-orange-400 hover:border-emerald-600/60 rounded-xl p-2.5 transition-all group"
                          >
                            <div className="text-xs font-semibold text-gray-200 group-hover:text-emerald-300 flex items-center justify-between">
                              <span>{alt.name}</span>
                              <span className="text-[10px] text-emerald-500">Ver flujo ›</span>
                            </div>
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

          {/* ─── BREADCRUMB ─────────────────────────────────────────────────────── */}
          {(view !== 'categories' || isSearchMode) && (
            <div className="mt-3">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-gray-900 rounded-lg w-fit border border-orange-400"
              >
                <ArrowLeft size={16} />
                {view === 'subcategories' ? 'Volver a Categorías' : selectedSubCategory ? `Volver a ${selectedCategory?.title}` : 'Volver a Categorías'}
              </button>
            </div>
          )}
        </div>

        {/* Middle Scrollable Section: Directory Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-10">

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      ) : view === 'categories' && !isSearchMode ? (

        /* ─── CATEGORÍAS ──────────────────────────────────────────────────── */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((cat, idx) => renderCategoryCard(cat, idx))}
          </div>
        </div>

      ) : view === 'subcategories' && selectedCategory ? (

        /* ─── SUBCATEGORÍAS ───────────────────────────────────────────────── */
        <div>
          <h2 className="text-2xl font-bold text-orange-400 mb-1">{selectedCategory.title}</h2>
          <p className="text-gray-500 mb-6">{selectedCategory.totalCount.toLocaleString()} agentes en {selectedCategory.subCategories.length} subcategorías</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {selectedCategory.subCategories.map((sub, idx) => (
              <div
                key={idx}
                onClick={() => handleSubCategoryClick(sub.name)}
                className="bg-gray-900 border border-orange-400 rounded-xl p-5 cursor-pointer hover:border-orange-400 hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between min-h-[8rem]"
              >
                <h3 className="font-semibold text-orange-400 text-md leading-snug">{sub.name}</h3>
                <span className="mt-3 bg-blue-900/30 text-blue-400 text-xs font-bold px-2 py-1 rounded-full border border-orange-400/40 w-fit">
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
              <h2 className="text-2xl font-bold text-orange-400">{selectedSubCategory}</h2>
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
              const isGenerated = isGeneratedAgent(agent);
              const activeClass = 'bg-orange-950/40 border-orange-400';
              const isInspected = (inspectedAgent && makeAgentKey(inspectedAgent) === key) || inspectedAgent === agent;

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setInspectedAgent(agent);
                  }}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${
                    inChain
                      ? (isGenerated ? 'bg-black/80 border-orange-400' : 'bg-black/80 border-orange-400')
                      : isInspected
                        ? activeClass
                        : (isGenerated ? 'bg-black/40 border-orange-400 hover:border-orange-400' : 'bg-black/40 border-orange-500/50 hover:border-orange-500')
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
                        <span className={`${isGenerated ? 'text-blue-400/70' : 'text-green-500/70'} text-[10px] leading-tight`}>🕐 {formatDate(lastOpened)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Chain / Selection toggle — always visible */}
                      <button
                        onClick={(e) => toggleChainSelect(e, agent)}
                        className={`p-2 rounded-full border transition-colors ${inChain ? 'bg-orange-500 border-orange-400 text-white' : 'border-orange-400 text-orange-400 bg-transparent hover:bg-orange-900/30'}`}
                        title={inChain ? 'Quitar del flujo' : 'Seleccionar agente'}
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
                    <h3 className="font-bold text-lg text-orange-400 line-clamp-2 leading-snug flex-1">{agent.title}</h3>
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
                        <div key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-gray-800/40 p-2.5 rounded-lg border border-orange-400/50">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-orange-500/30 mt-0.5">
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
                    <p className={`text-sm line-clamp-4 flex-1 leading-relaxed ${isGenerated ? 'text-blue-400/80' : 'text-gray-400'}`}>{agent.instructions || agent.content}</p>
                  )}

                  <div className="mt-4">
                    <></>
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

        </div> {/* End Middle Scrollable Section */}

        {/* ─── CHAIN TOOLBAR ──────────────────────────────────────────────────── */}
        {selectedForChain.length > 0 && (
          <div className="absolute bottom-[230px] left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-orange-500 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 max-w-3xl w-full mx-4">
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
            <></>
            <button onClick={() => setSelectedForChain([])} className="text-gray-500 hover:text-white p-2">
              <X size={18} />
            </button>
          </div>
        )}

        {/* ─── FIXED BOTTOM TICKER: CINTA DE AGENTES RECIÉN ABIERTOS (IGUAL A ATLAS) ─── */}
        {recentAgents.length > 0 && (
          <div className="flex-shrink-0 border-t border-orange-400/80 bg-[#0a0c10]/95 backdrop-blur-md z-20 py-4 px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Clock weight="fill" className="text-green-500" size={20} />
              <h3 className="text-sm font-bold text-orange-400 tracking-wide uppercase">Agentes Recién Abiertos</h3>
            </div>
            <style>{`
              @keyframes marquee-recent-bottom {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-recent-bottom {
                animation: marquee-recent-bottom 30s linear infinite;
                width: max-content;
              }
              .animate-marquee-recent-bottom:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="overflow-hidden relative w-full">
              <div className="flex animate-marquee-recent-bottom gap-4 py-1">
                {recentAgents.concat(recentAgents).map((agent, i) => {
                  const key = makeAgentKey(agent);
                  const isInspected = inspectedAgent === agent || (inspectedAgent && makeAgentKey(inspectedAgent) === key);
                  const isGenerated = isGeneratedAgent(agent);
                  const activeClass = 'bg-orange-950/40 border-orange-400';
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setInspectedAgent(agent); 
                        const now = new Date().toISOString();
                        setAgentHistoryEntry(key, now);
                        setAgentHistory(prev => ({ ...prev, [key]: now }));
                      }}
                      className={`w-[320px] h-36 rounded-2xl p-4 shrink-0 shadow-lg relative cursor-pointer transition-colors flex flex-col justify-between overflow-hidden group border ${
                        isInspected 
                          ? activeClass 
                          : (isGenerated ? 'bg-black/40 border-orange-400 hover:border-orange-400' : 'bg-black/40 border-orange-500/50 hover:border-gray-500')
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-bold text-sm line-clamp-1 flex-1 leading-snug ${isGenerated ? 'text-blue-300' : 'text-gray-100'}`}>{agent.title}</h4>
                          {isGenerated && (
                            <span className="text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-orange-400 px-1.5 py-0.5 rounded-full flex-shrink-0">IA</span>
                          )}
                        </div>
                        <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isGenerated ? 'text-blue-400/80' : 'text-gray-500'}`}>
                          {agent.instructions || agent.content}
                        </p>
                      </div>
                      <div className={`text-[10px] uppercase font-bold tracking-widest mt-1 truncate ${isGenerated ? 'text-blue-400' : 'text-blue-500'}`}>
                        {agent.category?.split(' > ').pop() || 'Agente'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div> {/* End Left Column */}

      {/* Right Column: AI & Inspected Agent */}
      <div className="w-96 md:w-[600px] border-l border-orange-400 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl">
        <div className="p-5 border-b border-orange-400 flex items-center justify-between bg-gray-900/50">
          <h2 className="font-bold text-orange-400 flex items-center gap-2"><Sparkle size={18} className="text-blue-400" /> Panel del Agente</h2>
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
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest border-b border-orange-400 pb-2 mb-1">Herramientas IA</div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={handleUpgrade} 
                      disabled={isUpgrading}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-orange-400 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isUpgrading ? '⚡ Upgrade...' : '✨ Upgrade'}
                    </button>
                    <button 
                      onClick={handleTTS}
                      disabled={isTranslating}
                      className="rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-orange-400 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] disabled:opacity-50"
                    >
                      {isTranslating ? '🔊 Traduciendo...' : '🗣️ TTS'}
                    </button>
                    <button 
                      onClick={handleLogic}
                      className={`rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-orange-400 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] ${panelTab === 'logic' ? 'text-blue-400 border-blue-500 bg-blue-950/30' : ''}`}
                    >
                      {currentLogicTask?.isRunning ? '🧠 Analizando...' : '🧠 Lógica'}
                    </button>
                  </div>

                  <div className="flex gap-2 mt-2 w-full">
                    <button 
                      onClick={() => setPanelTab('content')} 
                      className={`flex-1 text-sm font-bold px-3 py-2 rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${panelTab === 'content' ? 'bg-gray-800 text-white border-gray-500' : 'bg-transparent text-gray-400 border-orange-400 hover:text-gray-200'}`}
                    >
                      💬 Original
                    </button>
                    <button 
                      onClick={handleTranslate} 
                      className={`flex-1 text-sm font-bold px-3 py-2 rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${panelTab === 'translation' ? 'bg-green-900/40 text-green-300 border-green-700/50' : 'bg-transparent text-green-500/70 border-green-900/50 hover:text-green-400 hover:border-green-700'}`}
                    >
                      🇪🇸 Traducir
                    </button>
                  </div>
                  
                  {/* Progress Bar for Upgrade */}
                  {isUpgrading && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-[#7B9C7F] font-medium">
                        <span>Generando mejora...</span>
                        <span>{upgradeProgress}% ({upgradeTimeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-orange-500/50">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${upgradeProgress}%`, backgroundColor: '#4ade80', boxShadow: '0 0 10px rgba(74,222,128,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar for Logic */}
                  {currentLogicTask?.isRunning && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-blue-400 font-medium">
                        <span>Analizando lógica interna...</span>
                        <span>{currentLogicTask.progress}% ({currentLogicTask.timeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-orange-500/50">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${currentLogicTask.progress}%`, backgroundColor: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Titulo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="pr-2">
                    <span className={`text-xs font-bold uppercase tracking-widest ${isGeneratedAgent(inspectedAgent) ? 'text-blue-400' : 'text-emerald-400'}`}>{inspectedAgent.category?.split(' > ').pop() || 'Agente'}</span>
                    <h3 className={`text-2xl font-bold mt-1 leading-tight ${isGeneratedAgent(inspectedAgent) ? 'text-blue-300' : 'text-white'}`}>{inspectedAgent.title}</h3>
                  </div>
                </div>
                
                {/* Contenido (Markdown) */}
                <div className={`p-6 rounded-xl border border-orange-400 leading-relaxed prose prose-invert max-w-none shadow-inner bg-gray-900/80 ${
                  panelTab === 'logic' 
                    ? 'text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400' 
                    : isGeneratedAgent(inspectedAgent)
                      ? 'prose-p:text-blue-400 prose-headings:text-blue-400 prose-strong:text-blue-400 text-blue-400' 
                      : 'prose-p:text-[#4ade80] prose-headings:text-[#4ade80] prose-strong:text-[#4ade80] text-[#4ade80]'
                } prose-p:text-[1.15rem] prose-p:font-bold prose-p:leading-snug prose-headings:text-[1.15rem] prose-headings:font-bold`}>
                  {panelTab === 'content' && (
                    <ReactMarkdown>{inspectedAgent.instructions || inspectedAgent.content}</ReactMarkdown>
                  )}
                  {panelTab === 'translation' && (
                    <ReactMarkdown>{translationData[makeAgentKey(inspectedAgent)] || (isTranslatingContent ? '🇪🇸 Conectando y traduciendo...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                  {panelTab === 'logic' && (
                    <ReactMarkdown>{currentLogicTask?.result || (currentLogicTask?.isRunning ? '🧠 Analizando lógica interna y arquitectura del agente...' : 'Presiona el botón "🧠 Lógica" para analizar la estructura y funcionamiento de este agente.')}</ReactMarkdown>
                  )}
                </div>
                
              </div>

              {/* Footer — flex sibling, always visible at bottom */}
              <div className="panel-footer">
                <></>
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050a0f]/60 backdrop-blur-md"
          style={{ 
            animation: 'fadeIn 0.2s ease-out' 
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          <div className="bg-[#0a0c10] border border-orange-400 rounded-2xl p-6 max-w-md w-full relative">
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
              <h3 className="text-xl font-bold text-orange-400">Mejora Aplicada</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Explicación de la optimización y cambios en <strong>{explanationPopup.title}</strong>:
            </p>
            <div className="bg-gray-900 border border-orange-400 p-4 rounded-xl text-gray-300 text-sm leading-relaxed custom-scrollbar max-h-48 overflow-y-auto">
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
                className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                🔊 Escuchar
              </button>
              <button 
                onClick={() => {
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                  setExplanationPopup(null);
                }}
                className="bg-transparent border border-orange-400 text-orange-400 hover:bg-cyan-500/20 px-6 py-2 rounded-lg font-medium transition-colors"
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
