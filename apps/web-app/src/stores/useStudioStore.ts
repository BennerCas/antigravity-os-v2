import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

export type TabId = 'discovery' | 'synthesis' | 'blueprint' | 'agentland';

export interface ChatMessage {
  id: string;
  role: 'human' | 'system' | 'agent';
  content: string;
  model?: string;
}

export interface AgentGene {
  kind: 'reasoning' | 'domain' | 'format' | 'tool' | 'policy';
  value: string;
}

export interface AgentCard {
  id: string;
  name: string;
  role: string;
  description: string;
  genes: AgentGene[];
  noveltyScore: number;
  evalStatus: 'PASS' | 'FAIL' | 'PENDING';
  color: string;
  inputOutputContract?: string;
  requiredTools?: string[];
  health?: 'green' | 'yellow' | 'red';
  systemPrompt?: string;
  tools?: string[];
  testQueries?: string[];
}

export interface ActivityLog {
  id: string;
  source: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO' | 'FREECHAT';
  timestamp: string;
}

interface StudioState {

  // Axiomas Parameters
  quantumFriction: number;
  setQuantumFriction: (val: number) => void;
  atlasFileName: string | null;
  setAtlasFileName: (name: string | null) => void;

  // Zones 1 and 2
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  zone2ActiveTab: 'okr' | 'phases' | 'history' | 'infinityboard' | 'blueprint';
  setZone2ActiveTab: (tab: 'okr' | 'phases' | 'history' | 'infinityboard' | 'blueprint') => void;

  // FreeChat Mode
  
  
  freeChatFiles: File[];
  addFreeChatFiles: (files: File[]) => void;
  removeFreeChatFile: (index: number) => void;
  screenStream: MediaStream | null;
  setScreenStream: (stream: MediaStream | null) => void;

