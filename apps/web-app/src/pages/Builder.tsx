import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import type { BuilderNodeData, PromptChainItem, ExecutionResult, UpdatedNode } from '../types/builder';
import { API_URL, WS_EXECUTE_URL } from '../lib/api';
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from '../utils/drawUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowUUpLeft, ArrowUUpRight, FloppyDisk, DownloadSimple, Trash } from '@phosphor-icons/react';

import { MainPromptNode, ActionNode, PostItNode, TraducirNode, EditarNode, DrawingNode, RulerNode, LogicaNode } from '../components/BuilderNodes';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import AgentsLibraryPanel from '../components/builder/AgentsLibraryPanel';

const nodeTypes = {
  mainPrompt: MainPromptNode,
  action: ActionNode,
  traducir: TraducirNode,
  editar: EditarNode,
  postIt: PostItNode,
  drawingNode: DrawingNode,
  rulerNode: RulerNode,
  logicaNode: LogicaNode,
};

const THEMES = [
  "Deep Space", "Cyberpunk", "Nord", "Dracula", "Matrix", "Solarized", "Monokai", 
  "Synthwave", "Oceanic", "Gruvbox", "Ayu Mirage", "Palenight", 
  "Tokyo Night", "Cobalt2", "Night Owl", "Shades of Purple",
  "Material", "One Dark", "Github Dark", "Vesper", "Rose Pine",
  "Neon Orange", "Neon Yellow", "Neon Red", "Neon Cyan", "Neon Green",
  "CyberLED Orange", "CyberLED Yellow", "CyberLED Red", "CyberLED Cyan", "CyberLED Green",
  "Camo Green", "Camo Cyan", "Camo Light", "Camo Blue"
];

import { THEME_STYLES, applyThemeToDocument } from '../lib/themes';

type HistoryState = {
  nodes: Node[];
  edges: Edge[];
};


