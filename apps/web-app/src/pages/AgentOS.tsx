import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../lib/api';
import { 
  Brain, MagnifyingGlass, BookOpen, 
  Lightning, X, PaperPlaneTilt, Wrench, CaretDown, CaretRight
} from '@phosphor-icons/react';

// --- TYPES ---
interface AgentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  instructions: string;
  risk?: string;
}

interface AtlasItem {
  id?: string;
  title: string;
  category: string;
  content: string;
  isMultiPrompt?: boolean;
}

interface Tool {
  name: string;
  description: string;
}

interface ChatMessage {
  role: 'user' | 'agent' | 'swarm';
  content: string;
  agentId?: string;
  usedTool?: string;
}

export default function AgentOS() {
  // ESTADO
  const [tab, setTab] = useState<'agents' | 'atlas'>('agents');
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [atlasItems, setAtlasItems] = useState<AtlasItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentItem | null>(null);
  const [selectedAtlas, setSelectedAtlas] = useState<AtlasItem | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [atlasKnowledgeId, setAtlasKnowledgeId] = useState('');
  const [tools, setTools] = useState<Tool[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [swarmOpen, setSwarmOpen] = useState(false);
  const [swarmSelected, setSwarmSelected] = useState<string[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // CARGA INICIAL
  useEffect(() => {
    // Cargar agentes desde skills_v2.json
    setIsLoadingAgents(true);
    fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json')
      .then(r => r.json())
      .then((data: AgentItem[]) => setAgents(data))
      .catch(() => {})
      .finally(() => setIsLoadingAgents(false));
    
    // Cargar Atlas KB desde prompts_db.json
    fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json')
      .then(r => r.json())
      .then((data: AtlasItem[]) => setAtlasItems(data))
      .catch(() => {});
    
    // Cargar Tool Registry
    fetch(`${API_URL}/agents/tools`)
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(() => {});
  }, []);

  // AUTO-SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // FILTRADO
  const filteredAgents = agents.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAtlas = atlasItems.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  // ENVIAR MENSAJE
  const handleSend = async () => {
    if (!inputMsg.trim() || isLoading || !activeAgentId) return;
    const userMsg: ChatMessage = { role: 'user', content: inputMsg };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: activeAgentId,
          message: inputMsg,
          atlas_knowledge_id: atlasKnowledgeId || undefined,
          history: messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'agent', content: data.response, agentId: activeAgentId }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: `Error: ${e}`, agentId: activeAgentId }]);
    } finally {
      setIsLoading(false);
    }
  };

  // SWARM
  const handleSwarm = async () => {
    if (!inputMsg.trim() || swarmSelected.length === 0 || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: `[SWARM] ${inputMsg}` };
    setMessages(prev => [...prev, userMsg]);
    const swarmInput = inputMsg;
    setInputMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/swarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_ids: swarmSelected, message: swarmInput })
      });
      const data = await res.json();
      const results: {agent: string, response: string}[] = data.results || [];
      results.forEach(r => {
        setMessages(prev => [...prev, { role: 'swarm', content: r.response, agentId: r.agent }]);
      });
    } catch(e) {
      setMessages(prev => [...prev, { role: 'agent', content: `Swarm error: ${e}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // RENDER
  return (
    <div className="flex h-screen" style={{ backgroundColor: '#050505', color: '#E0E0E0' }}>
      
      {/* ====== COLUMNA 1: CATÁLOGO ====== */}
      <div className="flex flex-col" style={{ width: '288px', minWidth: '288px', borderRight: '1px solid #1a1a1a', backgroundColor: '#080808' }}>
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} weight="duotone" style={{ color: '#7B9C7F' }} />
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>AgentOS</span>
          </div>
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Centro de Control</span>
        </div>
        
        {/* Search */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid #111' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#111' }}>
            <MagnifyingGlass size={14} style={{ color: '#555' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="bg-transparent outline-none flex-1 text-sm"
              style={{ color: '#ccc', fontSize: '13px' }}
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #111' }}>
          {(['agents', 'atlas'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                color: tab === t ? '#7B9C7F' : '#444',
                borderBottom: tab === t ? '2px solid #7B9C7F' : '2px solid transparent',
                backgroundColor: 'transparent',
              }}
            >
              {t === 'agents' ? '🤖 Agentes' : '📚 Atlas KB'}
            </button>
          ))}
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ gap: '2px', display: 'flex', flexDirection: 'column' }}>
          {tab === 'agents' ? (
            isLoadingAgents ? (
              <div className="text-center py-8" style={{ color: '#444', fontSize: '12px' }}>Cargando agentes...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#444', fontSize: '12px' }}>Sin resultados</div>
            ) : filteredAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => { setSelectedAgent(agent); setSelectedAtlas(null); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedAgent?.id === agent.id ? '#0A1C0D' : 'transparent',
                  border: selectedAgent?.id === agent.id ? '1px solid #174A1F' : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: selectedAgent?.id === agent.id ? '#7B9C7F' : '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.name || agent.id}
                  </span>
                  {agent.risk === 'safe' && (
                    <span style={{ fontSize: '9px', backgroundColor: '#0A1C0D', color: '#7B9C7F', padding: '1px 5px', borderRadius: '9999px', border: '1px solid #174A1F' }}>safe</span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.category}</div>
              </button>
            ))
          ) : (
            filteredAtlas.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#444', fontSize: '12px' }}>Sin resultados</div>
            ) : filteredAtlas.map((item, i) => (
              <button
                key={item.id || i}
                onClick={() => { setSelectedAtlas(item); setSelectedAgent(null); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedAtlas?.title === item.title ? '#1a1a2e' : 'transparent',
                  border: selectedAtlas?.title === item.title ? '1px solid #2a2a4e' : '1px solid transparent',
                }}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: selectedAtlas?.title === item.title ? '#a0a0ff' : '#ccc' }}>
                    {item.title}
                  </span>
                  {item.isMultiPrompt && (
                    <span style={{ fontSize: '9px', backgroundColor: '#1a1a2e', color: '#a0a0ff', padding: '1px 5px', borderRadius: '9999px', border: '1px solid #2a2a4e' }}>Multi</span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ====== COLUMNA 2: INSPECTOR ====== */}
      <div className="flex flex-col flex-1 overflow-hidden" style={{ borderRight: '1px solid #1a1a1a' }}>
        {!selectedAgent && !selectedAtlas ? (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ color: '#333' }}>
            <Brain size={48} weight="thin" style={{ marginBottom: '16px', color: '#222' }} />
            <p style={{ fontSize: '14px', color: '#444' }}>← Selecciona un Agente o Atlas KB</p>
            <p style={{ fontSize: '12px', color: '#333', marginTop: '8px' }}>para inspeccionar su configuración</p>
          </div>
        ) : selectedAgent ? (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Header del agente */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>{selectedAgent.name || selectedAgent.id}</h2>
                  <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedAgent.category}</span>
                </div>
                <button
                  onClick={() => {
                    setActiveAgentId(selectedAgent.id);
                    setMessages([{ role: 'agent', content: `Agente **${selectedAgent.name || selectedAgent.id}** activado. ¿En qué puedo ayudarte?`, agentId: selectedAgent.id }]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all"
                  style={{ backgroundColor: '#0A1C0D', border: '1px solid #174A1F', color: '#7B9C7F' }}
                >
                  <Lightning size={14} weight="fill" />
                  Activar en Consola
                </button>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="mb-5">
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Instrucciones</label>
              <div
                style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#888', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
              >
                {selectedAgent.instructions || selectedAgent.description || 'Sin instrucciones disponibles'}
              </div>
            </div>

            {/* Atlas KB asignado */}
            <div className="mb-5">
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>Atlas Knowledge Base</label>
              <input
                value={atlasKnowledgeId}
                onChange={e => setAtlasKnowledgeId(e.target.value)}
                placeholder="Título del prompt de Atlas KB..."
                style={{ width: '100%', backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#ccc', outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>El agente usará este Master Prompt de Atlas como contexto adicional.</p>
            </div>

            {/* Tool Registry */}
            <div>
              <label style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                <Wrench size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Tool Registry ({tools.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tools.map(tool => (
                  <div key={tool.name} style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#7B9C7F', fontFamily: 'monospace' }}>{tool.name}()</div>
                    <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : selectedAtlas ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>{selectedAtlas.title}</h2>
                <span style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{selectedAtlas.category}</span>
              </div>
              {activeAgentId && (
                <button
                  onClick={() => setAtlasKnowledgeId(selectedAtlas.title)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs"
                  style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a4e', color: '#a0a0ff' }}
                >
                  <BookOpen size={14} />
                  Asignar al Agente Activo
                </button>
              )}
            </div>
            <div
              style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', fontSize: '12px', color: '#888', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}
            >
              {selectedAtlas.content}
            </div>
          </div>
        ) : null}
      </div>

      {/* ====== COLUMNA 3: CONSOLA ====== */}
      <div className="flex flex-col" style={{ width: '384px', minWidth: '384px', backgroundColor: '#080808' }}>
        {/* Header consola */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Consola</span>
          {activeAgentId ? (
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '10px', backgroundColor: '#0A1C0D', color: '#7B9C7F', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #174A1F' }}>
                {activeAgentId}
              </span>
              <button onClick={() => { setActiveAgentId(null); setMessages([]); }}>
                <X size={14} style={{ color: '#444' }} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '10px', color: '#333' }}>Sin agente activo</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center" style={{ color: '#333', fontSize: '12px', textAlign: 'center' }}>
              {activeAgentId ? '💬 Escribe un mensaje para comenzar' : '⚡ Activa un agente para chatear'}
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              {(msg.role === 'agent' || msg.role === 'swarm') && msg.agentId && (
                <div style={{ fontSize: '9px', color: '#444', marginBottom: '3px', paddingLeft: '4px' }}>
                  {msg.role === 'swarm' ? '🌀' : '🤖'} {msg.agentId}
                </div>
              )}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? '#1a1a2e' : '#0A1C0D',
                  border: msg.role === 'user' ? '1px solid #2a2a4e' : '1px solid #174A1F',
                  color: msg.role === 'user' ? '#FFFFFF' : '#9BC89F',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', backgroundColor: '#0A1C0D', border: '1px solid #174A1F', color: '#7B9C7F', fontSize: '12px' }}>
              ⏳ Procesando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Swarm Section */}
        <div style={{ borderTop: '1px solid #111', padding: '8px 12px' }}>
          <button
            onClick={() => setSwarmOpen(!swarmOpen)}
            className="flex items-center gap-2 w-full py-1"
            style={{ color: '#444', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: 'transparent' }}
          >
            {swarmOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
            🌀 Swarm ({swarmSelected.length} seleccionados)
          </button>
          {swarmOpen && (
            <div style={{ marginTop: '6px', maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {agents.slice(0, 20).map(a => (
                <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', backgroundColor: swarmSelected.includes(a.id) ? '#0A1C0D' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={swarmSelected.includes(a.id)}
                    onChange={e => {
                      if (e.target.checked && swarmSelected.length < 3) setSwarmSelected(prev => [...prev, a.id]);
                      else setSwarmSelected(prev => prev.filter(id => id !== a.id));
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#888' }}>{a.name || a.id}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '8px' }}>
          <input
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (swarmSelected.length > 0 ? handleSwarm() : handleSend())}
            placeholder={activeAgentId ? 'Escribe un mensaje...' : 'Activa un agente primero'}
            disabled={!activeAgentId && swarmSelected.length === 0}
            style={{ flex: 1, backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#ccc', outline: 'none' }}
          />
          <button
            onClick={swarmSelected.length > 0 ? handleSwarm : handleSend}
            disabled={isLoading || (!activeAgentId && swarmSelected.length === 0)}
            style={{ padding: '10px 14px', backgroundColor: '#0A1C0D', border: '1px solid #174A1F', borderRadius: '8px', color: '#7B9C7F', cursor: 'pointer' }}
          >
            {swarmSelected.length > 0 ? <Lightning size={16} weight="fill" /> : <PaperPlaneTilt size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