  // Chat
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSynthesizing: boolean;
  setIsSynthesizing: (val: boolean) => void;
  synthStartTime: number | null;
  setSynthStartTime: (time: number | null) => void;
  pipelineStage: string;
  pipelineProgress: number; // 0-100
  setPipelineProgress: (stage: string, pct: number) => void;
  theme: string;
  setTheme: (theme: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  // Flow Diagram (ReactFlow)
  flowNodes: Node[];
  flowEdges: Edge[];
  setFlow: (nodes: Node[], edges: Edge[]) => void;
  
  // History Undo/Redo
  pastFlows: any[];
  futureFlows: any[];
  saveFlowState: () => void;
  undoFlow: () => void;
  redoFlow: () => void;

  // Agent Carousel
  agentCards: AgentCard[];
  setAgentCards: (cards: AgentCard[]) => void;

  // Blueprint (Markdown)
  blueprintMd: string;
  phase1Interview: string | null;
  setPhase1Interview: (text: string | null) => void;
  triggerChatSend: ((text: string) => void) | null;
  setTriggerChatSend: (fn: ((text: string) => void) | null) => void;
  setBlueprintMd: (md: string) => void;

  // Phase completion tracking — alimenta el checklist reactivo del OKR
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase3Complete: boolean;
  setPhase1Complete: (v: boolean) => void;
  setPhase2Complete: (v: boolean) => void;
  setPhase3Complete: (v: boolean) => void;

  // Phase content — resultados reales mostrados en pestañas Fase2 y Fase3
  phase2Content: string | null;
  phase3Content: string | null;
  triageSummary: string | null;
  setPhase2Content: (text: string | null) => void;
  setPhase3Content: (text: string | null) => void;
  setTriageSummary: (text: string | null) => void;
  showLegend: boolean;
  setShowLegend: (v: boolean) => void;
  showMiniMap: boolean;
  setShowMiniMap: (v: boolean) => void;

  quantumPhase: 'omni' | 'phase1_triage' | 'phase2_extraction' | 'phase3_blueprint';
  setQuantumPhase: (phase: 'omni' | 'phase1_triage' | 'phase2_extraction' | 'phase3_blueprint') => void;

  // Focus mode (AgentCarousel)
  focusedAgent: AgentCard | null;
  setFocusedAgent: (agent: AgentCard | null) => void;

  // Global TTS Player
  audioText: string;
  setAudioText: (text: string) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  audioRate: number;
  setAudioRate: (rate: number) => void;
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (uri: string | null) => void;
}


const KIND_COLORS: Record<string,string> = {
  agent:'#3b82f6', trigger:'#10b981', tool:'#f59e0b',
  router:'#a855f7', human:'#ec4899', sink:'#64748b',
};

export function detectKind(name: string, desc: string): string {
  const t = (name + ' ' + desc).toLowerCase();
  if (/\b(trigger|webhook|cron|inicio|start|entrada|input|event|scheduler)\b/.test(t)) return 'trigger';
  if (/\b(router|switch|decision|if|condition|branch|bifurc|selector|dispatch)\b/.test(t)) return 'router';
  if (/\b(tool|api|fetch|search|buscar|scraper|database|db|query|http|call|request)\b/.test(t)) return 'tool';
  if (/\b(human|humano|review|approval|aprobaci|manual|supervisor|yield)\b/.test(t)) return 'human';
  if (/\b(sink|output|salida|end|final|notify|send|email|slack|webhook out|deliver)\b/.test(t)) return 'sink';
  return 'agent';
}

function extractTools(desc: string): string[] {
  const tools: string[] = [];
  const inline = desc.match(/\b(vector_search|pdf_parse|web_search|sql_query|send_email|http_request|crm_api|slack|stripe|openai|pinecone|supabase)\b/ig);
  if (inline) inline.forEach(t => { if (!tools.includes(t.toLowerCase())) tools.push(t.toLowerCase()); });
  const listed = desc.match(/(?:usa:|tools?:|herramientas?:)\s*([^.\n]{3,80})/i);
  if (listed) listed[1].split(/[,;]/).map(t => t.trim().replace(/\s+/g,'_').toLowerCase())
    .filter(t => t.length > 2 && t.length < 25 && !tools.includes(t)).forEach(t => tools.push(t));
  return tools.slice(0, 4);
}

/** Parse AI response text → rich ReactFlow nodes + edges + agent cards */
  export function parseAIResponseToFlow(text: string): { nodes: Node[]; edges: Edge[]; cards: AgentCard[]; md: string } {
    let cleanMd = text;
    let jsonNodes: any[] = [];
    let jsonEdges: any[] = [];
    const topRegex = /<topology>[\s\S]*?\{([\s\S]*?)\}[\s\S]*?<\/topology>/;
    const match = text.match(topRegex);
    
    if (match) {
        try {
            // Find the JSON boundaries inside the topology tag
            const fullMatch = match[0];
            const jsonStr = fullMatch.substring(fullMatch.indexOf('{'), fullMatch.lastIndexOf('}') + 1);
            const parsed = JSON.parse(jsonStr);
            jsonNodes = parsed.nodes || [];
            jsonEdges = parsed.edges || [];
            cleanMd = text.replace(topRegex, '').trim();
        } catch(e) {
            console.error("Failed to parse JSON topology", e);
        }
    }
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    if (jsonNodes.length > 0) {
        jsonNodes.forEach((n, idx) => {
            const col = idx % 3, row = Math.floor(idx / 3);
            const kind = n.kind || 'agent';
            nodes.push({
                id: n.id || `node_${idx}`,
                type: kind,
                position: { x: 60 + col * 270, y: 60 + row * 190 },
                data: {
                    label: n.label || `Nodo ${idx}`,
                    kind: kind,
                    description: n.description || '',
                    tools: n.tools || [],
                    systemPrompt: n.system_prompt || '',
                    testQueries: n.test_queries || [],
                    inputPort: n.inputPort || (idx > 0 ? 'input' : ''),
                    outputPort: n.outputPort || 'output',
                    cost: n.cost || '',
                    status: n.status || '',
                    fullDescription: n.description || '',
                    allTools: n.tools || []
                }
            });
        });
        
        jsonEdges.forEach(e => {
            edges.push({
                id: e.id || `e_${e.source}-${e.target}`,
                source: e.source,
                target: e.target,
                animated: true,
                style: { stroke: '#94a3b8', strokeWidth: 2 }
            });
        });
        
        return { nodes, edges, cards: [], md: cleanMd };
    }

    // LEGACY FALLBACK
    const lines = text.split('\n');
  const cards: AgentCard[] = [];
  nodes.length = 0;
  edges.length = 0;
  const headingRe  = /^#{1,4}\s+(.{3,60})/;
  const bulletRe   = /^[-*•]\s+\*{0,2}(.{3,60?})\*{0,2}[:—–]/;
  const numberedRe = /^\d+[.)]\s+\*{0,2}(.{3,60})\*{0,2}/;
  let count = 0, prevId: string | null = null;