function DrawingOverlay({ points, cursorMode, strokeColor, strokeWidth, startPos }: { points: number[][]; cursorMode: string; strokeColor: string; strokeWidth: number; startPos: { x: number; y: number } }) {
  const transform = useStore((s) => s.transform);
  if (!points || !startPos) return null;
  
  return (
    <div style={{ 
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
      pointerEvents: 'none', zIndex: 9999, 
      transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`, 
      transformOrigin: '0 0' 
    }}>
      <svg width="1" height="1" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', transform: `translate(${startPos.x}px, ${startPos.y}px)` }}>
        {cursorMode === 'line' ? (
          <line 
            x1={points[0][0]} y1={points[0][1]} 
            x2={points[points.length - 1][0]} y2={points[points.length - 1][1]} 
            stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" 
          />
        ) : (
          <path d={getSvgPathFromStroke(getStroke(points, { size: strokeWidth, thinning: 0.5, smoothing: 0.5, streamline: 0.5 }))} fill={strokeColor} />
        )}
      </svg>
    </div>
  );
};

function BuilderContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { screenToFlowPosition } = useReactFlow();

  const templateFlow = location.state?.templateFlow;
  const restoreFlow = location.state?.restoreFlow;
  const incomingPrompt = location.state?.prompt;
  const incomingChain: PromptChainItem[] | undefined = location.state?.promptChain;
  const promptKey = location.state?.promptKey as string | undefined;
  const restoreCanvas = location.state?.restoreCanvas as boolean | undefined;

  // Un flujo guardado en Nexus llega como restoreFlow {nodes, edges} — mismo canal que templateFlow
  const flowToLoad = templateFlow || (restoreFlow && restoreFlow.nodes ? { nodes: restoreFlow.nodes, edges: restoreFlow.edges || [] } : null);

  const initialPrompt = incomingPrompt || { title: 'Nuevo Prompt', content: "Prompt inicial por defecto" };

  // Build initial nodes: single prompt OR a chain of prompts placed left-to-right
  const buildInitialNodes = (): Node[] => {
    console.log("buildInitialNodes called!");
    console.log("location.state:", location.state);
    console.log("flowToLoad:", flowToLoad);
    if (flowToLoad && flowToLoad.nodes) {
        console.log("Returning flowToLoad.nodes:", flowToLoad.nodes);
        return flowToLoad.nodes;
    }
    if (flowToLoad && flowToLoad.nodes) return flowToLoad.nodes;
    if (incomingChain && incomingChain.length > 0) {
      return incomingChain.map((p: PromptChainItem, i: number) => ({
        id: i === 0 ? 'main' : `chain-${i}`,
        type: 'mainPrompt',
        position: { x: 100 + i * 380, y: 250 },
        data: p,
      }));
    }
    return [{ id: 'main', type: 'mainPrompt', position: { x: 250, y: 250 }, data: initialPrompt }];
  };

  // Build initial edges connecting chain nodes sequentially
  const buildInitialEdges = (): Edge[] => {
    if (flowToLoad && flowToLoad.edges) return flowToLoad.edges;
    if (incomingChain && incomingChain.length > 1) {
      return incomingChain.slice(0, -1).map((_: PromptChainItem, i: number) => ({
        id: `e-chain-${i}`,
        source: i === 0 ? 'main' : `chain-${i}`,
        target: `chain-${i + 1}`,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 3 }
      }));
    }
    return [];
  };

  const canvasNodesKey = promptKey ? `builder_nodes_${promptKey}` : 'builderNodes';
  const canvasEdgesKey = promptKey ? `builder_edges_${promptKey}` : 'builderEdges';

  const [nodes, setNodes] = useState<Node[]>(() => {
    if (restoreCanvas && promptKey) {
      const saved = localStorage.getItem(canvasNodesKey);
      return saved ? JSON.parse(saved) : buildInitialNodes();
    }
    if (flowToLoad || incomingChain || incomingPrompt) {
      return buildInitialNodes();
    }
    const genericSaved = localStorage.getItem('builderNodes');
    if (genericSaved) return JSON.parse(genericSaved);
    return buildInitialNodes();
  });

  const [edges, setEdges] = useState<Edge[]>(() => {
    if (restoreCanvas && promptKey) {
      const saved = localStorage.getItem(canvasEdgesKey);
      return saved ? JSON.parse(saved) : buildInitialEdges();
    }
    if (flowToLoad || incomingChain || incomingPrompt) {
      return buildInitialEdges();
    }
    const genericSaved = localStorage.getItem('builderEdges');
    if (genericSaved) return JSON.parse(genericSaved);
    return buildInitialEdges();
  });

  const [history, setHistory] = useState<HistoryState[]>([{ nodes, edges }]);

  useEffect(() => {
    localStorage.setItem(canvasNodesKey, JSON.stringify(nodes));
    localStorage.setItem(canvasEdgesKey, JSON.stringify(edges));
    localStorage.setItem('builderNodes', JSON.stringify(nodes));
    localStorage.setItem('builderEdges', JSON.stringify(edges));
  }, [nodes, edges, canvasNodesKey, canvasEdgesKey]);

  const initialNavState = useRef({ incomingPrompt, incomingChain, flowToLoad });
  useEffect(() => {
    const { incomingPrompt: p, incomingChain: c, flowToLoad: t } = initialNavState.current;
    if (p || c || t) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location.pathname]);

  
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [theme, setTheme] = useState(() => localStorage.getItem("builderTheme") || "Deep Space");
  const [bgPattern, setBgPattern] = useState(() => localStorage.getItem("builderBgPattern") || "dots");
  const [nodeStyle, setNodeStyle] = useState(() => localStorage.getItem("builderNodeStyle") || "default");

  const [cursorMode, setCursorMode] = useState<'pan' | 'draw' | 'line' | 'erase'>('pan');
  const [strokeColor, setStrokeColor] = useState<string>('#ffffff');
  const [edgeColor, setEdgeColor] = useState<string>('#58a6ff');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [currentDrawNodeId, setCurrentDrawNodeId] = useState<string | null>(null);

  const [showAgentLibrary, setShowAgentLibrary] = useState(false);

  const handleAddAgentNode = (agentData: BuilderNodeData) => {
    const id = uuidv4();
    const selectedNode = nodes.find(n => n.data?.selectedForPdf) || nodes.find(n => n.id === 'main') || nodes[0];
    const x = selectedNode ? selectedNode.position.x + 350 + (Math.random() * 50) : 150;
    const y = selectedNode ? selectedNode.position.y + (Math.random() * 50) : 150;

    const newNode: Node = {
      id,
      type: 'mainPrompt',
      position: { x, y },
      data: {
        ...agentData,
        role: agentData.role || 'Asistente IA',
        framework: 'auto',
        llm_model: 'hermes3:8b',
        temperature: 0.7
      }
    };

    const updatedNodes = [...nodes, newNode];
    let updatedEdges = edges;
    
    if (selectedNode) {
      const newEdge: Edge = {
        id: `e-${selectedNode.id}-${id}`,
        source: selectedNode.id,
        target: id,
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 3 }
      };
      updatedEdges = [...edges, newEdge];
    }

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveHistory(updatedNodes, updatedEdges);
  };

  const [clipboard, setClipboard] = useState<{ nodes: Node[], edges: Edge[] } | null>(null);

  const handleCopy = () => {
    const selected = nodes.filter(n => n.selected);
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map(n => n.id));
    const relevantEdges = edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    setClipboard({ nodes: selected, edges: relevantEdges });
  };

  const handleCut = () => {
    const selected = nodes.filter(n => n.selected);
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map(n => n.id));
    const relevantEdges = edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    setClipboard({ nodes: selected, edges: relevantEdges });
    
    const updatedNodes = nodes.filter(n => !selectedIds.has(n.id));
    const updatedEdges = edges.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target));
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveHistory(updatedNodes, updatedEdges);
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.nodes.length === 0) return;
    const idMap = new Map<string, string>();
    
    const newNodes = clipboard.nodes.map(n => {
      const newId = uuidv4();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + 50, y: n.position.y + 50 },
        selected: true
      };
    });
    
    const newEdges = clipboard.edges.map(e => ({
      ...e,
      id: `e-${idMap.get(e.source) || e.source}-${idMap.get(e.target) || e.target}`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    }));
    
    const unselectedOldNodes = nodes.map(n => ({ ...n, selected: false }));
    const updatedNodes = [...unselectedOldNodes, ...newNodes];
    const updatedEdges = [...edges, ...newEdges];
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveHistory(updatedNodes, updatedEdges);
  };

  const handleGroup = () => {
    const selected = nodes.filter(n => n.selected && !n.parentId);
    if (selected.length < 1) return;
    
    // Use an approximate width/height if measured is not available
    const minX = Math.min(...selected.map(n => n.position.x));
    const minY = Math.min(...selected.map(n => n.position.y));
    const maxX = Math.max(...selected.map(n => n.position.x + (n.measured?.width || 350)));
    const maxY = Math.max(...selected.map(n => n.position.y + (n.measured?.height || 200)));
    
    const padding = 30;
    const groupId = uuidv4();
    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: { x: minX - padding, y: minY - padding },
      style: {
        width: (maxX - minX) + padding * 2,
        height: (maxY - minY) + padding * 2,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px dashed var(--theme-border)',
        borderRadius: '16px',
        zIndex: -1
      },
      data: {}
    };
    
    const selectedIds = new Set(selected.map(n => n.id));
    const updatedNodes = [
      groupNode,
      ...nodes.map(n => {
        if (selectedIds.has(n.id)) {
          return { 
            ...n, 
            parentNode: groupId,
            extent: 'parent' as const,
            position: { x: n.position.x - (minX - padding), y: n.position.y - (minY - padding) }
          };
        }
        return n;
      })
    ];
    setNodes(updatedNodes);
    saveHistory(updatedNodes, edges);
  };

  // AI Action state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // which action is loading
  const [aiError, setAiError] = useState<string | null>(null);
  const BACKEND_URL = API_URL;

  /** Call the backend and create a result node on the canvas */
    /** Call the backend and create a result node on the canvas */
  const handleAiAction = async (
    action: 'upgrade' | 'atomizar' | 'traducir' | 'editar' | 'logica',
    extras?: { target_language?: string; edit_instruction?: string }
  ) => {
    let targetNodes = nodes.filter(n => n.data?.selectedForPdf);
    if (targetNodes.length === 0) {
      const fallback = nodes.find(n => n.id === 'main') || nodes[0];
      if (fallback) targetNodes = [fallback];
    }

    if (targetNodes.length === 0) {
      setAiError('Selecciona o escribe un prompt primero');
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    setAiLoading(action);
    setAiError(null);
    setShowProgressModal(true);
    setProgressTitle(`Procesando: ${action.toUpperCase()}`);
    setProgressDesc('Analizando y conectando con el motor de IA...');
    setProgress(0);
    
    const EST_PER_NODE = 10;
    setTimeRemaining(targetNodes.length * EST_PER_NODE);
    
    const progressInterval = setInterval(() => {
       setTimeRemaining(t => Math.max(1, t - 1));
       setProgress(p => {
         // Fake local increment so the bar moves while waiting for current node
         if (p % 100 >= 95) return p;
         return p + 1;
       });
    }, 1000);

    try {
      let currentNodes = [...nodes];
      let currentEdges = [...edges];

      for (let i = 0; i < targetNodes.length; i++) {
        const sourceNode = targetNodes[i];
        const promptContent = String(sourceNode.data?.content || sourceNode.data?.title || '');
        
        setProgressSubtext(`Nodo ${i + 1} de ${targetNodes.length}`);
        setProgress(Math.floor((i / targetNodes.length) * 100));
        
        if (!promptContent.trim()) continue;

        const res = await fetch(`${BACKEND_URL}/builder/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            prompt_content: promptContent,
            target_language: extras?.target_language || 'Español',
            edit_instruction: extras?.edit_instruction || 'Mejora la claridad y precisión'
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Error del servidor');
        }

        const data = await res.json();
        const actionLabels: Record<string, string> = {
          upgrade: '⬆️ Upgrade',
          atomizar: '⚛️ Variante',
          traducir: '🌍 Traducido',
          editar: '✏️ Editado',
          logica: '🧠 Lógica'
        };

        const newId = `ai-${action}-${Date.now()}-${i}`;
        const newNode: Node = {
          id: newId,
          type: action === 'logica' ? 'logicaNode' : action === 'traducir' ? 'traducir' : action === 'editar' ? 'editar' : 'mainPrompt',
          position: {
            x: (sourceNode.position?.x ?? 250) + 420,
            y: (sourceNode.position?.y ?? 250) + (i * 700) // 700px spacing vertical
          },
          data: {
            title: actionLabels[action],
            content: data.result,
            model: data.model_used
          }
        };

        const newEdge: Edge = {
          id: `e-${sourceNode.id}-${newId}`,
          source: sourceNode.id,
          target: newId,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 }
        };

        currentNodes = [...currentNodes, newNode];
        currentEdges = [...currentEdges, newEdge];
      }

      clearInterval(progressInterval);
      setProgress(100);
      setTimeRemaining(0);
      
      setNodes(currentNodes);
      setEdges(currentEdges);
      saveHistory(currentNodes, currentEdges);

      setTimeout(() => {
        setShowProgressModal(false);
      }, 800);

    } catch (e: unknown) {
      clearInterval(progressInterval);
      setAiError(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setShowProgressModal(false);
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(null);
    }
  };

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressTitle, setProgressTitle] = useState('');
  const [progressDesc, setProgressDesc] = useState('');
  const [progressSubtext, setProgressSubtext] = useState('');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45); // Estimación inicial
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(() => {
    try {
      const saved = localStorage.getItem('builder_executionResult');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  useEffect(() => {
    if (executionResult) localStorage.setItem('builder_executionResult', JSON.stringify(executionResult));
    else localStorage.removeItem('builder_executionResult');
  }, [executionResult]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledCode, setCompiledCode] = useState<string | null>(() => {
    return localStorage.getItem('builder_compiledCode') || null;
  });
  
  useEffect(() => {
    if (compiledCode) localStorage.setItem('builder_compiledCode', compiledCode);
    else localStorage.removeItem('builder_compiledCode');
  }, [compiledCode]);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [finalOutputContent, setFinalOutputContent] = useState("");
  const terminalLogsRef = useRef<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const startExecution = async () => {
    try {
      console.log('startExecution triggered!');
      setIsExecuting(true);
      setShowArtifactModal(false);
      setFinalOutputContent("");
      // Limpiar animaciones al inicio
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false, className: (e.className || "").replace("animated", "") })));
      setNodes((nds) => nds.map((n) => ({ ...n, className: (n.className || "").replace("node-processing", "") })));
      terminalLogsRef.current = ['[BUILD] Compilando grafo actual antes de ejecutar...'];
      setTerminalLogs(terminalLogsRef.current);

      // Compilar SIEMPRE el grafo actual → el runtime ejecuta ESTE código, no uno viejo
      const nodesData = nodes.filter(n => n.type !== 'postIt' && n.type !== 'drawingNode' && n.type !== 'rulerNode').map(n => ({
        id: n.id,
        title: n.data?.title || 'Sin Título',
        content: String(n.data?.content || ''),
        role: n.data?.role || 'Default Agent',
        framework: n.data?.framework || 'auto',
        type: n.type || 'mainPrompt',
        variables: n.data?.variables || '',
        llm_model: n.data?.llm_model || 'hermes3:8b',
        temperature: n.data?.temperature || 0.7,
        output_schema: n.data?.output_schema || '{"type": "object"}'
      }));
      const edgesData = edges.map(e => ({ source: e.source, target: e.target }));

      const compileRes = await fetch(`${API_URL}/compile/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodesData,
          edges: edgesData,
          framework: executionResult?.framework || 'auto',
          execution_plan: executionResult?.execution_plan || ''
        })
      });
      if (!compileRes.ok) {
        throw new Error('Falló la compilación del grafo');
      }
      terminalLogsRef.current = [...terminalLogsRef.current, '[BUILD] Grafo compilado → sandbox/runner.py', 'Iniciando conexión con Runtime...'];
      setTerminalLogs(terminalLogsRef.current);

      const ws = new WebSocket(WS_EXECUTE_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      terminalLogsRef.current = [...terminalLogsRef.current, 'Conectado. Enviando comando run...'];
      setTerminalLogs(terminalLogsRef.current);
      ws.send(JSON.stringify({ command: 'run' }));
    };

    ws.onmessage = (event) => {
      // Ocultar mensaje de NODE-START en la terminal y usarlo para animación
      const dataStr = event.data;
      const nodeStartMatch = dataStr.match(/\[NODE-START\]\s+(.*)/);
      
      if (nodeStartMatch && nodeStartMatch[1]) {
        const activeNodeId = nodeStartMatch[1].trim();
        // Animar nodo específico y los bordes que lo apuntan
        setNodes((nds) => nds.map((n) => ({
          ...n,
          className: n.id === activeNodeId 
            ? ((n.className || "").replace("node-processing", "") + " node-processing").trim()
            : (n.className || "").replace("node-processing", "").trim()
        })));
        
        setEdges((eds) => eds.map((e) => ({
          ...e,
          animated: e.target === activeNodeId,
          className: e.target === activeNodeId 
            ? ((e.className || "").replace("animated", "") + " animated").trim()
            : (e.className || "").replace("animated", "").trim()
        })));
      } else {
        terminalLogsRef.current = [...terminalLogsRef.current, dataStr];
        setTerminalLogs(terminalLogsRef.current);
      }
      
      if (dataStr.includes('[DONE] Process exited with code 0')) {
        const fullText = terminalLogsRef.current.join('\n');
        const match = fullText.match(/Final Output:\s([\s\S]*?)(?:\[DONE\]|$)/);
        if (match && match[1]) {
           setFinalOutputContent(match[1].trim());
        } else {
           // Fallback: Just grab the last chunks if Final Output string is missing somehow
           const lines = terminalLogsRef.current;
           const lastLines = lines.slice(Math.max(lines.length - 20, 0)).join('\n');
           setFinalOutputContent("### Resultado Final\n\n" + lastLines);
        }
        setShowArtifactModal(true);
      }
    };

    ws.onerror = () => {
      setTerminalLogs(prev => [...prev, `Error WebSocket`]);
    };

    ws.onclose = () => {
      setTerminalLogs(prev => [...prev, 'Conexión cerrada.']);
      setIsExecuting(false);
      setShowArtifactModal(true); // Mantiene el panel flotante abierto para que el usuario pueda ver los logs o el error
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false, className: (e.className || "").replace("animated", "") })));
      setNodes((nds) => nds.map((n) => ({ ...n, className: (n.className || "").replace("node-processing", "") })));
    };
    } catch (err) {
      alert('Error in startExecution: ' + err);
      console.error(err);
      setIsExecuting(false);
      setShowArtifactModal(true);
      setEdges((eds) => eds.map((e) => ({ ...e, animated: false, className: (e.className || "").replace("animated", "") })));
      setNodes((nds) => nds.map((n) => ({ ...n, className: (n.className || "").replace("node-processing", "") })));
    }
  };

  const stopExecution = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsExecuting(false);
    setEdges((eds) => eds.map((e) => ({ ...e, animated: false, className: (e.className || "").replace("animated", "") })));
    setNodes((nds) => nds.map((n) => ({ ...n, className: (n.className || "").replace("node-processing", "") })));
  };

  useEffect(() => {
    if (isExecuting && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isExecuting]);

  const handleGenerateScripts = async () => {
    setIsCompiling(true);
    setCompiledCode(null);
    setAiError(null);

    const nodesData = nodes.filter(n => n.type !== 'postIt' && n.type !== 'drawingNode' && n.type !== 'rulerNode').map(n => ({
      id: n.id,
      title: n.data?.title || 'Sin Título',
      content: String(n.data?.content || ''),
      role: n.data?.role || 'Default Agent',
      framework: n.data?.framework || 'auto',
      type: n.type || 'mainPrompt',
      variables: n.data?.variables || '',
      llm_model: n.data?.llm_model || 'hermes3:8b',
      temperature: n.data?.temperature || 0.7,
      output_schema: n.data?.output_schema || '{"type": "object"}'
    }));
    
    const edgesData = edges.map(e => ({
      source: e.source,
      target: e.target
    }));

    try {
      const res = await fetch(`${API_URL}/compile/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodesData,
          edges: edgesData,
          framework: executionResult?.framework || 'auto',
          execution_plan: executionResult?.execution_plan || ''
        })
      });

      if (!res.ok) {
        throw new Error('Error generando scripts');
      }

      const data = await res.json();
      setCompiledCode(data.code || data.result || 'No se generó código');
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : String(e));
      setTimeout(() => setAiError(null), 4000);
    } finally {
      setIsCompiling(false);
    }
  };

  const downloadCode = () => {
    if (!compiledCode) return;
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'runner.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEjecutar = async () => {
    const nodesData = nodes.filter(n => n.type !== 'postIt' && n.type !== 'drawingNode' && n.type !== 'rulerNode').map(n => ({
      id: n.id,
      title: n.data?.title || 'Sin Título',
      content: String(n.data?.content || ''),
      role: n.data?.role || 'Default Agent',
      framework: n.data?.framework || 'auto',
      type: n.type || 'mainPrompt',
      variables: n.data?.variables || '',
      llm_model: n.data?.llm_model || 'hermes3:8b',
      temperature: n.data?.temperature || 0.7,
      output_schema: n.data?.output_schema || '{"type": "object"}'
    }));
    const edgesData = edges.map(e => ({ source: e.source, target: e.target }));

    if (nodesData.length === 0) {
      setAiError('No hay nodos configurables en el canvas para ejecutar');
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    setShowProgressModal(true);
    setProgressTitle('Analizando Grafo y Orquestando...');
    setProgressDesc('Conectando con el motor AI y asignando arquitecturas óptimas (CrewAI / AutoGen / LangGraph).');
    setProgressSubtext('');
    setAiError(null);
    setProgress(0);
    setTimeRemaining(nodesData.length * 5);
    
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p;
        return p + Math.floor(Math.random() * 5) + 1;
      });
      setTimeRemaining(t => Math.max(1, t - 1));
    }, 1000);

    try {
      const res = await fetch(`${BACKEND_URL}/execute/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_description: String(nodes[0]?.data?.content || 'Flujo Automático'),
          nodes: nodesData,
          edges: edgesData
        })
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setTimeRemaining(0);

      if (res.ok) {
        const data = await res.json();
        
        if (data.updated_nodes && Array.isArray(data.updated_nodes)) {
          setNodes((nds) => nds.map(n => {
            const updated = data.updated_nodes.find((u: UpdatedNode) => u.id === n.id);
            if (updated) {
              return {
                ...n,
                data: {
                  ...n.data,
                  content: updated.content || n.data.content,
                  role: updated.role || n.data.role,
                  framework: updated.framework || n.data.framework,
                  variables: updated.variables || n.data.variables
                }
              };
            }
            return n;
          }));
        }

        setTimeout(() => setExecutionResult(data), 500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAiError(errData.detail || 'Error al orquestar la ejecución');
      }
    } catch (err: unknown) {
      clearInterval(progressInterval);
      console.error(err);
      setAiError('No se pudo conectar con el motor local');
    } finally {
      setTimeout(() => {
        setShowProgressModal(false);
        setProgress(0);
      }, 600);
    }
  };
const [activeDrawPoints, setActiveDrawPoints] = useState<number[][] | null>(null);
  const activeDrawStartPos = useRef({ x: 0, y: 0 });

  const [showMinimap, setShowMinimap] = useState(false);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [showControls, setShowControls] = useState(false);

  const handleUpdateNode = useCallback((nodeId: string, newData: BuilderNodeData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes]);

  const handleAddVariantNode = useCallback((originalNodeId: string, suggestedData: BuilderNodeData) => {
    setNodes(nds => {
      const originalNode = nds.find(n => n.id === originalNodeId);
      if (!originalNode) return nds;
      
      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: originalNode.type,
        position: { x: originalNode.position.x + 350, y: originalNode.position.y },
        data: {
          ...originalNode.data,
          ...suggestedData,
          isVariant: true
        }
      };
      
      // Auto-connect it to the original node
      setEdges(eds => [...eds, {
        id: `edge-${Date.now()}`,
        source: originalNode.id,
        target: newNode.id,
        sourceHandle: 'sr',
        targetHandle: 'tl',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--theme-text)', strokeWidth: 2 }
      }]);
      
      return [...nds, newNode];
    });
  }, [setNodes, setEdges]);


  useEffect(() => {
    const handleNodeDelete = (e: CustomEvent) => {
      const { id } = e.detail;
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    };
    window.addEventListener('deleteNode', handleNodeDelete as EventListener);
    return () => window.removeEventListener('deleteNode', handleNodeDelete as EventListener);
  }, []);

  const saveHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 3 }
      } as Edge;
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
      saveHistory(nodes, newEdges);
    },
    [edges, nodes, saveHistory, edgeColor]
  );

  const handleAddNode = (type: string, title: string) => {
    const id = uuidv4();
    
    // Determine context (selected node or main prompt)
    const selectedNode = nodes.find(n => n.data?.selectedForPdf) || nodes.find(n => n.id === 'main') || nodes[0];
    
    const x = selectedNode ? selectedNode.position.x + 350 + (Math.random() * 50) : 550;
    const y = selectedNode ? selectedNode.position.y + (Math.random() * 50) : 150;
    
    const sourceContent = String(selectedNode ? (selectedNode.data?.content || selectedNode.data?.prompt || selectedNode.data?.note || '') : '');
    
    let newNode: Node;
    
    if (type === 'traducir') {
      newNode = { id, type: 'traducir', position: { x, y }, data: { content: sourceContent || "Texto para traducir" } };
    } else if (type === 'editar') {
      newNode = { id, type: 'editar', position: { x, y }, data: { content: sourceContent || "Texto para editar" } };
    } else if (type === 'postIt') {
      newNode = { id, type: 'postIt', position: { x, y }, data: { note: '' } };
    } else if (type === 'rulerNode') {
      newNode = { id, type: 'rulerNode', position: { x, y }, data: {} };
    } else if (type === 'logicaNode') {
      newNode = { id, type: 'logicaNode', position: { x, y }, data: { content: "Explicando la lógica de:\n\n" + sourceContent } };
    } else {
      newNode = {
        id,
        type: 'action',
        position: { x, y },
        data: { actionType: title, content: `Generando [${title}] basado en:\n\n` + (sourceContent.length > 50 ? sourceContent.substring(0, 50) + '...' : sourceContent) }
      };
    }

    const updatedNodes = [...nodes, newNode];
    let updatedEdges = edges;
    
    // Automatically connect if there's a selected node
    if (selectedNode && type !== 'rulerNode' && type !== 'postIt') {
      const newEdge: Edge = {
        id: `e-${selectedNode.id}-${id}`,
        source: selectedNode.id,
        target: id,
        animated: true,
        style: { stroke: edgeColor, strokeWidth: 3 }
      };
      updatedEdges = [...edges, newEdge];
    }

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveHistory(updatedNodes, updatedEdges);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: crypto.randomUUID(),
        name: "Flow " + new Date().toLocaleTimeString(),
        description: "Flow guardado desde Builder",
        nodes: nodes,
        edges: edges
      };
      const res = await fetch(`${API_URL}/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Flujo guardado con éxito y disponible en Flows.");
      } else {
        alert("Error al guardar flujo.");
      }
    } catch (e) {
      alert("Error: " + e);
    }
  };

  const exportPDF = async () => {
    const reactFlowEl = document.querySelector('.react-flow') as HTMLElement;
    if (!reactFlowEl) return;
    
    const selectedNodes = nodes.filter(n => n.data.selectedForPdf === true);
    const hiddenElements: HTMLElement[] = [];
    
    if (selectedNodes.length > 0) {
      const allNodeElements = document.querySelectorAll('.react-flow__node') as NodeListOf<HTMLElement>;
      allNodeElements.forEach(el => {
        const nodeId = el.getAttribute('data-id');
        const isSelected = selectedNodes.some(n => n.id === nodeId);
        if (!isSelected) {
          hiddenElements.push(el);
          el.style.display = 'none';
        }
      });
    }
    
    try {
      const canvas = await html2canvas(reactFlowEl, {
        backgroundColor: null,
        useCORS: true,
        scale: 4,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('builder-v2-export.pdf');
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      alert("Error al exportar a PDF");
    } finally {
      hiddenElements.forEach(el => {
        el.style.display = '';
      });
    }
  };

  
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'pan') return;
    
    if (cursorMode === 'erase') {
      const { clientX, clientY } = e;
      const target = document.elementFromPoint(clientX, clientY);
      const wrapper = target?.closest('.drawing-node-wrapper');
      
      if (wrapper) {
        // Encontramos un trazo bajo el puntero
        // El id del nodo de ReactFlow se puede obtener del ancestro .react-flow__node
        const rfNode = target?.closest('.react-flow__node');
        if (rfNode) {
          const nodeId = rfNode.getAttribute('data-id');
          if (nodeId) {
            const updatedNodes = nodes.filter((n) => n.id !== nodeId);
            setNodes(updatedNodes);
            saveHistory(updatedNodes, edges);
          }
        }
      }
      return;
    }
    
    e.stopPropagation();

    e.currentTarget.setPointerCapture(e.pointerId);

    const { clientX, clientY } = e;
    const pos = screenToFlowPosition({ x: clientX, y: clientY });
    
    activeDrawStartPos.current = { x: pos.x, y: pos.y };
    setActiveDrawPoints([[0, 0]]);
    setCurrentDrawNodeId(uuidv4());
  };

  
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'pan') return;
    
    if (cursorMode === 'erase') {
      if (e.buttons !== 1) return; // Only erase while dragging (left click held)
      
      const { clientX, clientY } = e;
      const target = document.elementFromPoint(clientX, clientY);
      const wrapper = target?.closest('.drawing-node-wrapper');
      
      if (wrapper) {
        const rfNode = target?.closest('.react-flow__node');
        if (rfNode) {
          const nodeId = rfNode.getAttribute('data-id');
          if (nodeId) {
            setNodes((currentNodes) => {
              if (!currentNodes.find(n => n.id === nodeId)) return currentNodes;
              const updatedNodes = currentNodes.filter((n) => n.id !== nodeId);
              // Optimización: Solo guardamos en historial al levantar el clic para no saturarlo,
              // pero actualizamos la vista inmediatamente.
              return updatedNodes;
            });
          }
        }
      }
      return;
    }

    if (!currentDrawNodeId || !activeDrawPoints) return;


    e.stopPropagation();
    const { clientX, clientY } = e;
    const pos = screenToFlowPosition({ x: clientX, y: clientY });
    
    const relativeX = pos.x - activeDrawStartPos.current.x;
    const relativeY = pos.y - activeDrawStartPos.current.y;
    
    setActiveDrawPoints(prev => prev ? [...prev, [relativeX, relativeY]] : [[0, 0], [relativeX, relativeY]]);
  };

  
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cursorMode === 'erase') {
       saveHistory(nodes, edges); // Save after drag-erasing completes
       return;
    }
    if (currentDrawNodeId && activeDrawPoints) {

      e.stopPropagation();
      e.currentTarget.releasePointerCapture(e.pointerId);
      
      const newNode: Node = {
        id: currentDrawNodeId,
        type: 'drawingNode',
        position: { x: activeDrawStartPos.current.x, y: activeDrawStartPos.current.y },
        data: {
          points: activeDrawPoints,
          color: strokeColor,
          size: strokeWidth,
          type: cursorMode === 'line' ? 'line' : 'free'
        },
        draggable: false,
        selectable: false,
        // SELLO DE SEGURIDAD: Previene que ReactFlow oculte el nodo durante el ciclo de medición
        width: 1,
        height: 1
      };

      setCurrentDrawNodeId(null);
      setActiveDrawPoints(null);
      
      const nextNodes = [...nodes, newNode];
      setNodes(nextNodes);
      saveHistory(nextNodes, edges);
    }
  };

  const onNodeClick = (_e: React.MouseEvent, node: Node) => {
    if (cursorMode === 'erase' && node.type === 'drawingNode') {
      const updatedNodes = nodes.filter((n) => n.id !== node.id);
      setNodes(updatedNodes);
      saveHistory(updatedNodes, edges);
    }
  };

  
  useEffect(() => {
    if (cursorMode === 'erase') {
      document.body.classList.add('erase-mode');
    } else {
      document.body.classList.remove('erase-mode');
    }
    return () => document.body.classList.remove('erase-mode');
  }, [cursorMode]);

  const themeStyle = THEME_STYLES[theme] || THEME_STYLES["Dracula"];

  useEffect(() => {
    localStorage.setItem("builderTheme", theme);
    localStorage.setItem("builderBgPattern", bgPattern);
    localStorage.setItem("builderNodeStyle", nodeStyle);
    applyThemeToDocument(theme);
  }, [theme, bgPattern, nodeStyle]);

  return (
    <div className={`w-full h-full relative flex flex-col transition-colors duration-300 theme-node-style-${nodeStyle}`} style={{ ...themeStyle, backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="absolute top-2 left-4 z-[60] backdrop-blur-xl rounded-2xl p-1.5 flex items-center gap-1.5 shadow-2xl transition-colors duration-300 border-2 builder-top-bar max-w-[calc(100vw-220px)] overflow-x-auto custom-scrollbar" style={{ backgroundColor: "var(--theme-bar)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}>
        <style>{`
          .builder-top-bar::-webkit-scrollbar { height: 4px; }
          .builder-top-bar::-webkit-scrollbar-track { background: transparent; }
          .builder-top-bar::-webkit-scrollbar-thumb { background: var(--theme-border); border-radius: 4px; }
          .builder-top-bar { scrollbar-width: thin; scrollbar-color: var(--theme-border) transparent; }
          .theme-btn { color: var(--theme-text); background: var(--theme-bg); transition: all 0.2s; border: 1px solid var(--theme-border); border-radius: 6px; font-weight: 500; font-size: 0.75rem; padding: 4px 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
          .theme-btn:hover { background: var(--theme-border); color: var(--theme-bg); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .theme-btn.active { background: var(--theme-bg) !important; color: var(--theme-text) !important; border-color: #39ff14 !important; box-shadow: 0 0 10px rgba(57, 255, 20, 0.6), inset 0 0 5px rgba(57, 255, 20, 0.2) !important; transform: none; }
          .theme-divider { width: 1px; height: 18px; background: var(--theme-border); opacity: 0.5; margin: 0 4px; flex-shrink: 0; }
          .theme-select { background: var(--theme-card); color: var(--theme-text); border: 1px solid var(--theme-border); padding: 2px 6px; border-radius: 6px; font-weight: 500; font-size: 0.75rem; outline: none; cursor: pointer; flex-shrink: 0; }
          .theme-select:hover { border-color: var(--theme-text); }
          .builder-top-bar .theme-btn, .builder-top-bar span, .builder-top-bar svg { text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
          [data-theme^="Camo"] .builder-top-bar .theme-btn { color: #ffffff !important; }
          [data-theme^="Camo"] .builder-top-bar .theme-select { color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,1); }
          .theme-node-btn { color: var(--theme-text); opacity: 0.5; transition: all 0.2s; }
          .theme-node-btn:hover { opacity: 1; color: var(--theme-text); }
          .theme-node-btn-danger { color: var(--theme-border); opacity: 0.5; transition: all 0.2s; }
          .theme-node-btn-danger:hover { opacity: 1; color: var(--theme-border); }
          .react-flow__controls-button { background-color: var(--theme-card) !important; border-bottom: 1px solid var(--theme-border) !important; fill: var(--theme-text) !important; }
          .react-flow__controls-button:hover { background-color: var(--theme-bg) !important; }
          .theme-node-style-neon .react-flow__node > div { box-shadow: 0 0 25px var(--theme-border), inset 0 0 10px var(--theme-border) !important; border-radius: 12px; }
          .theme-node-style-brutalist .react-flow__node > div { border-radius: 0 !important; border-width: 4px !important; border-style: solid; box-shadow: 8px 8px 0 var(--theme-text) !important; }
          .theme-node-style-glass .react-flow__node > div { background: rgba(0,0,0,0.1) !important; backdrop-filter: blur(12px) !important; border-radius: 16px; border: 1px solid var(--theme-border) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
          .theme-node-style-wireframe .react-flow__node > div { background: transparent !important; border: 2px dashed var(--theme-border) !important; border-radius: 0 !important; }
          .theme-node-style-hologram .react-flow__node > div { background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%) !important; border: 1px solid var(--theme-border) !important; border-radius: 4px; box-shadow: 0 0 15px var(--theme-border); opacity: 0.9; }
          .theme-node-style-hologram .react-flow__node > div::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--theme-border) 3px); opacity: 0.1; pointer-events: none; }
          .theme-node-style-soft .react-flow__node > div { border-radius: 30px !important; border-width: 0 !important; box-shadow: 0 10px 40px rgba(0,0,0,0.4) !important; }
          .theme-node-style-sharp .react-flow__node > div { border-radius: 0 !important; border: 1px solid var(--theme-border) !important; }
          .theme-node-style-terminal .react-flow__node > div { background: #000 !important; color: #0f0 !important; border: 1px solid #0f0 !important; border-radius: 0 !important; font-family: monospace; }
          .theme-node-style-retro .react-flow__node > div { border: 4px solid var(--theme-border) !important; border-radius: 0 !important; box-shadow: inset -4px -4px 0 rgba(0,0,0,0.5), inset 4px 4px 0 rgba(255,255,255,0.2) !important; }
          .theme-node-style-ghost .react-flow__node > div { background: transparent !important; border: 1px solid var(--theme-border) !important; opacity: 0.6; backdrop-filter: blur(4px); }
          .theme-node-style-comic .react-flow__node > div { border: 3px solid #000 !important; border-radius: 20px !important; box-shadow: 6px 6px 0 var(--theme-border) !important; font-family: 'Comic Sans MS', cursive, sans-serif !important; background: var(--theme-card) !important; color: var(--theme-text) !important; }
          .theme-node-style-cutout .react-flow__node > div { border: 2px solid var(--theme-border) !important; border-radius: 24px 0 24px 0 !important; }
          .theme-node-style-cyber .react-flow__node > div { background: repeating-linear-gradient(45deg, var(--theme-card), var(--theme-card) 10px, transparent 10px, transparent 20px) !important; border: 2px solid var(--theme-border) !important; border-radius: 0 !important; }
          .theme-node-style-floating .react-flow__node > div { border-radius: 12px; border: none !important; box-shadow: 0 20px 40px -10px var(--theme-border) !important; transform: translateY(-5px); transition: transform 0.3s; }
          .theme-node-style-metal .react-flow__node > div { background: linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 50%, #424242 100%) !important; border: 1px solid #fff !important; color: #000 !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
          .theme-node-style-blueprint .react-flow__node > div { background: #0044aa !important; border: 2px solid #fff !important; color: #fff !important; font-family: monospace; }
          .theme-node-style-glowing-edges .react-flow__node > div { border: 2px solid var(--theme-border) !important; box-shadow: 0 0 20px var(--theme-border), inset 0 0 20px var(--theme-border) !important; background: transparent !important; }
          .theme-node-style-lcd .react-flow__node > div { background: #9ea786 !important; border: 4px solid #4a523a !important; color: #000 !important; font-family: 'Courier New', monospace; box-shadow: inset 4px 4px 0 rgba(0,0,0,0.1); }
          .theme-node-style-liquid .react-flow__node > div { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50% !important; border: 3px solid var(--theme-border) !important; }

          
        `}</style>
                <button
          onClick={() => {
            if (window.confirm("¿Seguro que deseas limpiar todo el lienzo?")) {
              setNodes([]);
              setEdges([]);
            }
          }}
          className="rounded hover:bg-red-900/40 text-red-400 transition-colors flex items-center gap-1 font-medium text-xs px-2 py-1"
          title="Limpiar todo el lienzo"
        >
          🗑️ Limpiar
        </button>
        <div className="theme-divider"></div>
        <button onClick={handleCopy} className="rounded theme-btn" title="Copiar Nodos (Ctrl+C)">
          📋
        </button>
        <button onClick={handleCut} className="rounded theme-btn" title="Cortar Nodos (Ctrl+X)">
          ✂️
        </button>
        <button onClick={handlePaste} disabled={!clipboard || clipboard.nodes.length === 0} className="rounded disabled:opacity-50 theme-btn" title="Pegar Nodos (Ctrl+V)">
          📝
        </button>
        <button onClick={handleGroup} className="rounded theme-btn" title="Agrupar Nodos">
          📦
        </button>
        <div className="theme-divider"></div>
        <button onClick={handleUndo} disabled={historyIndex === 0} className="rounded disabled:opacity-50 theme-btn" title="Deshacer">
          <ArrowUUpLeft size={16} />
        </button>
        <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="rounded disabled:opacity-50 theme-btn" title="Rehacer">
          <ArrowUUpRight size={16} />
        </button>
        <button onClick={handleSave} className="rounded theme-btn" title="Guardar">
          <FloppyDisk size={16} />
        </button>
        <button onClick={exportPDF} className="rounded theme-btn" title="Exportar PDF">
          <DownloadSimple size={16} />
        </button>
        
        <div className="theme-divider"></div>
        
        <button onClick={() => setCursorMode('pan')} className={`rounded theme-btn ${cursorMode === 'pan' ? 'active' : ''}`} title="Mano (Pan)">🖐️</button>
        <button onClick={() => setCursorMode('draw')} className={`rounded theme-btn ${cursorMode === 'draw' ? 'active' : ''}`} title="Lápiz (Dibujo Libre)">✏️</button>
        <button onClick={() => setCursorMode('line')} className={`rounded theme-btn ${cursorMode === 'line' ? 'active' : ''}`} title="Línea">📏</button>
        <button onClick={() => setCursorMode('erase')} className={`rounded theme-btn ${cursorMode === 'erase' ? 'active' : ''}`} title="Borrador">🧽</button>
        <button onClick={() => handleAddNode('rulerNode', 'Regla')} className="rounded theme-btn" title="Regla">📐</button>
        
                <div className="relative w-5 h-5 rounded-full overflow-hidden border shadow-sm cursor-pointer ml-1 flex-shrink-0" title="Color de Tinta" style={{ borderColor: 'var(--theme-border)' }}>
          <input 
            type="color" 
            value={strokeColor} 
            onChange={(e) => setStrokeColor(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>
        <div className="relative w-5 h-5 rounded-full overflow-hidden border shadow-sm cursor-pointer ml-1 flex-shrink-0" title="Color del Puente (Edge)" style={{ borderColor: 'var(--theme-border)' }}>
          <input 
            type="color" 
            value={edgeColor} 
            onChange={(e) => setEdgeColor(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>
        <input 
          type="range" 
          title="Grosor de Línea" 
          min="1" max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="w-16 cursor-pointer ml-1"
        />
        
        <div className="theme-divider"></div>
        <button onClick={() => setShowMinimap(!showMinimap)} className={`rounded flex items-center gap-1 theme-btn ${showMinimap ? 'active' : ''}`} title="Alternar Minimapa">
          🗺️ MiniMap
        </button>
        <button onClick={() => setShowControls(!showControls)} className={`rounded flex items-center gap-1 theme-btn ${showControls ? 'active' : ''}`} title="Alternar Controles de Zoom">
          🔍 Zoom
        </button>

        <div className="theme-divider"></div>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value)}
          className="rounded outline-none cursor-pointer theme-select max-w-[100px] truncate"
        >
          {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select 
          value={bgPattern} 
          onChange={(e) => setBgPattern(e.target.value)}
          className="rounded outline-none cursor-pointer theme-select max-w-[90px] truncate"
          title="Fondo"
        >
          <option value="dots">Puntos</option>
          <option value="lines">Líneas</option>
          <option value="cross">Cruces</option>
          <option value="none">Ninguno</option>
        </select>
        <select 
          value={nodeStyle} 
          onChange={(e) => setNodeStyle(e.target.value)}
          className="rounded outline-none cursor-pointer theme-select max-w-[110px] truncate"
          title="Estilo de Nodo"
        >
          
          <option value="default">Default</option>
          <option value="neon">Neón Destello</option>
          <option value="brutalist">Brutalista</option>
          <option value="glass">Cristal 3D</option>
          <option value="wireframe">Wireframe</option>
          <option value="hologram">Holograma</option>
          <option value="soft">Suave Redondo</option>
          <option value="sharp">Afilado 0px</option>
          <option value="terminal">Terminal CLI</option>
          <option value="retro">Retro 8-bit</option>
          
          <option value="ghost">Fantasma (Opaco)</option>
          <option value="comic">Cómic (Comic Sans + Sombras)</option>
          <option value="cutout">Recorte (Bordes Invertidos)</option>
          <option value="cyber">Cyberpunk (Líneas diagonales)</option>
          <option value="floating">Flotante (Gravedad Cero)</option>
          <option value="metal">Metal (Gradiente Plateado)</option>
          <option value="blueprint">Plano (Azul Arquitecto)</option>
          <option value="glowing-edges">Bordes Resplandecientes</option>
          <option value="lcd">LCD (Matrix Display)</option>
          <option value="liquid">Líquido (Bordes Ondulados)</option>

        </select>
        <div className="theme-divider"></div>
        
        {/* AI Error Toast */}
        {aiError && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 text-white text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm">
            {aiError}
          </div>
        )}

        <button 
          onClick={() => setShowAgentLibrary(!showAgentLibrary)} 
          className={`rounded theme-btn flex items-center gap-1 ${showAgentLibrary ? 'active' : ''}`} 
          title="Catálogo de Agentes"
        >
          🤖 Agentes
        </button>

        <button
          onClick={() => handleAiAction('upgrade')}
          disabled={!!aiLoading}
          className="rounded flex items-center gap-1 disabled:opacity-50 theme-btn"
          title="Upgrade: Mejora el nodo seleccionado"
        >
          {aiLoading === 'upgrade' ? '⏳' : '⬆️'} Upgrade
        </button>
        <button
          onClick={() => handleAiAction('atomizar')}
          disabled={!!aiLoading}
          className={`rounded flex items-center gap-1 theme-btn ${aiLoading === 'atomizar' ? 'opacity-50 cursor-wait' : ''}`}
          title="Atomizar: Divide un nodo complejo en sub-tareas"
        >
          {aiLoading === 'atomizar' ? '⏳' : '⚛️'} Atomizar
        </button>
        <button
          onClick={() => {
            const lang = prompt('¿A qué idioma traducir?', 'English') || 'English';
            handleAiAction('traducir', { target_language: lang });
          }}
          disabled={!!aiLoading}
          className={`rounded flex items-center gap-1 theme-btn ${aiLoading === 'traducir' ? 'opacity-50 cursor-wait' : ''}`}
          title="Traducir el prompt a otro idioma"
        >
          {aiLoading === 'traducir' ? '⏳' : '🌍'} Traducir
        </button>
        <button
          onClick={() => {
            const instr = prompt('¿Qué editar o cómo regenerar?', 'Hazlo más conciso y directo') || 'Mejora la claridad';
            handleAiAction('editar', { edit_instruction: instr });
          }}
          disabled={!!aiLoading}
          className={`rounded flex items-center gap-1 theme-btn ${aiLoading === 'editar' ? 'opacity-50 cursor-wait' : ''}`}
          title="Editar o regenerar el prompt"
        >
          {aiLoading === 'editar' ? '⏳' : '✏️'} Editar
        </button>
        <button onClick={() => handleAddNode('postIt', 'Nota')} className="rounded flex items-center gap-1 theme-btn" title="Agregar nota libre">
          📝 Nota
        </button>
        <button
          onClick={() => handleAiAction('logica')}
          disabled={!!aiLoading}
          className={`rounded flex items-center gap-1 theme-btn ${aiLoading === 'logica' ? 'opacity-50 cursor-wait' : ''}`}
          title="Explicar la lógica del prompt"
        >
          {aiLoading === 'logica' ? '⏳' : '🧠'} Lógica
        </button>
        
        <div className="w-1 h-1 flex-shrink-0"></div>
      </div>

      {/* Floating Action Button (Ejecutar) - Moved outside the crowded top bar */}
      
      <div className="absolute top-2 right-4 z-[80] flex items-center gap-2">
        {aiLoading && (
          <div className="flex items-center gap-1.5 text-[11px] bg-black/50 text-white px-2 py-1 rounded-md border border-white/10 backdrop-blur-md shadow-lg">
            <span className="animate-spin">⚙️</span>
            <span>Procesando...</span>
          </div>
        )}
        <div 
          className="backdrop-blur-xl rounded-2xl p-1.5 flex items-center shadow-2xl transition-colors duration-300 border-2"
          style={{ backgroundColor: "var(--theme-bar)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}
        >
          <button
            onClick={handleEjecutar}
            disabled={showProgressModal}
            className={`execute-button font-bold flex items-center gap-2 shadow-lg ${showProgressModal ? 'opacity-50 cursor-wait' : 'hover:scale-105 transition-transform hover:shadow-purple-500/30'}`}
            style={{ 
              background: 'linear-gradient(90deg, #a855f7 0%, #3b82f6 100%)', 
              color: '#fff', 
              border: 'none',
              padding: '4px 16px',
              fontSize: '0.75rem',
              borderRadius: '6px',
              height: '100%'
            }}
            title="Ejecutar el flujo con Meta-Orquestador"
          >
            {showProgressModal ? '⏳ Ejecutando...' : '🚀 EJECUTAR'}
          </button>
        </div>
      </div>
      {/* ProgressBar Modal */}
      {showProgressModal && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col items-center">
             <div className="text-4xl mb-4 animate-bounce">🧠</div>
             <h3 className="text-xl font-bold mb-2 text-white text-center">{progressTitle}</h3>
             <p className="text-sm text-zinc-400 mb-6 text-center">{progressDesc}</p>
             
             {progressSubtext && (
               <div className="text-xs font-mono text-purple-400 mb-2 font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                 {progressSubtext}
               </div>
             )}

             <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden mb-2 relative">
               <div 
                 className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                 style={{ width: `${progress}%` }}
               />
             </div>
             <div className="w-full flex justify-between text-xs text-zinc-500 font-mono font-bold uppercase tracking-widest">
                <span>{progress}% Completado</span>
                <span>~ {timeRemaining}s restantes</span>
             </div>
          </div>
        </div>
      )}

      {executionResult && !isExecuting && !showArtifactModal && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                🚀 Meta-Orquestador
              </h2>
              <button onClick={() => setExecutionResult(null)} className="text-zinc-400 hover:text-white p-2 text-xl">✕</button>
            </div>
            
            <div className="mb-4 flex-shrink-0 flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-zinc-800/50">
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Framework Recomendado</div>
                <div className="text-xl font-black" style={{ color: '#a855f7' }}>
                  {executionResult.framework.toUpperCase()}
                </div>
              </div>
              <div className="w-px h-10 bg-zinc-800 mx-2"></div>
              <div>
                <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cerebro Utilizado</div>
                <div className="text-sm font-mono text-zinc-300 bg-zinc-800 px-2 py-1 rounded">
                  {executionResult.model_used}
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col mb-2">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-semibold">Plan Estratégico de Ejecución:</div>
              <div className="flex-1 overflow-y-auto bg-zinc-950/80 rounded-xl border border-zinc-800 shadow-inner p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <pre className="text-sm whitespace-pre-wrap text-zinc-300 font-mono leading-relaxed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  {executionResult.execution_plan}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800/80 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-zinc-500">
                Fase de planificación completada. Falta conectar con el motor de ejecución nativo.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setExecutionResult(null)} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Cerrar
                </button>
                <button 
                  onClick={startExecution}
                  disabled={isExecuting} 
                  className={`px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors hover:bg-green-500 ${isExecuting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span className="text-lg">▶️</span> Ejecutar (Runtime)
                </button>
                <button 
                  onClick={handleGenerateScripts}
                  disabled={isCompiling} 
                  className={`px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors hover:bg-blue-500 ${isCompiling ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span className="text-lg">⚙️</span> {isCompiling ? 'Generando...' : 'Generar Scripts'}
                </button>
              </div>
            </div>
            
            {compiledCode && !isExecuting && (
              <div className="mt-4 flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Código Generado:</div>
                  <button onClick={downloadCode} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors">
                    <DownloadSimple size={14} /> Guardar runner.py
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-zinc-950/80 rounded-xl border border-zinc-800 shadow-inner p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  <pre className="text-sm whitespace-pre-wrap text-zinc-300 font-mono leading-relaxed" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                    {compiledCode}
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {(isExecuting || showArtifactModal) && (
        <div className="absolute right-4 bottom-4 z-[150] bg-zinc-900 border border-zinc-700 p-4 rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              {showArtifactModal ? '✨ Ejecución Finalizada' : '⚡ Ejecución en Progreso...'}
            </h3>
            <button onClick={() => { stopExecution(); setShowArtifactModal(false); }} className="text-zinc-400 hover:text-white p-1">✕</button>
          </div>
          
          {showArtifactModal && finalOutputContent && (
            <div className="flex-1 min-h-[200px] flex flex-col mb-3">
              <div className="text-xs uppercase tracking-widest text-emerald-500 mb-1 font-semibold">Resultado Final:</div>
              <div className="flex-1 overflow-y-auto bg-emerald-950/30 rounded-lg border border-emerald-800/50 p-4 scrollbar-thin scrollbar-thumb-zinc-700">
                <pre className="text-xs whitespace-pre-wrap text-emerald-100 font-mono" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                  {finalOutputContent}
                </pre>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-[200px] flex flex-col">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1 font-semibold">Terminal Runtime:</div>
            <div className="flex-1 overflow-y-auto bg-black rounded-lg border border-zinc-800 p-3 scrollbar-thin scrollbar-thumb-zinc-700 font-mono text-green-400 text-xs">
              {terminalLogs.map((log, i) => {
                if (log.startsWith('[HEALING-FAILED]')) {
                  return <div key={i} className="text-red-500 font-bold bg-red-900/20 p-1 rounded mb-1">{log}</div>;
                }
                if (log.startsWith('[HEALING]')) {
                  return <div key={i} className="text-yellow-400 font-bold bg-yellow-900/20 p-1 rounded mb-1">{log}</div>;
                }
                return <div key={i}>{log}</div>;
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}

      <div 

        className="flex-1 flex overflow-hidden relative"
        onPointerDownCapture={onPointerDown}
        onPointerMoveCapture={onPointerMove}
        onPointerUpCapture={onPointerUp}
      >
        
      {selectedEdges.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl rounded-2xl p-2 flex items-center gap-2 shadow-2xl transition-colors duration-300 border-2" style={{ backgroundColor: "var(--theme-card)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}>
          <span className="text-xs font-bold px-2 opacity-70">Enlace</span>
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-black/20 shadow-sm cursor-pointer" title="Color">
            <input 
              type="color" 
              value={selectedEdges[0].style?.stroke || '#ffffff'} 
              onChange={(e) => setEdges(eds => eds.map(ed => selectedEdges.find(se => se.id === ed.id) ? { ...ed, style: { ...ed.style, stroke: e.target.value } } : ed))}
              className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
            />
          </div>
          <select 
            className="text-xs p-1 rounded bg-black/10 border border-transparent outline-none" 
            value={selectedEdges[0].type || 'default'} 
            onChange={(e) => setEdges(eds => eds.map(ed => selectedEdges.find(se => se.id === ed.id) ? { ...ed, type: e.target.value } : ed))}
            style={{ color: "var(--theme-text)" }}
          >
            <option value="default">Curva (Bezier)</option>
            <option value="straight">Recta</option>
            <option value="step">Escalón</option>
            <option value="smoothstep">Escalón Suave</option>
          </select>
          <button 
            onClick={() => setEdges(eds => eds.filter(ed => !selectedEdges.find(se => se.id === ed.id)))} 
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors"
          >
            <Trash size={14} />
          </button>
        </div>
      )}

        <main className="builder-canvas flex-1 h-full" style={{ cursor: cursorMode === 'pan' ? 'grab' : (cursorMode === 'erase' ? 'crosshair' : 'crosshair') }}>
          <ReactFlow
            onSelectionChange={({ edges, nodes }) => { setSelectedEdges(edges); setSelectedNodes(nodes); }}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ style: { stroke: '#ffffff', strokeWidth: 2 } }}
            fitView
            className="bg-transparent"
            panOnDrag={cursorMode === 'pan'}
            selectionOnDrag={false}
          >
            {bgPattern !== 'none' && <Background color={(THEME_STYLES[theme] as Record<string, string>)['--theme-border']} gap={16} size={1} variant={bgPattern as BackgroundVariant} style={{ opacity: 0.8 }} />}
            
            {activeDrawPoints && currentDrawNodeId && <DrawingOverlay points={activeDrawPoints} cursorMode={cursorMode} strokeColor={strokeColor} strokeWidth={strokeWidth} startPos={activeDrawStartPos.current} />}

            {showControls && <Controls />}
            {showMinimap && <MiniMap style={{ backgroundColor: 'var(--theme-card)' }} maskColor={'rgba(0,0,0,0.2)'} nodeColor={'var(--theme-border)'} />}
          </ReactFlow>
        </main>
        
        {showAgentLibrary && (
          <AgentsLibraryPanel 
            onClose={() => setShowAgentLibrary(false)} 
            onAddAgent={handleAddAgentNode} 
            nodeStyle={nodeStyle} 
          />
        )}

        <PropertiesPanel 
          selectedNode={selectedNodes.length > 0 ? selectedNodes[0] : null} 
          onUpdateNode={handleUpdateNode} 
          onAddVariantNode={handleAddVariantNode}
          onClose={() => {
            setSelectedNodes([]);
            setNodes(nds => nds.map(n => ({ ...n, selected: false })));
          }} 
          nodeStyle={nodeStyle}
        />
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
