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
  useStore
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { getStroke } from 'perfect-freehand';
import { getSvgPathFromStroke } from '../utils/drawUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ArrowUUpLeft, ArrowUUpRight, FloppyDisk, ArrowLeft, DownloadSimple, Trash } from '@phosphor-icons/react';

import { MainPromptNode, ActionNode, PostItNode, TraducirNode, EditarNode, DrawingNode, RulerNode, LogicaNode } from '../components/BuilderNodes';
import PropertiesPanel from '../components/builder/PropertiesPanel';

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
  "Cyberpunk", "Nord", "Dracula", "Matrix", "Solarized", "Monokai", 
  "Synthwave", "Oceanic", "Gruvbox", "Ayu Mirage", "Palenight", 
  "Tokyo Night", "Cobalt2", "Night Owl", "Shades of Purple",
  "Material", "One Dark", "Github Dark", "Vesper", "Rose Pine",
  "Neon Orange", "Neon Yellow", "Neon Red", "Neon Cyan", "Neon Green",
  "CyberLED Orange", "CyberLED Yellow", "CyberLED Red", "CyberLED Cyan", "CyberLED Green"
];

const THEME_STYLES: Record<string, React.CSSProperties> = {
  "Cyberpunk": { '--theme-bg': '#f3e600', '--theme-bar': 'rgba(0,0,0,0.8)', '--theme-card': '#000000', '--theme-text': '#00ff00', '--theme-border': '#ff003c' } as React.CSSProperties,
  "Nord": { '--theme-bg': '#eceff4', '--theme-bar': 'rgba(46,52,64,0.8)', '--theme-card': '#2e3440', '--theme-text': '#d8dee9', '--theme-border': '#88c0d0' } as React.CSSProperties,
  "Dracula": { '--theme-bg': '#282a36', '--theme-bar': 'rgba(25,26,33,0.8)', '--theme-card': '#191A21', '--theme-text': '#f8f8f2', '--theme-border': '#ff79c6' } as React.CSSProperties,
  "Matrix": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,65,0.2)', '--theme-card': '#002200', '--theme-text': '#00ff41', '--theme-border': '#00ff41' } as React.CSSProperties,
  "Solarized": { '--theme-bg': '#fdf6e3', '--theme-bar': 'rgba(7,54,66,0.8)', '--theme-card': '#073642', '--theme-text': '#93a1a1', '--theme-border': '#b58900' } as React.CSSProperties,
  "Monokai": { '--theme-bg': '#272822', '--theme-bar': 'rgba(20,20,17,0.8)', '--theme-card': '#141411', '--theme-text': '#f8f8f2', '--theme-border': '#f92672' } as React.CSSProperties,
  "Synthwave": { '--theme-bg': '#262335', '--theme-bar': 'rgba(54,249,246,0.2)', '--theme-card': '#49265c', '--theme-text': '#36f9f6', '--theme-border': '#f92aad' } as React.CSSProperties,
  "Oceanic": { '--theme-bg': '#1b2b34', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#1b2b34', '--theme-border': '#ec5f67' } as React.CSSProperties,
  "Gruvbox": { '--theme-bg': '#fbf1c7', '--theme-bar': 'rgba(40,40,40,0.8)', '--theme-card': '#282828', '--theme-text': '#ebdbb2', '--theme-border': '#cc241d' } as React.CSSProperties,
  "Ayu Mirage": { '--theme-bg': '#1f2430', '--theme-bar': 'rgba(250,250,250,0.8)', '--theme-card': '#fafafa', '--theme-text': '#1f2430', '--theme-border': '#ffcc66' } as React.CSSProperties,
  "Palenight": { '--theme-bg': '#292d3e', '--theme-bar': 'rgba(26,28,35,0.8)', '--theme-card': '#1a1c23', '--theme-text': '#a6accd', '--theme-border': '#c792ea' } as React.CSSProperties,
  "Tokyo Night": { '--theme-bg': '#1a1b26', '--theme-bar': 'rgba(169,177,214,0.8)', '--theme-card': '#a9b1d6', '--theme-text': '#1a1b26', '--theme-border': '#f7768e' } as React.CSSProperties,
  "Cobalt2": { '--theme-bg': '#193549', '--theme-bar': 'rgba(255,198,0,0.8)', '--theme-card': '#ffc600', '--theme-text': '#193549', '--theme-border': '#ff9d00' } as React.CSSProperties,
  "Night Owl": { '--theme-bg': '#011627', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#011627', '--theme-border': '#82aaff' } as React.CSSProperties,
  "Shades of Purple": { '--theme-bg': '#2d2b55', '--theme-bar': 'rgba(30,30,63,0.8)', '--theme-card': '#1e1e3f', '--theme-text': '#fad000', '--theme-border': '#ff2c70' } as React.CSSProperties,
  "Material": { '--theme-bg': '#eceff1', '--theme-bar': 'rgba(38,50,56,0.8)', '--theme-card': '#263238', '--theme-text': '#eeffff', '--theme-border': '#80cbc4' } as React.CSSProperties,
  "One Dark": { '--theme-bg': '#282c34', '--theme-bar': 'rgba(30,34,39,0.8)', '--theme-card': '#1e2227', '--theme-text': '#abb2bf', '--theme-border': '#61afef' } as React.CSSProperties,
  "Github Dark": { '--theme-bg': '#0d1117', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#24292e', '--theme-border': '#58a6ff' } as React.CSSProperties,
  "Vesper": { '--theme-bg': '#101010', '--theme-bar': 'rgba(250,250,250,0.8)', '--theme-card': '#fafafa', '--theme-text': '#101010', '--theme-border': '#ffc799' } as React.CSSProperties,
  "Rose Pine": { '--theme-bg': '#191724', '--theme-bar': 'rgba(250,244,237,0.8)', '--theme-card': '#faf4ed', '--theme-text': '#575279', '--theme-border': '#ebbcba' } as React.CSSProperties,

  "Neon Orange": { '--theme-bg': '#0a0500', '--theme-bar': 'rgba(255,100,0,0.2)', '--theme-card': '#1a0a00', '--theme-text': '#ffaa00', '--theme-border': '#ff6600' } as React.CSSProperties,
  "Neon Yellow": { '--theme-bg': '#0a0a00', '--theme-bar': 'rgba(255,255,0,0.2)', '--theme-card': '#1a1a00', '--theme-text': '#ffff00', '--theme-border': '#cccc00' } as React.CSSProperties,
  "Neon Red": { '--theme-bg': '#0a0000', '--theme-bar': 'rgba(255,0,0,0.2)', '--theme-card': '#1a0000', '--theme-text': '#ff3333', '--theme-border': '#ff0000' } as React.CSSProperties,
  "Neon Cyan": { '--theme-bg': '#000a0a', '--theme-bar': 'rgba(0,255,255,0.2)', '--theme-card': '#001a1a', '--theme-text': '#00ffff', '--theme-border': '#00cccc' } as React.CSSProperties,
  "Neon Green": { '--theme-bg': '#000a00', '--theme-bar': 'rgba(0,255,0,0.2)', '--theme-card': '#001a00', '--theme-text': '#33ff33', '--theme-border': '#00ff00' } as React.CSSProperties,
  "CyberLED Orange": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,100,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ff6600' } as React.CSSProperties,
  "CyberLED Yellow": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,255,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ffff00' } as React.CSSProperties,
  "CyberLED Red": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,0,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ff0000' } as React.CSSProperties,
  "CyberLED Cyan": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,255,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#00ffff' } as React.CSSProperties,
  "CyberLED Green": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#00ff00' } as React.CSSProperties,
};

type HistoryState = {
  nodes: Node[];
  edges: Edge[];
};


function DrawingOverlay({ points, cursorMode, strokeColor, strokeWidth, startPos }: any) {
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
  const incomingPrompt = location.state?.prompt;
  const incomingChain: any[] | undefined = location.state?.promptChain;
  const promptKey = location.state?.promptKey as string | undefined;
  const restoreCanvas = location.state?.restoreCanvas as boolean | undefined;

  const initialPrompt = incomingPrompt || { title: 'Nuevo Prompt', content: "Prompt inicial por defecto" };

  // Build initial nodes: single prompt OR a chain of prompts placed left-to-right
  const buildInitialNodes = (): Node[] => {
    console.log("buildInitialNodes called!");
    console.log("location.state:", location.state);
    console.log("templateFlow:", templateFlow);
    if (templateFlow && templateFlow.nodes) {
        console.log("Returning templateFlow.nodes:", templateFlow.nodes);
        return templateFlow.nodes;
    }
    if (templateFlow && templateFlow.nodes) return templateFlow.nodes;
    if (incomingChain && incomingChain.length > 0) {
      return incomingChain.map((p: any, i: number) => ({
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
    if (templateFlow && templateFlow.edges) return templateFlow.edges;
    if (incomingChain && incomingChain.length > 1) {
      return incomingChain.slice(0, -1).map((_: any, i: number) => ({
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
    if (templateFlow || incomingChain || incomingPrompt) {
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
    if (templateFlow || incomingChain || incomingPrompt) {
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

  useEffect(() => {
    if (incomingPrompt || incomingChain || templateFlow) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [theme, setTheme] = useState("Dracula");
  const [bgPattern, setBgPattern] = useState(() => localStorage.getItem("builderBgPattern") || "dots");
  const [nodeStyle, setNodeStyle] = useState(() => localStorage.getItem("builderNodeStyle") || "default");

  const [cursorMode, setCursorMode] = useState<'pan' | 'draw' | 'line' | 'erase'>('pan');
  const [strokeColor, setStrokeColor] = useState<string>('#ffffff');
  const [edgeColor, setEdgeColor] = useState<string>('#58a6ff');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [currentDrawNodeId, setCurrentDrawNodeId] = useState<string | null>(null);

  // AI Action state
  const [aiLoading, setAiLoading] = useState<string | null>(null); // which action is loading
  const [aiError, setAiError] = useState<string | null>(null);
  const BACKEND_URL = 'http://localhost:8000/api/v1';

  /** Get the content of the currently selected (or main) node */
  const getActivePromptContent = (): string => {
    const selected = nodes.find(n => n.data?.selectedForPdf);
    const target = selected || nodes.find(n => n.id === 'main') || nodes[0];
    if (!target) return '';
    return String(target.data?.content || target.data?.title || '');
  };

  /** Call the backend and create a result node on the canvas */
  const handleAiAction = async (
    action: 'upgrade' | 'atomizar' | 'traducir' | 'editar' | 'logica',
    extras?: { target_language?: string; edit_instruction?: string }
  ) => {
    const promptContent = getActivePromptContent();
    if (!promptContent.trim()) {
      setAiError('Selecciona o escribe un prompt primero');
      setTimeout(() => setAiError(null), 3000);
      return;
    }

    setAiLoading(action);
    setAiError(null);

    try {
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

      // Find source node to position the result next to it
      const sourceNode = nodes.find(n => n.data?.selectedForPdf) || nodes.find(n => n.id === 'main') || nodes[0];
      const newId = `ai-${action}-${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type: action === 'logica' ? 'logicaNode' : action === 'traducir' ? 'traducir' : action === 'editar' ? 'editar' : 'mainPrompt',
        position: {
          x: (sourceNode?.position?.x ?? 250) + 420,
          y: (sourceNode?.position?.y ?? 250)
        },
        data: {
          title: actionLabels[action],
          content: data.result,
          model: data.model_used
        }
      };

      const newEdge: Edge = {
        id: `e-${sourceNode?.id}-${newId}`,
        source: sourceNode?.id ?? 'main',
        target: newId,
        animated: true,
        style: { stroke: '#a855f7', strokeWidth: 2 }
      };

      const nextNodes = [...nodes, newNode];
      const nextEdges = [...edges, newEdge];
      setNodes(nextNodes);
      setEdges(nextEdges);
      saveHistory(nextNodes, nextEdges);

    } catch (e: any) {
      setAiError(`Error: ${e.message}`);
      setTimeout(() => setAiError(null), 5000);
    } finally {
      setAiLoading(null);
    }
  };

  const [ejecutarLoading, setEjecutarLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(45); // Estimación inicial
  const [executionResult, setExecutionResult] = useState<any>(() => {
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
  const wsRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const startExecution = () => {
    try {
      console.log('startExecution triggered!');
      setIsExecuting(true);
      setTerminalLogs(['Iniciando conexión con Runtime...']);
      const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/execute');
