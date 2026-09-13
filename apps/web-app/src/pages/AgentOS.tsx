import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../lib/api';
import {
  Brain, MagnifyingGlass, X, PaperPlaneTilt,
  UsersThree, BookOpen, ChatCircle,
  ArrowRight, Wrench
} from '@phosphor-icons/react';

interface AgentItem {
  id: string; name: string; category: string;
  description: string; instructions: string; risk?: string;
}
interface AtlasItem {
  id?: string; title: string; category: string;
  content: string; isMultiPrompt?: boolean;
}
interface Tool { name: string; description: string; }
interface ChatMessage {
  role: 'user' | 'agent' | 'swarm'; content: string;
  agentId?: string;
}

// Avatar emoji por categoría
const categoryEmoji = (cat: string): string => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('market')) return '📣';
  if (c.includes('code') || c.includes('dev')) return '💻';
  if (c.includes('data')) return '📊';
  if (c.includes('design')) return '🎨';
  if (c.includes('business')) return '💼';
  if (c.includes('ai') || c.includes('ml')) return '🤖';
  if (c.includes('write') || c.includes('content')) return '✍️';
  if (c.includes('research')) return '🔬';
  return '⚡';
};

export default function AgentOS() {
  const [tab, setTab] = useState<'agents' | 'atlas'>('agents');
  const [search, setSearch] = useState('');
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [atlasItems, setAtlasItems] = useState<AtlasItem[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentItem | null>(null);
  const [assignedKB, setAssignedKB] = useState<AtlasItem | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [swarmOpen, setSwarmOpen] = useState(false);
  const [swarmSelected, setSwarmSelected] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json')
      .then(r => r.json()).then(setAgents).catch(() => {});
    fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json')
      .then(r => r.json()).then(setAtlasItems).catch(() => {});
    fetch(`${API_URL}/agents/tools`)
      .then(r => r.json()).then(d => setTools(d.tools || [])).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Seleccionar agente activa automáticamente la consola
  const handleSelectAgent = (agent: AgentItem) => {
    setActiveAgent(agent);
    setMessages([{
      role: 'agent',
      content: `¡Hola! Soy **${agent.name || agent.id}**. ${agent.description?.slice(0, 120) || '¿En qué puedo ayudarte hoy?'}`,
      agentId: agent.id
    }]);
    setSwarmSelected([]);
  };

  const filteredAgents = agents.filter(a =>
    (a.name || a.id)?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAtlas = atlasItems.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!inputMsg.trim() || isLoading || !activeAgent) return;
    const msg = inputMsg;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: activeAgent.id, message: msg,
          atlas_knowledge_id: assignedKB?.title || undefined,
          history: messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'agent', content: data.response, agentId: activeAgent.id }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: `Algo salió mal: ${e}` }]);
    } finally { setIsLoading(false); }
  };

  const handleSwarm = async () => {
    if (!inputMsg.trim() || swarmSelected.length === 0 || isLoading) return;
    const msg = inputMsg;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputMsg('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/swarm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_ids: swarmSelected, message: msg })
      });
      const data = await res.json();
      (data.results || []).forEach((r: { agent: string; response: string }) => {
        setMessages(prev => [...prev, { role: 'swarm', content: r.response, agentId: r.agent }]);
      });
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: `Error en el equipo: ${e}` }]);
    } finally { setIsLoading(false); }
  };

  const isSwarmMode = swarmSelected.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#030303', color: '#E0E0E0', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ── HEADER GLOBAL ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '52px', borderBottom: '1px solid #111', backgroundColor: '#050505', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={22} weight="duotone" style={{ color: '#00D9FF' }} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>AgentOS</span>
          <span style={{ fontSize: '11px', color: '#333', margin: '0 4px' }}>•</span>
          <span style={{ fontSize: '11px', color: '#444', letterSpacing: '0.05em' }}>Centro de Control de Agentes</span>
        </div>
        {activeAgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#555' }}>Agente activo:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0a1a0a', border: '1px solid #1a3a1a', borderRadius: '20px', padding: '3px 10px 3px 6px' }}>
              <span style={{ fontSize: '14px' }}>{categoryEmoji(activeAgent.category)}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#7EC87E' }}>{activeAgent.name || activeAgent.id}</span>
            </div>
            {assignedKB && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#0a0a1a', border: '1px solid #1a1a3a', borderRadius: '20px', padding: '3px 10px 3px 6px' }}>
                <BookOpen size={12} style={{ color: '#8080ff' }} />
                <span style={{ fontSize: '11px', color: '#8080cc' }}>{assignedKB.title.slice(0, 30)}{assignedKB.title.length > 30 ? '...' : ''}</span>
              </div>
            )}
            <button onClick={() => { setActiveAgent(null); setMessages([]); setAssignedKB(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: '2px' }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── 3 COLUMNAS ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ══ COLUMNA 1: CATÁLOGO ══ */}
        <div style={{ width: '300px', minWidth: '300px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#040404' }}>
          
          {/* Paso 1 header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#00D9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#000' }}>1</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Elige tu agente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', border: '1px solid #161616', borderRadius: '10px', padding: '8px 12px' }}>
              <MagnifyingGlass size={14} style={{ color: '#444', flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar agentes o conocimiento..."
                style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: '13px', width: '100%' }} />
            </div>
          </div>

          {/* Tabs visuales */}
          <div style={{ display: 'flex', padding: '8px 12px', gap: '6px', borderBottom: '1px solid #0d0d0d' }}>
            <button onClick={() => setTab('agents')}
              style={{ flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: tab === 'agents' ? '#0a1a0a' : 'transparent',
                border: tab === 'agents' ? '1px solid #1a3a1a' : '1px solid transparent',
                color: tab === 'agents' ? '#7EC87E' : '#444' }}>
              🤖 Agentes
            </button>
            <button onClick={() => setTab('atlas')}
              style={{ flex: 1, padding: '7px 0', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: tab === 'atlas' ? '#0a0a1a' : 'transparent',
                border: tab === 'atlas' ? '1px solid #1a1a3a' : '1px solid transparent',
                color: tab === 'atlas' ? '#8080ff' : '#444' }}>
              📚 Conocimiento
            </button>
          </div>

          {/* Lista de cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
            {tab === 'agents' ? (
              filteredAgents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#333', fontSize: '13px' }}>Sin resultados</div>
              ) : filteredAgents.map(agent => (
                <button key={agent.id} onClick={() => handleSelectAgent(agent)}
                  style={{ width: '100%', textAlign: 'left', marginBottom: '6px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: activeAgent?.id === agent.id ? '#0a1a0a' : '#080808',
                    border: activeAgent?.id === agent.id ? '1px solid #1a4a1a' : '1px solid #111',
                    boxShadow: activeAgent?.id === agent.id ? '0 0 0 1px #00D9FF22' : 'none' }}>
                  {/* Avatar */}
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: activeAgent?.id === agent.id ? '#0d2a0d' : '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid #161616' }}>
                    {categoryEmoji(agent.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: activeAgent?.id === agent.id ? '#7EC87E' : '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.name || agent.id}
                    </div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {agent.category}
                    </div>
                  </div>
                  {activeAgent?.id === agent.id && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00D9FF', flexShrink: 0, boxShadow: '0 0 6px #00D9FF' }} />
                  )}
                </button>
              ))
            ) : (
              filteredAtlas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#333', fontSize: '13px' }}>Sin resultados</div>
              ) : filteredAtlas.map((item, i) => (
                <button key={item.id || i} onClick={() => { setAssignedKB(item); setTab('agents'); }}
                  style={{ width: '100%', textAlign: 'left', marginBottom: '6px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: assignedKB?.title === item.title ? '#0a0a1a' : '#080808',
                    border: assignedKB?.title === item.title ? '1px solid #1a1a4a' : '1px solid #111' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#0d0d18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '1px solid #161625' }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: assignedKB?.title === item.title ? '#9090ff' : '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                    <div style={{ fontSize: '11px', color: '#444', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.category}</div>
                  </div>
                  {item.isMultiPrompt && <span style={{ fontSize: '9px', backgroundColor: '#0a0a1a', color: '#6060cc', padding: '2px 6px', borderRadius: '20px', border: '1px solid #1a1a3a', flexShrink: 0 }}>Multi</span>}
                </button>
              ))
            )}
          </div>

          {/* Swarm builder */}
          <div style={{ borderTop: '1px solid #0d0d0d', padding: '10px 12px' }}>
            <button onClick={() => setSwarmOpen(!swarmOpen)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer', backgroundColor: swarmOpen ? '#140a1e' : '#0a0a0a', border: `1px solid ${swarmOpen ? '#2a1a3e' : '#161616'}`, color: swarmOpen ? '#b060ff' : '#555' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <UsersThree size={14} weight={swarmOpen ? 'fill' : 'regular'} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Modo Equipo (Swarm)</span>
              </div>
              <span style={{ fontSize: '10px', backgroundColor: '#1a0a2e', color: '#9060cc', padding: '1px 6px', borderRadius: '10px' }}>{swarmSelected.length}/3</span>
            </button>
            {swarmOpen && (
              <div style={{ marginTop: '8px', maxHeight: '130px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <p style={{ fontSize: '10px', color: '#444', padding: '0 4px 4px', margin: 0 }}>Selecciona hasta 3 agentes para trabajar en equipo:</p>
                {agents.slice(0, 25).map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', backgroundColor: swarmSelected.includes(a.id) ? '#140a1e' : 'transparent', border: swarmSelected.includes(a.id) ? '1px solid #2a1a3e' : '1px solid transparent' }}>
                    <input type="checkbox" checked={swarmSelected.includes(a.id)}
                      onChange={e => { if (e.target.checked && swarmSelected.length < 3) setSwarmSelected(prev => [...prev, a.id]); else setSwarmSelected(prev => prev.filter(id => id !== a.id)); }}
                      style={{ accentColor: '#b060ff' }} />
                    <span style={{ fontSize: '12px' }}>{categoryEmoji(a.category)}</span>
                    <span style={{ fontSize: '11px', color: swarmSelected.includes(a.id) ? '#c090ff' : '#888' }}>{a.name || a.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══ COLUMNA 2: PANEL CENTRAL ══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #111' }}>
          
          {!activeAgent ? (
            // ONBOARDING VISUAL
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '0' }}>
              <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <Brain size={56} weight="thin" style={{ color: '#1a1a1a', marginBottom: '16px' }} />
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#222', margin: '0 0 8px' }}>Tu espacio de trabajo de IA</h2>
                <p style={{ fontSize: '13px', color: '#333', maxWidth: '320px', lineHeight: '1.7', margin: 0 }}>Selecciona un agente del panel izquierdo para comenzar. Sin código, sin configuración técnica.</p>
              </div>
              {/* 3 pasos */}
              <div style={{ display: 'flex', gap: '0', alignItems: 'center' }}>
                {[
                  { icon: '🤖', step: '1', label: 'Elige tu agente', desc: 'Del catálogo de la izquierda' },
                  { icon: '📚', step: '2', label: 'Asigna conocimiento', desc: 'Opcional: añade Atlas KB' },
                  { icon: '💬', step: '3', label: 'Conversa', desc: 'Habla con tu agente' },
                ].map((s, i) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '20px 24px', borderRadius: '16px', backgroundColor: '#080808', border: '1px solid #111', width: '140px' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                      <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px' }}>PASO {s.step}</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '11px', color: '#333', lineHeight: '1.4' }}>{s.desc}</div>
                    </div>
                    {i < 2 && <ArrowRight size={16} style={{ color: '#1a1a1a', margin: '0 4px', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // AGENTE ACTIVO — CONFIGURACIÓN
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
              {/* Card hero del agente */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '28px', padding: '24px', borderRadius: '16px', backgroundColor: '#070d07', border: '1px solid #0d250d', position: 'relative', overflow: 'hidden' }}>
                {/* Glow bg */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#00D9FF08', filter: 'blur(40px)' }} />
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#0d1d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid #1a3a1a', flexShrink: 0 }}>
                  {categoryEmoji(activeAgent.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>{activeAgent.name || activeAgent.id}</h2>
                    <span style={{ fontSize: '10px', backgroundColor: '#0a1a0a', color: '#7EC87E', padding: '2px 8px', borderRadius: '20px', border: '1px solid #1a3a1a' }}>Activo</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#555', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeAgent.category}</p>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0, lineHeight: '1.6', maxWidth: '500px' }}>
                    {activeAgent.description?.slice(0, 200) || 'Agente especializado listo para asistirte.'}
                  </p>
                </div>
              </div>

              {/* Conocimiento asignado */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#00D9FF22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#00D9FF' }}>2</div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#888' }}>Conocimiento asignado</span>
                  </div>
                  <button onClick={() => setTab('atlas')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#0a0a1a', border: '1px solid #1a1a3a', color: '#8080cc' }}>
                    <BookOpen size={12} /> Explorar Atlas
                  </button>
                </div>
                {assignedKB ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', backgroundColor: '#0a0a18', border: '1px solid #1a1a35' }}>
                    <div style={{ fontSize: '24px' }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#9090ff' }}>{assignedKB.title}</div>
                      <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{assignedKB.category}</div>
                    </div>
                    <button onClick={() => setAssignedKB(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', padding: '4px' }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: '#080808', border: '1px dashed #1a1a1a', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#333', margin: 0 }}>Sin conocimiento adicional — haz click en "Explorar Atlas" y selecciona un prompt</p>
                  </div>
                )}
              </div>

              {/* Habilidades / tools como tags */}
              {tools.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#555' }}>✦</div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Habilidades del agente</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {tools.map(t => (
                      <div key={t.name} title={t.description}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', backgroundColor: '#0a0a0a', border: '1px solid #161616', cursor: 'help' }}>
                        <Wrench size={11} style={{ color: '#444' }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>{t.name.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ COLUMNA 3: CONSOLA ══ */}
        <div style={{ width: '420px', minWidth: '420px', display: 'flex', flexDirection: 'column', backgroundColor: '#030303' }}>
          
          {/* Header consola */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: isSwarmMode ? '#b060ff' : '#00D9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#000' }}>3</div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isSwarmMode ? '🌀 Modo Equipo' : '💬 Conversa'}
              </span>
            </div>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])}
                style={{ fontSize: '10px', color: '#333', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                Limpiar
              </button>
            )}
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#222', textAlign: 'center', gap: '12px' }}>
                <ChatCircle size={40} weight="thin" style={{ color: '#1a1a1a' }} />
                <p style={{ fontSize: '13px', color: '#333', margin: 0 }}>
                  {activeAgent || isSwarmMode ? '✦ Escribe tu primer mensaje' : '← Activa un agente para chatear'}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                {(msg.role === 'agent' || msg.role === 'swarm') && msg.agentId && (
                  <div style={{ fontSize: '10px', color: '#333', marginBottom: '4px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{msg.role === 'swarm' ? '🌀' : categoryEmoji(agents.find(a => a.id === msg.agentId)?.category || '')}</span>
                    <span>{agents.find(a => a.id === msg.agentId)?.name || msg.agentId}</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '88%', padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: msg.role === 'user' ? '#0d0d1a' : msg.role === 'swarm' ? '#14081e' : '#060d06',
                  border: msg.role === 'user' ? '1px solid #1a1a2e' : msg.role === 'swarm' ? '1px solid #2a1040' : '1px solid #0d200d',
                  color: msg.role === 'user' ? '#FFFFFF' : msg.role === 'swarm' ? '#c090ff' : '#9BC89F',
                  fontSize: '13px', lineHeight: '1.65', whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', backgroundColor: '#060d06', border: '1px solid #0d200d', color: '#4a7a4a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>⏳</span>
                <span>Procesando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid #0d0d0d', flexShrink: 0 }}>
            {isSwarmMode && (
              <div style={{ marginBottom: '8px', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#0e0814', border: '1px solid #1e1028', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#9060cc' }}>🌀 {swarmSelected.length} agentes en equipo listos</span>
                <button onClick={() => { setSwarmSelected([]); setSwarmOpen(false); }}
                  style={{ fontSize: '10px', color: '#5a3080', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <textarea
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); isSwarmMode ? handleSwarm() : handleSend(); } }}
                placeholder={!activeAgent && !isSwarmMode ? '← Selecciona un agente primero' : isSwarmMode ? 'Mensaje para el equipo de agentes...' : `Habla con ${activeAgent?.name || 'el agente'}...`}
                disabled={!activeAgent && !isSwarmMode}
                rows={2}
                style={{ flex: 1, backgroundColor: '#0a0a0a', border: '1px solid #161616', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#ddd', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
              />
              <button
                onClick={isSwarmMode ? handleSwarm : handleSend}
                disabled={isLoading || (!activeAgent && !isSwarmMode) || !inputMsg.trim()}
                style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s', border: 'none',
                  backgroundColor: isLoading || (!activeAgent && !isSwarmMode) ? '#0a0a0a' : isSwarmMode ? '#1e0a2e' : '#0a1a0a',
                  color: isLoading || (!activeAgent && !isSwarmMode) ? '#2a2a2a' : isSwarmMode ? '#b060ff' : '#7EC87E',
                  boxShadow: (!isLoading && (activeAgent || isSwarmMode)) ? (isSwarmMode ? '0 0 12px #b060ff22' : '0 0 12px #7EC87E22') : 'none' }}>
                {isSwarmMode ? <UsersThree size={18} weight="fill" /> : <PaperPlaneTilt size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
