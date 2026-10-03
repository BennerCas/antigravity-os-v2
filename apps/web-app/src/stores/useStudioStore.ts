import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Node, Edge } from '@xyflow/react';

export type TabId = 'discovery' | 'synthesis' | 'blueprint' | 'agentland';

export interface ChatMessage {
  id: string;
  role: 'human' | 'system' | 'agent' | 'swarm';
  content: string;
  model?: string;
  starred?: boolean;
}

export interface ChatHistory {
  id: string;
  name: string;
  messages: ChatMessage[];
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


export interface ChecklistTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AtlasArtifact {
  id: string;
  name: string;
  type: 'file' | 'url' | 'github';
  strategy: 'rag' | 'full';
  namespace: string;
  active: boolean;
}

interface StudioState {

  // Axiomas Parameters
  quantumFriction: number;
  setQuantumFriction: (val: number) => void;
  quantumTemperature: number;
  setQuantumTemperature: (val: number) => void;
  quantumProfile: 'strict' | 'brainstorm' | 'devil_advocate' | 'balanced';
  setQuantumProfile: (profile: 'strict' | 'brainstorm' | 'devil_advocate' | 'balanced') => void;
  quantumCoT: boolean;
  setQuantumCoT: (val: boolean) => void;

  atlasFileName: string | null;
  setAtlasFileName: (name: string | null) => void;
  atlasArtifacts: AtlasArtifact[];
  addAtlasArtifact: (artifact: Omit<AtlasArtifact, 'id'>) => void;
  removeAtlasArtifact: (id: string) => void;
  toggleAtlasArtifact: (id: string) => void;

  // Zones 1 and 2

  // Dynamic Checklist
  dynamicChecklist: ChecklistTask[];
  setDynamicChecklist: (checklist: ChecklistTask[]) => void;
  updateChecklistTask: (id: string, status: ChecklistTask['status']) => void;

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
  chatHistories: ChatHistory[];
  addChatMessage: (msg: Omit<ChatMessage, 'id'>) => void;
  updateLastChatMessage: (content: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  rollupCurrentChat: () => void;
  toggleMessageStar: (id: string) => void;
  saveProject: () => void;
  resetProject: () => void;

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

  // Active Live Artifact (Render Vivo Modal / Drawer)
  activeArtifact: { name: string; content: string } | null;
  setActiveArtifact: (art: { name: string; content: string } | null) => void;

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
    // 1. Try <topology> or <json> tag (support both object {...} and array [...], even if truncated)
    const topTagMatch = text.match(/<(?:topology|json)>([\s\S]*?)(?:<\/(?:topology|json)>|$)/i);
    let matchedTag = false;
    
    if (topTagMatch) {
        try {
            const rawContent = topTagMatch[1].trim();
            // Find start of JSON structure: either { or [
            const firstBrace = rawContent.indexOf('{');
            const firstBracket = rawContent.indexOf('[');
            let startIdx = -1;
            let isArray = false;
            
            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                startIdx = firstBrace;
                isArray = false;
            } else if (firstBracket !== -1) {
                startIdx = firstBracket;
                isArray = true;
            }
            
            if (startIdx !== -1) {
                let candidate = rawContent.substring(startIdx);
                // Try direct parse first
                let parsed: any = null;
                try {
                    parsed = JSON.parse(candidate);
                } catch {
                    // Try auto-repair if truncated
                    let repaired = candidate.trim();
                    // Strip trailing commas or incomplete keys
                    repaired = repaired.replace(/,\s*$/, '');
                    if (isArray) {
                        const lastCloseObj = repaired.lastIndexOf('}');
                        if (lastCloseObj !== -1) {
                            repaired = repaired.substring(0, lastCloseObj + 1) + ']';
                        }
                    } else {
                        const lastCloseObj = repaired.lastIndexOf('}');
                        if (lastCloseObj !== -1) {
                            repaired = repaired.substring(0, lastCloseObj + 1) + '}';
                        }
                    }
                    try { parsed = JSON.parse(repaired); } catch {}
                }

                if (parsed) {
                    if (Array.isArray(parsed)) {
                        jsonNodes = parsed;
                    } else {
                        const root = parsed.topology || parsed;
                        jsonNodes = root.nodes || [];
                        jsonEdges = root.edges || [];
                    }
                    cleanMd = cleanMd.replace(topTagMatch[0], '').trim();
                    matchedTag = true;
                }
            }
        } catch(e) {
            console.error("Failed to parse <topology> tag", e);
        }
    }