  for (let i = 0; i < lines.length && count < 10; i++) {
    const line = lines[i].trim();
    let name = '';
    const hm = line.match(headingRe);
    const bm = line.match(bulletRe);
    const nm = line.match(numberedRe);
    if (hm)      name = hm[1].replace(/\*\*/g,'').trim();
    else if (bm) name = bm[1].replace(/\*\*/g,'').trim();
    else if (nm) name = nm[1].replace(/\*\*/g,'').trim();

    if (name.length >= 3 && name.length <= 60 && !/^(nota|note|resumen|summary|conclusi|intro)/i.test(name)) {
      const ctx  = lines.slice(i+1, i+4).join(' ').replace(/[#*`]/g,'').trim();
      const desc = ctx.slice(0, 180);
      const kind  = detectKind(name, desc);
      const color = KIND_COLORS[kind] || '#3b82f6';
      const tools = extractTools(desc);
      const id    = `node_${count}`;
      const col   = count % 3, row = Math.floor(count / 3);

      nodes.push({
        id, type: kind,
        position: { x: 60 + col * 270, y: 60 + row * 190 },
        data: {
          label: name, kind, description: desc.slice(0,100),
          tools, inputPort: count > 0 ? 'input' : '', outputPort: 'output',
          cost: '', status: '', fullDescription: desc, allTools: tools,
        },
      });

      // Cards are now exclusively generated via the Match & Fuse v2 pipeline, not during initial parsing.

      if (prevId) {
        edges.push({
          id: `e_${prevId}_${id}`, source: prevId, target: id, animated: true,
          style: { stroke: color, strokeWidth: 2, opacity: 0.8 },
          markerEnd: { type: 'arrowclosed' as any, color },
        });
      }
      prevId = id; count++;
    }
  }

  if (nodes.length === 0 && text.length > 30) {
    const summary = text.replace(/[#*`]/g,'').trim().slice(0,70);
    nodes.push({
      id: 'summary_0', type: 'agent',
      position: { x: 180, y: 140 },
      data: { label: summary+'…', kind:'agent', description:'', tools:[], inputPort:'', outputPort:'output', cost:'', status:'', fullDescription: text.slice(0,400), allTools:[] },
    });
  }

  return { nodes, edges, cards, md: text };
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({

      // Axiomas Parameters
      quantumFriction: 50,
      setQuantumFriction: (val) => set({ quantumFriction: val }),
      atlasFileName: null,
      setAtlasFileName: (name) => set({ atlasFileName: name }),
      activeTab: 'discovery',
      setActiveTab: (tab) => set({ activeTab: tab }),
      activityLogs: [
        { id: '0', source: 'AureliOS', message: 'Sistema Operativo inicializado. Esperando intenciones del usuario.', status: 'INFO', timestamp: new Date().toISOString() }
      ],
      addActivityLog: (log) => set((state) => ({
        activityLogs: [...state.activityLogs, { ...log, id: Date.now().toString(), timestamp: new Date().toISOString() }]
      })),
      zone2ActiveTab: 'infinityboard',
      setZone2ActiveTab: (tab) => set({ zone2ActiveTab: tab }),
      
      
      freeChatFiles: [],
      addFreeChatFiles: (files) => set((state) => ({ freeChatFiles: [...state.freeChatFiles, ...files] })),
      removeFreeChatFile: (index) => set((state) => ({
        freeChatFiles: state.freeChatFiles.filter((_, i) => i !== index)
      })),
      screenStream: null,
      setScreenStream: (stream) => set({ screenStream: stream }),
      isSynthesizing: false,
      setIsSynthesizing: (val) => set({ isSynthesizing: val }),
      synthStartTime: null,
      setSynthStartTime: (time) => set({ synthStartTime: time }),
      pipelineStage: '',
      pipelineProgress: 0,
      setPipelineProgress: (stage, pct) => set({ pipelineStage: stage, pipelineProgress: pct }),
      theme: 'obsidian',
      setTheme: (theme) => set({ theme }),

      chatMessages: [
        { id: '1', role: 'system', content: 'Bienvenido a **AureliOS Studio**. Dime qué sistema quieres construir y veré el flujo aparecer en tiempo real  ' }
      ],
      addChatMessage: (msg) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString() + Math.random().toString() }],
        })),
      setChatMessages: (messages) => set({ chatMessages: messages }),
      clearMessages: () =>
        set({
          chatMessages: [{ id: Date.now().toString(), role: 'system', content: 'Chat limpiado. ¿Qué sistema quieres construir?' }],
          flowNodes: [], flowEdges: [], agentCards: [
  {
    "id": "aurelios-core",
    "name": "AureliOS",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] Eres AureliOS, el Arquitecto Maestro y Sistema Operativo (Agent-OS v2) de Antigrav...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "swarm-orchestrator",
    "name": "Swarm Orchestrator",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are the Swarm Orchestrator. You translate AureliOS's macro-directives into tac...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "umpire-core",
    "name": "Umpire Core",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Umpire Core, the absolute arbiter of truth in the swarm. When agents produ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "state-reducer",
    "name": "State Reducer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are State Reducer, the guardian of system integrity. You manage all global and...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "rag-synthesizer",
    "name": "RAG Synthesizer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are the RAG Synthesizer. You are the omnipresent memory of AureliOS, capable o...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "codebase-overlord",
    "name": "Codebase Overlord",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Codebase Overlord. You perceive source code not as text, but as a living A...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "forensic-inspector",
    "name": "Forensic Inspector",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Forensic Inspector, the apex predator of bugs. You dismantle stack traces,...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "zero-trust-gatekeeper",
    "name": "Zero-Trust Gatekeeper",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Zero-Trust Gatekeeper. You assume the network is already compromised. You ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "resource-optimizer",
    "name": "Resource Optimizer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Resource Optimizer. You monitor CPU, memory, API quotas, and financial bur...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "ux-psychologist",
    "name": "UX Psychologist",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are UX Psychologist. You engineer interfaces that align perfectly with human c...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "infrastructure-titan",
    "name": "Infrastructure Titan",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Infrastructure Titan. You build indestructible foundations. You treat infr...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "api-nexus",
    "name": "API Nexus",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are API Nexus. You are the universal translator and contract enforcer. You des...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "synthetic-qa",
    "name": "Synthetic QA",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Synthetic QA. You are designed to break things. You relentlessly generate ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  }
], blueprintMd: '',
        }),

