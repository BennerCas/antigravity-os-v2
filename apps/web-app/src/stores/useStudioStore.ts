import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';

export type TabId = 'discovery' | 'synthesis' | 'blueprint';

export interface ChatMessage {
  id: string;
  role: 'human' | 'system' | 'agent';
  content: string;
  model?: string;
}

export interface AgentCard {
  id: string;
  name: string;
  role: string;
  description: string;
  tools: string[];
  color: string;
}

interface StudioState {
  // Chat
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
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
}

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f43f5e','#f5a623','#06b6d4','#d946ef','#14b8a6'];

/** Parse AI response text → ReactFlow nodes + edges + agent cards */
export function parseAIResponseToFlow(text: string): { nodes: Node[]; edges: Edge[]; cards: AgentCard[]; md: string } {
  const lines = text.split('\n').filter(l => l.trim());
  const cards: AgentCard[] = [];
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Extract agents: lines with "**Name**", "### Name", "- **Name**:", numbered items
  const agentRegex = /^(?:#{1,3}\s+|[-*]\s+\*\*|[-*]\s+|\d+\.\s+\*\*)([A-Za-záéíóúÁÉÍÓÚñÑ\s]+?)(?:\*\*)?(?::|—|-|$)/;
  const descRegex = /[:—-]\s*(.+)/;

  let agentCount = 0;
  let prevId: string | null = null;

  for (const line of lines) {
    const match = line.match(agentRegex);
    if (match && agentCount < 12) {
      const name = match[1].replace(/\*/g, '').trim();
      if (name.length < 3 || name.length > 50) continue;

      const descMatch = line.match(descRegex);
      const description = descMatch ? descMatch[1].replace(/\*\*/g, '').trim() : '';
      const id = `agent_${agentCount}`;
      const color = COLORS[agentCount % COLORS.length];

      // Extract tools from description
      const toolMatch = description.match(/\b(?:usa|use|tools?|herramientas?)[:;]?\s*([^.]+)/i);
      const tools = toolMatch
        ? toolMatch[1].split(/[,;]/).map(t => t.trim()).filter(Boolean).slice(0, 3)
        : [];

      cards.push({ id, name, role: `Agente ${agentCount + 1}`, description, tools, color });

      // ReactFlow node
      const col = agentCount % 3;
      const row = Math.floor(agentCount / 3);
      nodes.push({
        id,
        type: 'default',
        position: { x: 80 + col * 220, y: 60 + row * 140 },
        data: { label: name },
        style: {
          background: '#0f172a',
          color,
          border: `2px solid ${color}`,
          borderRadius: '10px',
          padding: '10px 16px',
          fontWeight: 700,
          fontSize: '12px',
          minWidth: '160px',
          boxShadow: `0 0 12px ${color}44`,
        },
      });

      // Auto-connect sequentially
      if (prevId) {
        edges.push({
          id: `e_${prevId}_${id}`,
          source: prevId,
          target: id,
          animated: true,
          style: { stroke: color, strokeWidth: 2 },
        });
      }
      prevId = id;
      agentCount++;
    }
  }

  // If no agents found, create a single summary node
  if (nodes.length === 0 && text.length > 20) {
    const summary = text.slice(0, 60).replace(/[#*`]/g, '').trim();
    nodes.push({
      id: 'summary_0',
      type: 'default',
      position: { x: 200, y: 150 },
      data: { label: summary + '...' },
      style: {
        background: '#0f172a', color: '#3b82f6', border: '2px solid #3b82f6',
        borderRadius: '10px', padding: '12px 18px', fontWeight: 600, fontSize: '12px',
        maxWidth: '260px', boxShadow: '0 0 16px #3b82f644',
      },
    });
  }

  return { nodes, edges, cards, md: text };
}

export const useStudioStore = create<StudioState>((set) => ({
  activeTab: 'discovery',
  setActiveTab: (tab) => set({ activeTab: tab }),

  chatMessages: [
    { id: '1', role: 'system', content: 'Bienvenido a **AureliOS Studio**. Dime qué sistema quieres construir y veré el flujo aparecer en tiempo real →' }
  ],
  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString() }],
    })),
  clearMessages: () =>
    set({
      chatMessages: [{ id: Date.now().toString(), role: 'system', content: 'Chat limpiado. ¿Qué sistema quieres construir?' }],
      flowNodes: [], flowEdges: [], agentCards: [], blueprintMd: '',
    }),

  flowNodes: [],
  flowEdges: [],
  setFlow: (flowNodes, flowEdges) => set({ flowNodes, flowEdges }),

  agentCards: [],
  setAgentCards: (agentCards) => set({ agentCards }),

  blueprintMd: '',
  setBlueprintMd: (blueprintMd) => set({ blueprintMd }),

  focusedAgent: null,
  setFocusedAgent: (focusedAgent) => set({ focusedAgent }),
}));