    // 2. If no tag matched, try markdown ```json containing "nodes" or "topology" or array of nodes
    if (jsonNodes.length === 0) {
        const mdJsonRegex = /```(?:json)?\s*([{\[][\s\S]*?[}\]])\s*```/;
        const mdMatch = text.match(mdJsonRegex);
        if (mdMatch) {
            try {
                const parsed = JSON.parse(mdMatch[1]);
                if (Array.isArray(parsed)) {
                    jsonNodes = parsed;
                    cleanMd = cleanMd.replace(mdMatch[0], '').trim();
                    matchedTag = true;
                } else {
                    const root = parsed.topology || parsed;
                    if (root.nodes && Array.isArray(root.nodes)) {
                        jsonNodes = root.nodes || [];
                        jsonEdges = root.edges || [];
                        cleanMd = cleanMd.replace(mdMatch[0], '').trim();
                        matchedTag = true;
                    }
                }
            } catch(e) {
                console.error("Failed to parse markdown ```json topology", e);
            }
        }
    }

    // 3. Fallback: Search for any bare JSON containing "nodes" or "topology"
    if (jsonNodes.length === 0) {
        const bareJsonRegex = /\{\s*"(?:topology|nodes)"[\s\S]*\}\s*\}/;
        const bareMatch = text.match(bareJsonRegex);
        if (bareMatch) {
            try {
                const parsed = JSON.parse(bareMatch[0]);
                const root = parsed.topology || parsed;
                if (root.nodes && Array.isArray(root.nodes)) {
                    jsonNodes = root.nodes || [];
                    jsonEdges = root.edges || [];
                    cleanMd = cleanMd.replace(bareMatch[0], '').trim();
                    matchedTag = true;
                }
            } catch(e) {}
        }
    }

    if (matchedTag && cleanMd === '') {
        cleanMd = "> **Topología generada:** Nodos añadidos al lienzo (InfinityBoard).";
    }