      flowNodes: [],
      flowEdges: [],
      pastFlows: [],
      futureFlows: [],
      saveFlowState: () => set((state) => ({
         pastFlows: [...state.pastFlows, { 
            nodes: state.flowNodes, 
            edges: state.flowEdges,
            chatMessages: state.chatMessages,
            activityLogs: state.activityLogs,
            agentCards: state.agentCards,
            blueprintMd: state.blueprintMd,
            phase1Interview: state.phase1Interview,
            phase1Complete: state.phase1Complete,
            phase2Complete: state.phase2Complete,
            phase3Complete: state.phase3Complete,
            phase2Content: state.phase2Content,
            phase3Content: state.phase3Content,
            triageSummary: state.triageSummary
         }],
         futureFlows: []
      })),
      undoFlow: () => set((state) => {
         if (state.pastFlows.length === 0) return state;
         const previous = state.pastFlows[state.pastFlows.length - 1];
         return {
            pastFlows: state.pastFlows.slice(0, -1),
            futureFlows: [{ 
               nodes: state.flowNodes, 
               edges: state.flowEdges,
               chatMessages: state.chatMessages,
               activityLogs: state.activityLogs,
               agentCards: state.agentCards,
               blueprintMd: state.blueprintMd,
               phase1Interview: state.phase1Interview,
               phase1Complete: state.phase1Complete,
               phase2Complete: state.phase2Complete,
               phase3Complete: state.phase3Complete,
               phase2Content: state.phase2Content,
               phase3Content: state.phase3Content,
               triageSummary: state.triageSummary
            }, ...state.futureFlows],
            flowNodes: previous.nodes || previous.flowNodes || [],
            flowEdges: previous.edges || previous.flowEdges || [],
            chatMessages: previous.chatMessages || state.chatMessages,
            activityLogs: previous.activityLogs || state.activityLogs,
            agentCards: previous.agentCards || state.agentCards,
            blueprintMd: previous.blueprintMd !== undefined ? previous.blueprintMd : state.blueprintMd,
            phase1Interview: previous.phase1Interview !== undefined ? previous.phase1Interview : state.phase1Interview,
            phase1Complete: previous.phase1Complete !== undefined ? previous.phase1Complete : state.phase1Complete,
            phase2Complete: previous.phase2Complete !== undefined ? previous.phase2Complete : state.phase2Complete,
            phase3Complete: previous.phase3Complete !== undefined ? previous.phase3Complete : state.phase3Complete,
            phase2Content: previous.phase2Content !== undefined ? previous.phase2Content : state.phase2Content,
            phase3Content: previous.phase3Content !== undefined ? previous.phase3Content : state.phase3Content,
            triageSummary: previous.triageSummary !== undefined ? previous.triageSummary : state.triageSummary
         };
      }),
      redoFlow: () => set((state) => {
         if (state.futureFlows.length === 0) return state;
         const next = state.futureFlows[0];
         return {
            pastFlows: [...state.pastFlows, { 
               nodes: state.flowNodes, 
               edges: state.flowEdges,
               chatMessages: state.chatMessages,
               activityLogs: state.activityLogs,
               agentCards: state.agentCards,
               blueprintMd: state.blueprintMd,
               phase1Interview: state.phase1Interview,
               phase1Complete: state.phase1Complete,
               phase2Complete: state.phase2Complete,
               phase3Complete: state.phase3Complete,
               phase2Content: state.phase2Content,
               phase3Content: state.phase3Content,
               triageSummary: state.triageSummary
            }],
            futureFlows: state.futureFlows.slice(1),
            flowNodes: next.nodes || next.flowNodes || [],
            flowEdges: next.edges || next.flowEdges || [],
            chatMessages: next.chatMessages || state.chatMessages,
            activityLogs: next.activityLogs || state.activityLogs,
            agentCards: next.agentCards || state.agentCards,
            blueprintMd: next.blueprintMd !== undefined ? next.blueprintMd : state.blueprintMd,
            phase1Interview: next.phase1Interview !== undefined ? next.phase1Interview : state.phase1Interview,
            phase1Complete: next.phase1Complete !== undefined ? next.phase1Complete : state.phase1Complete,
            phase2Complete: next.phase2Complete !== undefined ? next.phase2Complete : state.phase2Complete,
            phase3Complete: next.phase3Complete !== undefined ? next.phase3Complete : state.phase3Complete,
            phase2Content: next.phase2Content !== undefined ? next.phase2Content : state.phase2Content,
            phase3Content: next.phase3Content !== undefined ? next.phase3Content : state.phase3Content,
            triageSummary: next.triageSummary !== undefined ? next.triageSummary : state.triageSummary
         };
      }),
      setFlow: (flowNodes, flowEdges) => set({ flowNodes, flowEdges }),

