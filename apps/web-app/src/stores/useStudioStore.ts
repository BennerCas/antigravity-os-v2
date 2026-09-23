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
}

export interface ActivityLog {
  id: string;
  source: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFO';
  timestamp: string;
}

interface StudioState {
  // Zones 1 and 2
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  zone2ActiveTab: 'okr' | 'phase1' | 'phase2' | 'phase3';
  setZone2ActiveTab: (tab: 'okr' | 'phase1' | 'phase2' | 'phase3') => void;

  // Chat
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isSynthesizing: boolean;
  setIsSynthesizing: (val: boolean) => void;
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

  // Agent Carousel
  agentCards: AgentCard[];
  setAgentCards: (cards: AgentCard[]) => void;

  // Blueprint (Markdown)
  blueprintMd: string;
  setBlueprintMd: (md: string) => void;

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

function detectKind(name: string, desc: string): string {
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
  const lines = text.split('\n');
  const cards: AgentCard[] = [];
  const nodes: Node[] = [];
  const edges: Edge[] = [];
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
      activeTab: 'discovery',
      setActiveTab: (tab) => set({ activeTab: tab }),
      activityLogs: [
        { id: '0', source: 'AureliOS', message: 'Sistema Operativo inicializado. Esperando intenciones del usuario.', status: 'INFO', timestamp: new Date().toISOString() }
      ],
      addActivityLog: (log) => set((state) => ({
        activityLogs: [...state.activityLogs, { ...log, id: Date.now().toString(), timestamp: new Date().toISOString() }]
      })),
      zone2ActiveTab: 'okr',
      setZone2ActiveTab: (tab) => set({ zone2ActiveTab: tab }),
      isSynthesizing: false,
      setIsSynthesizing: (val) => set({ isSynthesizing: val }),
      theme: 'obsidian',
      setTheme: (theme) => set({ theme }),

      chatMessages: [
        { id: '1', role: 'system', content: 'Bienvenido a **AureliOS Studio**. Dime qué sistema quieres construir y veré el flujo aparecer en tiempo real  ' }
      ],
      addChatMessage: (msg) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString() }],
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
      }),
    }
  )
);