    const artifactRegex = /<artifact\s+name="([^"]+)">([\s\S]*?)(?:<\/artifact>|$)/g;
    let artMatch;
    while ((artMatch = artifactRegex.exec(text)) !== null) {
        const artName = artMatch[1];
        const artContent = artMatch[2].trim();
        if (artContent.length > 0) {
            jsonNodes.push({
                id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
                kind: 'artifact',
                label: artName,
                description: artContent,
                content: artContent
            });
            cleanMd = cleanMd.replace(artMatch[0], `\n> **Artefacto generado:** ${artName} (Visible en el Lienzo)\n`).trim();
        }
    }
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    if (jsonNodes.length > 0) {
        // Asignación de columnas por rol funcional para un flujo de izquierda a derecha impecable
        const kindCols: Record<string, number> = {
            trigger: 0,
            router: 1,
            agent: 2,
            tool: 3,
            sink: 4,
            artifact: 5
        };
        const colCounters: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        jsonNodes.forEach((n, idx) => {
            const kind = String((n.data && n.data.kind) || n.kind || n.type || 'agent').toLowerCase();
            const label = (n.data && n.data.label) || n.label || n.name || `Nodo ${idx}`;
            const description = (n.data && n.data.description) || n.description || '';
            const col = kindCols[kind] !== undefined ? kindCols[kind] : (idx % 4);
            const row = colCounters[col] || 0;
            colCounters[col] = (colCounters[col] || 0) + 1;

            const posX = 60 + col * 320;
            const posY = 80 + row * 160;

            nodes.push({
                id: n.id || `node_${idx}`,
                type: kind,
                position: n.position || { x: posX, y: posY },
                data: {
                    label,
                    kind,
                    description,
                    content: n.content || (n.data && n.data.content) || description,
                    tools: n.tools || (n.data && n.data.tools) || [],
                    systemPrompt: n.system_prompt || '',
                    testQueries: n.test_queries || [],
                    inputPort: n.inputPort || (col > 0 ? 'input' : ''),
                    outputPort: n.outputPort || (col < 5 ? 'output' : ''),
                    cost: n.cost || '',
                    status: n.status || '',
                    fullDescription: description,
                    allTools: n.tools || []
                }
            });
        });
        
        const nodeIds = new Set(nodes.map(n => n.id));

        jsonEdges.forEach(e => {
            const src = e.source || e.from || '';
            const tgt = e.target || e.to || '';
            if (src && tgt && nodeIds.has(src) && nodeIds.has(tgt)) {
                edges.push({
                    id: e.id || `e_${src}-${tgt}`,
                    source: src,
                    target: tgt,
                    label: e.label || '',
                    animated: true,
                    style: { stroke: '#38bdf8', strokeWidth: 2 }
                });
            }
        });

        // Si no se proveyeron edges o están incompletos, forjar puentes funcionales entre etapas
        if (edges.length === 0 && nodes.length > 1) {
            const triggers = nodes.filter(n => (n.data as any).kind === 'trigger');
            const routers = nodes.filter(n => (n.data as any).kind === 'router');
            const agents = nodes.filter(n => (n.data as any).kind === 'agent');
            const tools = nodes.filter(n => (n.data as any).kind === 'tool');
            const sinks = nodes.filter(n => (n.data as any).kind === 'sink');
            const artifacts = nodes.filter(n => (n.data as any).kind === 'artifact');

            // 1. Triggers -> Routers
            triggers.forEach(tr => {
                routers.forEach(rt => {
                    edges.push({ id: `e_${tr.id}-${rt.id}`, source: tr.id, target: rt.id, label: 'Enrutar Requerimiento', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } });
                });
            });

            // 2. Routers -> Agents
            routers.forEach(rt => {
                agents.forEach(ag => {
                    edges.push({ id: `e_${rt.id}-${ag.id}`, source: rt.id, target: ag.id, label: 'Delegar Tarea', animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } });
                });
            });

            // Si no hay routers, Triggers -> Agents
            if (routers.length === 0 && triggers.length > 0) {
                triggers.forEach(tr => {
                    agents.forEach(ag => {
                        edges.push({ id: `e_${tr.id}-${ag.id}`, source: tr.id, target: ag.id, label: 'Iniciar Tarea', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } });
                    });
                });
            }

            // 3. Agents -> Tools o Sinks
            agents.forEach(ag => {
                if (tools.length > 0) {
                    tools.forEach(tl => {
                        edges.push({ id: `e_${ag.id}-${tl.id}`, source: ag.id, target: tl.id, label: 'Consultar Recurso', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } });
                    });
                }
                if (sinks.length > 0) {
                    sinks.forEach(sk => {
                        edges.push({ id: `e_${ag.id}-${sk.id}`, source: ag.id, target: sk.id, label: 'Entregar Resultado', animated: true, style: { stroke: '#38bdf8', strokeWidth: 2 } });
                    });
                }
            });

            // 4. Sinks -> Artifacts
            sinks.forEach(sk => {
                artifacts.forEach(art => {
                    edges.push({ id: `e_${sk.id}-${art.id}`, source: sk.id, target: art.id, label: 'Renderizar Artefacto', animated: true, style: { stroke: '#eab308', strokeWidth: 2 } });
                });
            });

            // Si aún no hay edges (ej. lista lineal), conectar secuencialmente
            if (edges.length === 0) {
                for (let i = 0; i < nodes.length - 1; i++) {
                    edges.push({
                        id: `auto_e_${nodes[i].id}-${nodes[i+1].id}`,
                        source: nodes[i].id,
                        target: nodes[i+1].id,
                        label: 'Flujo de Ejecución',
                        animated: true,
                        style: { stroke: '#38bdf8', strokeWidth: 2 }
                    });
                }
            }
        }
        
        const cards: AgentCard[] = [];
        nodes.forEach(n => {
            const data = (n.data || {}) as Record<string, any>;
            const kind = String(data.kind || n.type || 'agent');
            const label = String(data.label || n.id || 'Agente');
            const desc = String(data.description || data.fullDescription || '');
            const color = KIND_COLORS[kind] || '#3b82f6';
            const tools: string[] = Array.isArray(data.tools) ? data.tools : [];
            
            cards.push({
                id: n.id,
                name: label,
                role: kind === 'trigger' ? 'Disparador / Entrada' :
                      kind === 'router' ? 'Orquestador / Enrutador' :
                      kind === 'tool' ? 'Herramienta / Recurso' :
                      kind === 'sink' ? 'Receptor / Agregador' :
                      'Agente Especialista',
                description: desc,
                genes: [
                    { kind: 'Especialidad', name: 'Dominio', value: label, category: 'cognition' } as any,
                    { kind: 'Tipo de Nodo', name: 'Arquitectura', value: kind.toUpperCase(), category: 'architecture' } as any,
                    { kind: 'Inferencia', name: 'Motor', value: 'Local AMD / Hermes 3', category: 'runtime' } as any
                ],
                noveltyScore: 94,
                evalStatus: 'PASS',
                color,
                health: 'green',
                tools: tools,
                requiredTools: tools.length > 0 ? tools : ['Cognicion Autonoma', 'Python Runtime', 'Blackboard State'],
                inputOutputContract: `IN: Peticion / Contexto -> OUT: Procesamiento de ${label}`,
                systemPrompt: data.systemPrompt || `Eres ${label}. Responsabilidad: ${desc}`,
                testQueries: [`Probar ejecucion de ${label}`]
            });
        });

        // Generar Blueprint Tecnico enriquecido
        let blueprintDocument = cleanMd;
        if (!blueprintDocument.includes('# Blueprint') && !blueprintDocument.includes('# Arquitectura')) {
            blueprintDocument = `## 🏛️ Blueprint Arquitectonico del Sistema

### 1. Resumen Ejecutivo del Flujo
Este documento especifica la arquitectura de agentes, orquestadores y herramientas generada para resolver la solicitud del usuario mediante el motor cuantico de Antigravity OS.

### 2. Inventario de Nodos y Componentes (${nodes.length} modulos)
${nodes.map((n, i) => {
    const d = (n.data || {}) as Record<string, any>;
    const k = String(d.kind || n.type || 'agent').toUpperCase();
    const l = String(d.label || n.id);
    const fn = String(d.description || 'Sin descripcion');
    const tls = Array.isArray(d.tools) && d.tools.length > 0 ? d.tools.join(', ') : 'Operacion cognitiva nativa';
    return `- **${i+1}. [${k}] ${l}** (\`${n.id}\`):\n  * **Funcion:** ${fn}\n  * **Herramientas:** ${tls}`;
}).join('\n')}