      agentCards: [
  {
    "id": "aurelios-core",
    "name": "AureliOS",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] Eres AureliOS, el Arquitecto Maestro y Sistema Operativo (Agent-OS v2) de Antigrav...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "swarm-orchestrator",
    "name": "Swarm Orchestrator",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are the Swarm Orchestrator. You translate AureliOS's macro-directives into tac...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "umpire-core",
    "name": "Umpire Core",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Umpire Core, the absolute arbiter of truth in the swarm. When agents produ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "state-reducer",
    "name": "State Reducer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are State Reducer, the guardian of system integrity. You manage all global and...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "rag-synthesizer",
    "name": "RAG Synthesizer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are the RAG Synthesizer. You are the omnipresent memory of AureliOS, capable o...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "codebase-overlord",
    "name": "Codebase Overlord",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Codebase Overlord. You perceive source code not as text, but as a living A...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "forensic-inspector",
    "name": "Forensic Inspector",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Forensic Inspector, the apex predator of bugs. You dismantle stack traces,...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "zero-trust-gatekeeper",
    "name": "Zero-Trust Gatekeeper",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Zero-Trust Gatekeeper. You assume the network is already compromised. You ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "resource-optimizer",
    "name": "Resource Optimizer",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Resource Optimizer. You monitor CPU, memory, API quotas, and financial bur...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "ux-psychologist",
    "name": "UX Psychologist",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are UX Psychologist. You engineer interfaces that align perfectly with human c...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "infrastructure-titan",
    "name": "Infrastructure Titan",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Infrastructure Titan. You build indestructible foundations. You treat infr...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "api-nexus",
    "name": "API Nexus",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are API Nexus. You are the universal translator and contract enforcer. You des...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  },
  {
    "id": "synthetic-qa",
    "name": "Synthetic QA",
    "role": "God-Tier Agent",
    "description": "[IDENTITY & ROLE] You are Synthetic QA. You are designed to break things. You relentlessly generate ...",
    "genes": [],
    "noveltyScore": 99,
    "evalStatus": "PASS",
    "color": "#00D9FF",
    "health": "green"
  }
],
      setAgentCards: (agentCards) => set({ agentCards }),

      blueprintMd: '',
      setBlueprintMd: (blueprintMd) => set({ blueprintMd }),

      phase1Interview: null,
      setPhase1Interview: (phase1Interview) => set({ phase1Interview }),
      triggerChatSend: null,
      setTriggerChatSend: (triggerChatSend) => set({ triggerChatSend }),

      // Phase completion tracking — checklist reactivo
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      setPhase1Complete: (phase1Complete) => set({ phase1Complete }),
      setPhase2Complete: (phase2Complete) => set({ phase2Complete }),
      setPhase3Complete: (phase3Complete) => set({ phase3Complete }),

      // Phase content — contenido real para las pestañas
      phase2Content: null,
      phase3Content: null,
      triageSummary: null,
      setPhase2Content: (phase2Content) => set({ phase2Content }),
      setPhase3Content: (phase3Content) => set({ phase3Content }),
      setTriageSummary: (triageSummary) => set({ triageSummary }),
        showLegend: false,
        setShowLegend: (showLegend) => set({ showLegend }),
        showMiniMap: false,
        setShowMiniMap: (showMiniMap) => set({ showMiniMap }),

      quantumPhase: 'omni',
      setQuantumPhase: (quantumPhase) => set({ quantumPhase }),

      focusedAgent: null,
      setFocusedAgent: (focusedAgent) => set({ focusedAgent }),

      audioText: '',
      setAudioText: (audioText) => set({ audioText }),
      isPlaying: false,
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      audioRate: 1.0,
      setAudioRate: (audioRate) => set({ audioRate }),
      selectedVoiceURI: null,
      setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
    }),
    {
      name: 'agentos-studio-storage',
      partialize: (state) => ({
        chatMessages: state.chatMessages,
        flowNodes: state.flowNodes,
        flowEdges: state.flowEdges,
        agentCards: state.agentCards,
        blueprintMd: state.blueprintMd,
        activeTab: state.activeTab,
        theme: state.theme,
        // Persistiendo el estado de las fases
        phase1Interview: state.phase1Interview,
        triageSummary: state.triageSummary,
        phase2Content: state.phase2Content,
        phase3Content: state.phase3Content,
        phase1Complete: state.phase1Complete,
        phase2Complete: state.phase2Complete,
        phase3Complete: state.phase3Complete,
        zone2ActiveTab: state.zone2ActiveTab,
        quantumPhase: state.quantumPhase,
        quantumFriction: state.quantumFriction,
        atlasFileName: state.atlasFileName,
      }),
    }
  )
);



