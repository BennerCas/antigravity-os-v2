import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BuilderNodeData } from '../types/builder';
import { sendToBuilderBridge } from '../lib/builderBridge';
import { API_URL } from '../lib/api';
import {
  SpeakerHigh, ArrowLeft, MagnifyingGlass, MagicWand,
  CaretRight, CheckSquare, Square, X, Sparkle, Clock
} from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import { logicTaskManager, LogicTaskState } from '../lib/logicTaskManager';

interface Prompt {
  id?: string;
  title: string;
  category?: string;
  content: string;
  objective?: string;
  isMultiPrompt?: boolean;
  chain?: Prompt[];
  upgradeExplanation?: string;
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
  // Use content to ensure uniqueness since many prompts share the same title
  const contentPreview = (p.content || '').substring(0, 30).replace(/\W/g, '_');
  return `${p.title}_${(p.category || '').replace(/\W/g, '_')}_${contentPreview}`.slice(0, 120);
}

export function isGeneratedPrompt(p?: Prompt | null): boolean {
  if (!p) return false;
  if (p.category === 'Antigravity OS > Master Prompts' && !p.title?.includes('(Upgrade)')) {
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
  const [view, setView] = useState<'categories' | 'subcategories' | 'prompts'>(() => {
    return (localStorage.getItem('atlas_view') as any) || 'categories';
  });
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
    try {
      const saved = localStorage.getItem('atlas_selected_category');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(() => {
    return localStorage.getItem('atlas_selected_subcategory') || null;
  });
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
      const storedTrans = localStorage.getItem('atlas_translation_data');
      if (storedTrans) setTranslationData(JSON.parse(storedTrans));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json?v=' + Date.now());
      if (!res.ok) throw new Error('Failed to load JSON');
      let data = (await res.json()) as Prompt[];
      
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
      
      // Persistencia de memoria: cargar y fusionar prompts generados/mejorados
      try {
        const storedStr = localStorage.getItem('upgraded_prompts');
        if (storedStr) {
          const storedPrompts = JSON.parse(storedStr) as Prompt[];
          if (Array.isArray(storedPrompts) && storedPrompts.length > 0) {
            const storedKeys = new Set(storedPrompts.map(p => makePromptKey(p)));
            data = [...storedPrompts, ...data.filter(p => !storedKeys.has(makePromptKey(p)))];
          }
        }
      } catch (e) {
        console.error('Error al cargar upgraded_prompts desde localStorage:', e);
      }

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

      // Si el usuario ya está viendo una subcategoría activa, refrescar prompts visibles
      if (selectedCategory && selectedSubCategory) {
        const filtered = data.filter((p) => {
          const parts = (p.category || 'General').split(' > ');
          const main = parts[0].trim();
          const sub = parts[1] ? parts[1].trim() : 'General';
          return main === selectedCategory.id && sub === selectedSubCategory;
        });
        setPrompts(filtered);
      } else if (view === 'prompts' && !isSearchMode) {
        setView('categories');
      } else if (view === 'subcategories' && !selectedCategory) {
        setView('categories');
      }
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

  // --- NUEVOS ESTADOS DEL PANEL ---
  const [inspectedPrompt, setInspectedPrompt] = useState<Prompt | null>(null);
  const [panelTab, setPanelTab] = useState<'content' | 'translation' | 'logic'>(() => {
    return (localStorage.getItem('atlas_panel_tab') as any) || 'content';
  });
  const [translationData, setTranslationData] = useState<Record<string, string>>({});
  const [isTranslatingContent, setIsTranslatingContent] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeTimeLeft, setUpgradeTimeLeft] = useState('');
  const [explanationPopup, setExplanationPopup] = useState<{title: string, text: string} | null>(null);
  const [currentLogicTask, setCurrentLogicTask] = useState<LogicTaskState | null>(null);

  // Suscribirse reactivamente al gestor de lógica según el prompt inspeccionado
  useEffect(() => {
    if (!inspectedPrompt) {
      setCurrentLogicTask(null);
      return;
    }
    const key = `atlas_${makePromptKey(inspectedPrompt)}`;
    const unsubscribe = logicTaskManager.subscribe(key, (state) => {
      setCurrentLogicTask({ ...state });
    });
    return () => unsubscribe();
  }, [inspectedPrompt?.title, inspectedPrompt?.content]);

  // Persistir vista, categorías y pestaña en localStorage
  useEffect(() => {
    localStorage.setItem('atlas_view', view);
  }, [view]);

  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem('atlas_selected_category', JSON.stringify(selectedCategory));
    } else {
      localStorage.removeItem('atlas_selected_category');
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubCategory) {
      localStorage.setItem('atlas_selected_subcategory', selectedSubCategory);
    } else {
      localStorage.removeItem('atlas_selected_subcategory');
    }
  }, [selectedSubCategory]);

  useEffect(() => {
    localStorage.setItem('atlas_panel_tab', panelTab);
  }, [panelTab]);

  useEffect(() => {
    if (inspectedPrompt) {
      localStorage.setItem('atlas_inspected_prompt', JSON.stringify(inspectedPrompt));
    } else {
      localStorage.removeItem('atlas_inspected_prompt');
    }
  }, [inspectedPrompt]);

  useEffect(() => {
    if (allPrompts.length === 0 || inspectedPrompt) return;
    const saved = localStorage.getItem('atlas_inspected_prompt');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = allPrompts.find(p => (p.id && p.id === parsed.id) || makePromptKey(p) === makePromptKey(parsed));
        if (match) setInspectedPrompt(match);
        else setInspectedPrompt(parsed);
      } catch (e) {}
    }
  }, [allPrompts]);



  const handleTTS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inspectedPrompt) return;
    
    const key = makePromptKey(inspectedPrompt);
    const currentText = panelTab === 'content'
      ? inspectedPrompt.content
      : panelTab === 'translation'
      ? (translationData[key] || '')
      : (currentLogicTask?.result || '');
      
    if (!currentText) return;

    setIsTranslating(true);
    try {
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
    if (!inspectedPrompt) return;
    setIsUpgrading(true);
    setUpgradeProgress(0);
    setUpgradeTimeLeft('Calculando...');
    
    try {
      const promptText = `Eres un Ingeniero de Prompts de Élite (Staff Prompt Architect). Tu misión es transformar el prompt provisto en una directiva de grado industrial, maximizando la precisión, coherencia, delimitación contextual y control de fallas en modelos LLM modernos.

### 1. REGLA ESTRICTA DE SELECCIÓN DE FRAMEWORK
Analiza la naturaleza del prompt original delimitado en <prompt_original>. Selecciona OBLIGATORIAMENTE el framework más adecuado bajo estos criterios jerárquicos:
- CREATE (Contexto/Personaje, Rol/Petición, Explicación, Ajustes, Tipo de salida, Extras): OBLIGATORIO para agentes autónomos, sistemas interactivos, flujos complejos o meta-prompts. Queda estrictamente PROHIBIDO degradar un agente o sistema a RTF.
- Chain of Thought (Paso a paso, Razonamiento interno): OBLIGATORIO para lógica, matemáticas, análisis de causa raíz, toma de decisiones críticas o debugging.
- CARE (Contexto, Acción, Resultado, Ejemplo): OBLIGATORIO para análisis de negocio, consultoría, auditorías técnicas o evaluación de datos.
- APE (Acción, Propósito, Expectativa): Para evaluaciones rápidas, decisiones binarias y resúmenes ejecutivos directos.
- RTF (Rol, Tarea, Formato): EXCLUSIVAMENTE para tareas mecánicas, lineales y directas (ej. formatear texto, clasificaciones simples).

### 2. DIRECTRICES DE INGENIERÍA Y BLINDAJE
1. Preservación de Variables: Identifica y mantén intactos todos los placeholders y variables dinámicas en formato [VARIABLE] o {{VARIABLE}}. Si faltan parámetros requeridos, defínelos explícitamente entre corchetes.
2. Contrato Estricto de Salida: Especifica con exactitud la estructura esperada, tono y formato (Markdown/JSON).
3. Restricciones y Anti-Alucinación: Añade instrucciones de qué NO hacer y fuerza al modelo a declarar incertidumbre si no hay información suficiente en vez de inventar hechos o directivas.

### 3. FORMATO CRÍTICO DE RESPUESTA
Responde EXACTAMENTE con esta estructura (manteniendo los encabezados Markdown para procesamiento automatizado):

### EXPLICACION
[Escribe en 2 a 3 líneas la justificación técnica del framework elegido y las mejoras estructurales aplicadas]

### PROMPT MEJORADO
**[FRAMEWORK UTILIZADO: <Nombre del Framework Elegido>]**

[Escribe aquí el prompt optimizado final completo, listo para copiar y pegar, estructurado y autocontenido en Markdown]

<prompt_original>
${inspectedPrompt.content}
</prompt_original>`;

      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
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
      const estimatedTotalTokens = 350;
      
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
              
              const progress = Math.min(99, Math.floor((tokens / estimatedTotalTokens) * 100));
              setUpgradeProgress(progress);
              
              const elapsedSeconds = (Date.now() - startTime) / 1000;
              const tokensPerSecond = tokens / elapsedSeconds;
              const remainingTokens = estimatedTotalTokens - tokens;
              let estimatedSecondsLeft = Math.ceil(remainingTokens / tokensPerSecond);
              if (estimatedSecondsLeft < 1) estimatedSecondsLeft = 1;
              
              setUpgradeTimeLeft(`${estimatedSecondsLeft}s restantes`);
            }
          } catch (e) {
          }
        }
      }
      
      setUpgradeProgress(100);
      setUpgradeTimeLeft('¡Completado!');
      
      let finalPrompt = generatedText;
      let explanation = "Mejora generada exitosamente.";
      
      try {
        const expMatch = generatedText.match(/### EXPLICACION\s*([\s\S]*?)(?:### PROMPT MEJORADO|$)/i);
        const promptMatch = generatedText.match(/### PROMPT MEJORADO\s*([\s\S]*)$/i);
        
        if (expMatch && expMatch[1]) {
          explanation = expMatch[1].trim();
        }
        if (promptMatch && promptMatch[1]) {
          finalPrompt = promptMatch[1].trim();
        }
      } catch (e) {
        console.warn("Error al extraer secciones del texto generado.");
      }

      const targetCategory = inspectedPrompt.category || (selectedCategory && selectedSubCategory ? `${selectedCategory.title} > ${selectedSubCategory}` : 'Antigravity OS > Master Prompts');
      const newPrompt: Prompt = {
        ...inspectedPrompt,
        category: targetCategory,
        id: (inspectedPrompt.id || Date.now().toString()) + '-upgraded',
        title: inspectedPrompt.title.includes('(Upgrade)') ? inspectedPrompt.title : inspectedPrompt.title + ' (Upgrade)',
        content: finalPrompt,
        upgradeExplanation: explanation
      };
      
      setPrompts(prev => [newPrompt, ...prev]);
      setAllPrompts(prev => [newPrompt, ...prev]);

      // Actualizar contadores de categorías en memoria
      setCategories(prev => {
        return prev.map(cat => {
          const parts = (newPrompt.category || '').split(' > ');
          const main = parts[0]?.trim();
          const sub = parts[1]?.trim();
          if (cat.id === main) {
            return {
              ...cat,
              totalCount: cat.totalCount + 1,
              subCategories: cat.subCategories.map(s => s.name === sub ? { ...s, count: s.count + 1 } : s)
            };
          }
          return cat;
        });
      });
      
      // Persistencia de memoria inmediata (localStorage)
      let storedStr = localStorage.getItem('upgraded_prompts');
      let storedPrompts: Prompt[] = [];
      try {
        if (storedStr) storedPrompts = JSON.parse(storedStr);
      } catch (e) {}
      const newKey = makePromptKey(newPrompt);
      storedPrompts = [newPrompt, ...storedPrompts.filter(p => makePromptKey(p) !== newKey && p.id !== newPrompt.id)];
      localStorage.setItem('upgraded_prompts', JSON.stringify(storedPrompts));

      // Registrar en historial para que aparezca en el carrusel de recientes inmediatamente
      const now = new Date().toISOString();
      setPromptHistoryEntry(newKey, now);
      setPromptHistory(prev => ({ ...prev, [newKey]: now }));

      // Persistencia en disco a través del backend FastAPI
      try {
        fetch(`${API_URL}/prompts/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPrompt)
        }).catch(() => { /* backend offline: queda en localStorage */ });
      } catch (e) {}

      setInspectedPrompt(newPrompt);
      setExplanationPopup({ title: newPrompt.title, text: explanation });
      
    } catch (err) {
      console.error(err);
      alert("Error al generar mejora. Asegúrate de tener Ollama corriendo y el modelo hermes3:8b descargado.");
    } finally {
      setIsUpgrading(false);
      setTimeout(() => {
        setUpgradeProgress(0);
        setUpgradeTimeLeft('');
      }, 2000);
    }
  };


  const handleTranslate = async () => {
    if (!inspectedPrompt) return;
    const key = makePromptKey(inspectedPrompt);
    setPanelTab('translation');
    if (translationData[key]) return;

    setIsTranslatingContent(true);
    setTranslationData(prev => ({ ...prev, [key]: '' })); // Initialize empty to start streaming

    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'hermes3:8b',
          prompt: `Traduce el siguiente prompt al español manteniendo exactamente el mismo formato, estructura, y variables (como [texto]). No agregues comentarios ni explicaciones adicionales, solo la traducción directa del texto.\n\nPrompt:\n${inspectedPrompt.content}`,
          stream: true
        })
      });
      if (!res.ok || !res.body) throw new Error('Error al conectar con Ollama');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullText += parsed.response;
              setTranslationData(prev => ({ ...prev, [key]: fullText }));
            }
          } catch (e) {}
        }
      }
      
      // Save to localStorage
      setTranslationData(prev => {
        const updated = { ...prev, [key]: fullText };
        localStorage.setItem('atlas_translation_data', JSON.stringify(updated));
        return updated;
      });
      
    } catch (err) {
      console.error(err);
      setTranslationData(prev => ({ ...prev, [key]: 'Error al generar la traducción. Verifica la conexión con Ollama.' }));
    } finally {
      setIsTranslatingContent(false);
    }
  };

  const handleLogic = () => {
    if (!inspectedPrompt) return;
    setPanelTab('logic');
    const key = `atlas_${makePromptKey(inspectedPrompt)}`;
    logicTaskManager.startTask(key, inspectedPrompt.content, inspectedPrompt.title);
  };

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
    sendToBuilderBridge(navigate, {
      promptChain: selectedForChain.map(p => ({
        title: p.title || 'Paso del Flujo',
        content: p.content || '',
        role: p.category || 'General',
        framework: 'auto',
        llm_model: 'hermes3:8b',
        temperature: 0.7,
        key: makePromptKey(p)
      })),
      promptKey: chainKey
    });
  };

  // ─── SINGLE SET ───────────────────────────────────────────────────────────
  const handleSetPrompt = (e: React.MouseEvent, prompt: Prompt) => {
    e.stopPropagation();
    const key = makePromptKey(prompt);
    const now = new Date().toISOString();
    setPromptHistoryEntry(key, now);
    setPromptHistory(prev => ({ ...prev, [key]: now }));

    sendToBuilderBridge(navigate, {
      prompt: {
        title: prompt.title || 'Prompt',
        content: prompt.content || '',
        role: prompt.category || 'General',
        framework: 'auto',
        llm_model: 'hermes3:8b',
        temperature: 0.7,
        key: key
      },
      promptKey: key
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
    
    // Garantizar que prompts generados en localStorage estén siempre incluidos en la memoria activa
    let currentAll = allPrompts;
    try {
      const storedStr = localStorage.getItem('upgraded_prompts');
      if (storedStr) {
        const storedPrompts = JSON.parse(storedStr) as Prompt[];
        if (Array.isArray(storedPrompts) && storedPrompts.length > 0) {
          const storedKeys = new Set(storedPrompts.map(p => makePromptKey(p)));
          currentAll = [...storedPrompts, ...allPrompts.filter(p => !storedKeys.has(makePromptKey(p)))];
          if (currentAll.length !== allPrompts.length) {
            setAllPrompts(currentAll);
          }
        }
      }
    } catch (e) {}

    const filtered = currentAll.filter((p) => {
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


  const recentPrompts = useMemo(() => {
    if (!allPrompts.length || Object.keys(promptHistory).length === 0) return [];
    
    const historyEntries = Object.entries(promptHistory).map(([key, ts]) => ({ key, ts: new Date(ts).getTime() }));
    historyEntries.sort((a, b) => b.ts - a.ts);
    
    const recent: Prompt[] = [];
    for (const entry of historyEntries) {
      const p = allPrompts.find(p => makePromptKey(p) === entry.key);
      if (p && !recent.some(rp => rp.title === p.title)) {
        recent.push(p);
      }
      if (recent.length >= 10) break;
    }
    return recent;
  }, [allPrompts, promptHistory]);

  return (
    <div className="flex h-screen bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">\n      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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

          {recentPrompts.length > 0 && (
            <div className="mb-10 mt-10 overflow-hidden relative w-full border-t border-b border-gray-800/50 py-8 bg-[#0a0c10]">
              <div className="flex items-center gap-2 mb-6 px-4">
                <Clock weight="fill" className="text-green-500" size={24} />
                <h3 className="text-xl font-bold text-gray-200 tracking-wide">Prompts Recién Abiertos</h3>
              </div>
              <style>{`
                @keyframes marquee-recent {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-marquee-recent {
                  animation: marquee-recent 30s linear infinite;
                  width: max-content;
                }
                .animate-marquee-recent:hover {
                  animation-play-state: paused;
                }
              `}</style>
              <div className="flex animate-marquee-recent gap-6 px-4">
                {recentPrompts.concat(recentPrompts).map((prompt, i) => {
                  const key = makePromptKey(prompt);
                  const isInspected = inspectedPrompt === prompt || (inspectedPrompt && makePromptKey(inspectedPrompt) === key);
                  const isGenerated = isGeneratedPrompt(prompt);
                  const activeClass = isGenerated ? 'active-card-blue' : 'active-card';
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => { 
                      e.stopPropagation(); 
                      setInspectedPrompt(prompt); 
                      const now = new Date().toISOString();
                      setPromptHistoryEntry(key, now);
                      setPromptHistory(prev => ({ ...prev, [key]: now }));
                    }}
                      className={`w-[320px] h-40 rounded-2xl p-5 shrink-0 shadow-lg relative cursor-pointer transition-colors flex flex-col justify-between overflow-hidden group border ${
                        isInspected 
                          ? activeClass 
                          : (isGenerated ? 'bg-[#151515] border-blue-900/40 hover:border-blue-700/60' : 'bg-[#151515] border-[#2A2A2A] hover:border-gray-500')
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-gray-100 line-clamp-1 flex-1 leading-snug">{prompt.title}</h4>
                          {prompt.upgradeExplanation && (
                            <span className="text-[10px] font-bold bg-blue-900/40 text-blue-400 border border-blue-800/50 px-1.5 py-0.5 rounded-full flex-shrink-0">IA</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed">{prompt.content}</p>
                      </div>
                      <div className="text-[10px] uppercase font-bold text-blue-500 tracking-widest mt-2 truncate">
                        {prompt.category?.split(' > ').pop() || 'Prompt'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
              const isInspected = inspectedPrompt === prompt || (inspectedPrompt && makePromptKey(inspectedPrompt) === key);
              const chainPos = selectedForChain.findIndex(p => makePromptKey(p) === key);
              const isGenerated = isGeneratedPrompt(prompt);
              const activeClass = isGenerated ? 'active-card-blue' : 'active-card';

              return (
                <div
                  key={idx}
                  onClick={(e) => { 
                      e.stopPropagation(); 
                      setInspectedPrompt(prompt); 
                      const key = makePromptKey(prompt);
                      const now = new Date().toISOString();
                      setPromptHistoryEntry(key, now);
                      setPromptHistory(prev => ({ ...prev, [key]: now }));
                    }}
                  className={`border rounded-2xl p-6 flex flex-col h-80 relative cursor-pointer transition-all group ${
                    inChain 
                      ? (isGenerated ? 'border-blue-500 active-card-blue' : 'border-[#174A1F] active-card') 
                      : isInspected 
                        ? activeClass 
                        : (isGenerated ? 'bg-[#151515] border-blue-900/40 hover:border-blue-700/60' : 'bg-[#151515] border-[#2A2A2A] hover:border-[#3a3a3a]')
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

                  <div className="flex items-center mb-2"><h3 className="font-bold text-lg text-gray-100 line-clamp-2 leading-snug flex-1">{prompt.title}</h3>{prompt.upgradeExplanation && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExplanationPopup({title: prompt.title, text: prompt.upgradeExplanation!}); }}
                      className="ml-2 text-xs font-bold bg-blue-900/40 text-blue-400 border border-blue-800/50 w-6 h-6 rounded-full flex items-center justify-center hover:bg-blue-800 hover:text-white transition-colors flex-shrink-0"
                      title="Ver explicación de la mejora"
                    >
                      ?
                    </button>
                  )}</div>
                  
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
                          sendToBuilderBridge(navigate, {
                            promptChain: prompt.chain,
                            promptKey: `chain_${Date.now()}`
                          });
                        }}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full flex items-center justify-center gap-2" style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
                      >
                        <Sparkle size={18} /> Enviar Flujo a Builder
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleSetPrompt(e, prompt)}
                        className="active-card-exempt text-white font-bold py-2 px-4 rounded-lg transition-colors w-full cursor-pointer hover:border-[#3b82f6]" style={{ backgroundColor: '#000000', border: '1px solid #2A2A2A' }}
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
      {/* Right Column: Panel */}
      <div className="w-96 md:w-[600px] border-l border-gray-800 bg-[#0f111a] flex flex-col z-20 flex-shrink-0 shadow-2xl">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <h2 className="font-bold text-gray-200 flex items-center gap-2"><Sparkle size={18} className="text-blue-400" /> Panel de Prompt</h2>
          {inspectedPrompt && (
            <button onClick={() => setInspectedPrompt(null)} className="text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {inspectedPrompt ? (
            <div className="flex flex-col h-full">

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" style={{ paddingBottom: '0.5cm' }}>
                
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
                      {isTranslating ? '🔊 TTS...' : '🗣️ TTS'}
                    </button>
                    <button 
                      onClick={handleLogic}
                      className={`rounded bg-gray-800 hover:bg-gray-700 border border-transparent hover:border-blue-500 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all shadow-sm flex-1 min-w-[100px] ${panelTab === 'logic' ? 'text-blue-400 border-blue-500 bg-blue-950/30' : ''}`}
                    >
                      {currentLogicTask?.isRunning ? '🧠 Analizando...' : '🧠 Lógica'}
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mt-2 w-full">
                    <button 
                      onClick={() => setPanelTab('content')} 
                      className={`flex-1 text-sm font-bold px-3 py-2 rounded border transition-colors flex items-center justify-center gap-2 shadow-sm ${panelTab === 'content' ? 'bg-gray-800 text-white border-gray-500' : 'bg-transparent text-gray-400 border-gray-700 hover:text-gray-200'}`}
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

                  {currentLogicTask?.isRunning && (
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-blue-400 font-medium">
                        <span>Analizando lógica interna...</span>
                        <span>{currentLogicTask.progress}% ({currentLogicTask.timeLeft})</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-[#2A2A2A]">
                        <div 
                          className="h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${currentLogicTask.progress}%`, backgroundColor: '#3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{inspectedPrompt.category?.split(' > ').pop() || 'Prompt'}</span>
                    <h3 className="text-2xl font-bold text-white mt-1 leading-tight">{inspectedPrompt.title}</h3>
                  </div>

                </div>
                
                <div className={`bg-gray-900/80 p-6 rounded-xl border border-gray-800 leading-relaxed prose prose-invert max-w-none shadow-inner ${
                  panelTab === 'logic' 
                    ? 'text-sm text-gray-300 prose-sm prose-headings:text-blue-400 prose-a:text-blue-400' 
                    : `${inspectedPrompt.upgradeExplanation ? 'prose-p:text-blue-400 prose-headings:text-blue-400 prose-strong:text-blue-400 text-blue-400' : 'prose-p:text-[#4ade80] prose-headings:text-[#4ade80] prose-strong:text-[#4ade80] text-[#4ade80]'} prose-p:text-[1.15rem] prose-p:font-bold prose-p:leading-snug prose-headings:text-[1.15rem] prose-headings:font-bold`
                }`}>
                  {panelTab === 'content' && (
                    <ReactMarkdown>{inspectedPrompt.content}</ReactMarkdown>
                  )}
                  {panelTab === 'translation' && (
                    <ReactMarkdown>{translationData[makePromptKey(inspectedPrompt)] || (isTranslatingContent ? '🇪🇸 Conectando y traduciendo...' : 'No hay datos.')}</ReactMarkdown>
                  )}
                  {panelTab === 'logic' && (
                    <ReactMarkdown>{currentLogicTask?.result || (currentLogicTask?.isRunning ? '🧠 Conectando y analizando lógica...' : 'Presiona el botón "🧠 Lógica" para analizar la estructura y razonamiento de este prompt.')}</ReactMarkdown>
                  )}
                </div>
                
              </div>

              <div className="panel-footer">
                <button
                  onClick={(e) => handleSetPrompt(e as any, inspectedPrompt)}
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
              <div className="text-6xl mb-4">📝</div>
              <p>Selecciona un prompt en el atlas para ver sus detalles y herramientas de IA.</p>
            </div>
          )}
        </div>
      </div>

      {explanationPopup && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#050a0f]/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="bg-[#12141a] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setExplanationPopup(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkle weight="fill" className="text-blue-400" />
              Mejora Aplicada
            </h3>
            <p className="text-gray-400 mb-4">Explicación de la optimización y cambios en <strong className="text-white">{explanationPopup.title}</strong>:</p>
            <div className="bg-[#0a0c10] border border-gray-800 rounded-xl p-5 text-gray-300 leading-relaxed font-medium mb-6">
              {explanationPopup.text}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(explanationPopup.text);
                    utterance.lang = 'es-ES';
                    utterance.rate = 1.05;
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="text-gray-400 hover:text-white flex items-center gap-2 border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-full transition-colors bg-gray-900"
              >
                <SpeakerHigh size={18} /> Escuchar
              </button>
              
              <button 
                onClick={() => setExplanationPopup(null)}
                className="text-white font-bold bg-transparent border border-gray-600 hover:bg-gray-800 px-6 py-2.5 rounded-full transition-colors"
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

export default Atlas;