### 3. Matriz de Conectividad y Dependencias (${edges.length} conexiones)
${edges.map((e, i) => `- **Paso ${i+1}:** \`${e.source}\` ➔ \`${e.target}\`${e.label ? ` *(Accion: ${e.label})*` : ''}`).join('\n')}

### 4. Protocolo de Ejecucion y Consenso
- **Topologia:** Grafo Aciclico Dirigido (DAG) validado para InfinityBoard.
- **Canal de Estado:** Memoria compartida (*Blackboard Manager*) con aislamiento Zero-Trust (*Sly-Data*).
- **Consenso:** Debate asincrono y forja de artefactos en GPU local.
`;
        }
        
        return { nodes, edges, cards, md: blueprintDocument };
    }

    // LEGACY FALLBACK (strip thinking blocks so internal reasoning is never parsed as nodes)
    let textWithoutThinking = text
      .replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, '')
      .replace(/---\s*\n\s*\*\*🧠[\s\S]*?(?:---\n|$)/gi, '')
      .replace(/(?:🧠|\*\*🧠)?\s*Proceso Cognitivo:[\s\S]*?(?=\n#{1,4}\s|\n<topology>|\n<artifact|\n```|$)/gi, '')
      .trim();
    const lines = textWithoutThinking.split('\n');
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

    const isIgnoredThinking = /^(nota|note|resumen|summary|conclusi|intro|thinking|proceso|analyze|intent|decision|assessment|constraint|style|persona|role|context|prompt|topology|artifact|swarm|_)/i.test(name) ||
                              name.includes('<thinking>') || name.includes('🧠') || name.includes('Proceso Cognitivo') ||
                              /user intent|cognitive process/i.test(name);

    if (name.length >= 3 && name.length <= 60 && !isIgnoredThinking) {
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

  if (nodes.length === 0 && textWithoutThinking.length > 30) {
    const candidateLines = textWithoutThinking.split('\n').map(l => l.trim()).filter(l => l.length >= 3);
    const validLine = candidateLines.find(l => {
      const isIgnored = /^(nota|note|resumen|summary|conclusi|intro|thinking|proceso|analyze|intent|decision|assessment|constraint|style|persona|role|context|prompt|topology|artifact|swarm|<|_)/i.test(l) ||
                        l.includes('🧠') || l.includes('Proceso Cognitivo') || /user intent/i.test(l);
      return !isIgnored;
    });

    if (validLine) {
      const summary = validLine.replace(/[#*`]/g,'').trim().slice(0,60);
      nodes.push({
        id: 'summary_0', type: 'agent',
        position: { x: 180, y: 140 },
        data: { label: summary, kind:'agent', description:'', tools:[], inputPort:'', outputPort:'output', cost:'', status:'', fullDescription: textWithoutThinking.slice(0,400), allTools:[] },
      });
    }
  }

  return { nodes, edges, cards, md: text };
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({

      // Axiomas Parameters
      quantumFriction: 50,
      setQuantumFriction: (val) => set({ quantumFriction: val }),
      quantumTemperature: 0.7,
      setQuantumTemperature: (val) => set({ quantumTemperature: val }),
      quantumProfile: 'balanced',
      setQuantumProfile: (profile) => set({ quantumProfile: profile }),
      quantumCoT: true,
      setQuantumCoT: (val) => set({ quantumCoT: val }),
      atlasFileName: null,
      setAtlasFileName: (name) => set({ atlasFileName: name }),
      atlasArtifacts: [],
      addAtlasArtifact: (artifact) => set((state) => ({
        atlasArtifacts: [...state.atlasArtifacts, { ...artifact, id: crypto.randomUUID() }]
      })),
      removeAtlasArtifact: (id) => set((state) => ({
        atlasArtifacts: state.atlasArtifacts.filter(a => a.id !== id)
      })),
      toggleAtlasArtifact: (id) => set((state) => ({
        atlasArtifacts: state.atlasArtifacts.map(a => a.id === id ? { ...a, active: !a.active } : a)
      })),
      activeTab: 'discovery',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Dynamic Checklist
      dynamicChecklist: [
        { id: 'triage', title: 'Triage & Extracción', status: 'pending' },
        { id: 'blueprint', title: 'Generación de Blueprint', status: 'pending' },
        { id: 'deploy', title: 'Despliegue Cuántico', status: 'pending' }
      ],
      setDynamicChecklist: (checklist) => set({ dynamicChecklist: checklist }),
      updateChecklistTask: (id, status) => set((state) => {
        const exists = state.dynamicChecklist.find(t => t.id === id);
        if (exists) {
            return {
                dynamicChecklist: state.dynamicChecklist.map((task) => 
                    task.id === id ? { ...task, status } : task
                )
            };
        } else {
            return {
                dynamicChecklist: [...state.dynamicChecklist, { id, title: id, status }]
            };
        }
      }),

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
      chatHistories: [],
      rollupCurrentChat: () => set((state) => {
        if (state.chatMessages.length <= 1) return state; // Don't rollup if empty or just welcome msg
        const newHistory: ChatHistory = {
          id: Date.now().toString(),
          name: `Historial ${state.chatHistories.length + 1}`,
          messages: [...state.chatMessages]
        };
        return {
          chatHistories: [...state.chatHistories, newHistory],
          chatMessages: [{ id: Date.now().toString(), role: 'system', content: 'Historial guardado. ¿En qué trabajamos ahora?' }]
        };
      }),
      toggleMessageStar: (id) => set((state) => ({
        chatMessages: state.chatMessages.map(msg => msg.id === id ? { ...msg, starred: !msg.starred } : msg),
        chatHistories: state.chatHistories.map(hist => ({
          ...hist,
          messages: hist.messages.map(msg => msg.id === id ? { ...msg, starred: !msg.starred } : msg)
        }))
      })),
      saveProject: () => {
        const state = get();
        // Here we could export to JSON or save to backend. 
        // For now, we'll just console log and reset to simulate save & reset.
        console.log("Project saved!", { nodes: state.flowNodes, edges: state.flowEdges, messages: state.chatMessages });
        alert("Proyecto guardado localmente (Simulado). Limpiando lienzo...");
        get().resetProject();
      },
      resetProject: () => set({
        chatMessages: [{ id: Date.now().toString(), role: 'system', content: 'Nuevo Proyecto Iniciado. ¿Qué construimos hoy?' }],
        chatHistories: [],
        flowNodes: [],
        flowEdges: [],
        activityLogs: [],
        quantumPhase: 'omni'
      }),
      addChatMessage: (msg) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, { ...msg, id: Date.now().toString() + Math.random().toString().substring(1) }],
        })),
      updateLastChatMessage: (content) =>
        set((state) => {
          if (state.chatMessages.length === 0) return state;
          const newMessages = [...state.chatMessages];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content
          };
          return { chatMessages: newMessages };
        }),
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
            dynamicChecklist: state.dynamicChecklist,
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
               dynamicChecklist: state.dynamicChecklist,
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
            dynamicChecklist: previous.dynamicChecklist !== undefined ? previous.dynamicChecklist : state.dynamicChecklist,
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
               dynamicChecklist: state.dynamicChecklist,
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
            dynamicChecklist: next.dynamicChecklist !== undefined ? next.dynamicChecklist : state.dynamicChecklist,
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

      activeArtifact: null,
      setActiveArtifact: (activeArtifact) => set({ activeArtifact }),

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
        chatHistories: state.chatHistories,
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
        dynamicChecklist: state.dynamicChecklist,
               phase1Complete: state.phase1Complete,
        phase2Complete: state.phase2Complete,
        phase3Complete: state.phase3Complete,
        zone2ActiveTab: state.zone2ActiveTab,
        quantumPhase: state.quantumPhase,
        quantumFriction: state.quantumFriction,
        quantumTemperature: state.quantumTemperature,
        quantumProfile: state.quantumProfile,
        quantumCoT: state.quantumCoT,
        atlasFileName: state.atlasFileName,
        atlasArtifacts: state.atlasArtifacts,
      }),
    }
  )
);



