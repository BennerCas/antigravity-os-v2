import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../lib/api';
import {
  Brain, MagnifyingGlass, PaperPlaneTilt,
  
  Lightning, Plus, Trash, ArrowLeft, ArrowRight
} from '@phosphor-icons/react';

interface AgentItem { id: string; name: string; category: string; description: string; instructions: string; risk?: string; }
interface AtlasItem { id?: string; title: string; category: string; content: string; isMultiPrompt?: boolean; }
interface Tool { name: string; description: string; }
interface ChatMessage { role: 'user'|'agent'|'swarm'|'system'; content: string; agentId?: string; }
interface Team { id: string; name: string; agents: AgentItem[]; kbTitle?: string; createdAt: string; }

const catEmoji = (cat: string): string => {
  const c = (cat || '').toLowerCase();
  if (c.includes('market')) return '📣';
  if (c.includes('code') || c.includes('dev')) return '💻';
  if (c.includes('data')) return '📊';
  if (c.includes('design')) return '🎨';
  if (c.includes('business')) return '💼';
  if (c.includes('ai') || c.includes('ml')) return '🤖';
  if (c.includes('writ') || c.includes('content')) return '✍️';
  if (c.includes('research')) return '🔬';
  if (c.includes('legal')) return '⚖️';
  if (c.includes('sales')) return '💰';
  return '⚡';
};

export default function AgentOS() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [atlasItems, setAtlasItems] = useState<AtlasItem[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  // Screen 1
  const [view, setView] = useState<'select'|'teams'|'interact'>('select');
  const [agentSearch, setAgentSearch] = useState('');
  const [kbSearch, setKBSearch] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<AgentItem[]>([]);
  const [assignedKB, setAssignedKB] = useState<AtlasItem|null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [optimizingId, setOptimizingId] = useState<string|null>(null);

  // Screen 2
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team|null>(null);
  const [teamAdvisorMessages, setTeamAdvisorMessages] = useState<ChatMessage[]>([]);
  const [teamAdvisorInput, setTeamAdvisorInput] = useState('');
  const [activeTeam, setActiveTeam] = useState<Team|null>(null);

  // Screen 3
  const [interactMode, setInteractMode] = useState<'agent'|'team'>('agent');
  const [activeAgentForChat, setActiveAgentForChat] = useState<AgentItem|null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json')
      .then(r => r.json()).then(setAgents).catch(() => {});
    fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json')
      .then(r => r.json()).then(setAtlasItems).catch(() => {});
    fetch(`${API_URL}/agents/tools`)
      .then(r => r.json()).then(d => setTools(d.tools || [])).catch(() => {});
      
    const storedView = localStorage.getItem('agentos_view') as any;
    if (storedView) setView(storedView);
    const storedTeams = localStorage.getItem('agentos_teams');
    if (storedTeams) {
      try { setTeams(JSON.parse(storedTeams)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('agentos_view', view);
  }, [view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantMessages, teamAdvisorMessages]);

  // Screen 1 functions
  const filteredAgents = agents.filter(a =>
    (a.name || a.id)?.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.category?.toLowerCase().includes(agentSearch.toLowerCase())
  );
  const filteredAtlas = atlasItems.filter(a =>
    a.title?.toLowerCase().includes(kbSearch.toLowerCase()) ||
    a.category?.toLowerCase().includes(kbSearch.toLowerCase())
  );

  const toggleAgent = (a: AgentItem) => {
    if (selectedAgents.find(sa => sa.id === a.id)) {
      setSelectedAgents(prev => prev.filter(sa => sa.id !== a.id));
    } else {
      setSelectedAgents(prev => [...prev, a]);
    }
  };

  const handleOptimizeAgent = async (agent: AgentItem) => {
    setOptimizingId(agent.id);
    try {
      const res = await fetch(`${API_URL}/agents/optimize`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id })
      });
      if (!res.ok) throw new Error('Failed to optimize');
      await res.json();
    } catch (e) {
      console.error(e);
    } finally {
      setOptimizingId(null);
    }
  };

  const handleOptimizeKB = async (kb: AtlasItem) => {
    try {
      await fetch(`${API_URL}/agents/optimize-kb`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kb_title: kb.title, content: kb.content })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) return;
    const msg = assistantInput;
    setAssistantMessages(prev => [...prev, { role: 'user', content: msg }]);
    setAssistantInput('');
    try {
      const res = await fetch(`${API_URL}/agents/search-assist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: msg })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssistantMessages(prev => [...prev, { role: 'agent', content: data.response }]);
    } catch (e) {
      setAssistantMessages(prev => [...prev, { role: 'system', content: 'Asistente no disponible' }]);
    }
  };

  // Screen 2 functions
  const handleNewTeam = () => {
    const newTeam: Team = { id: Date.now().toString(), name: 'Nuevo Equipo', agents: [], createdAt: new Date().toISOString() };
    setTeams(prev => [...prev, newTeam]);
    setEditingTeam(newTeam);
  };
  
  const handleSaveTeam = () => {
    if (!editingTeam) return;
    const updated = teams.map(t => t.id === editingTeam.id ? editingTeam : t);
    setTeams(updated);
    localStorage.setItem('agentos_teams', JSON.stringify(updated));
  };
  
  const handleDeleteTeam = (id: string) => {
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    localStorage.setItem('agentos_teams', JSON.stringify(updated));
    if (editingTeam?.id === id) setEditingTeam(null);
  };

  const handleTeamAdvisorSend = async () => {
    if (!teamAdvisorInput.trim()) return;
    const msg = teamAdvisorInput;
    setTeamAdvisorMessages(prev => [...prev, { role: 'user', content: msg }]);
    setTeamAdvisorInput('');
    try {
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: 'agentos_team_advisor', message: msg })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTeamAdvisorMessages(prev => [...prev, { role: 'agent', content: data.response }]);
    } catch (e) {
      setTeamAdvisorMessages(prev => [...prev, { role: 'system', content: 'Error' }]);
    }
  };

  // Screen 3 functions
  const handleChatSend = async () => {
    if (!inputMsg.trim() || isLoading) return;
    const msg = inputMsg;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setInputMsg('');
    setIsLoading(true);

    try {
      if (interactMode === 'agent' && activeAgentForChat) {
        const res = await fetch(`${API_URL}/agents/chat`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: activeAgentForChat.id, message: msg,
            atlas_knowledge_id: assignedKB?.title || undefined,
            history: messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
          })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'agent', content: data.response, agentId: activeAgentForChat.id }]);
      } else if (interactMode === 'team' && activeTeam && activeTeam.agents.length > 0) {
        const res = await fetch(`${API_URL}/agents/swarm`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_ids: activeTeam.agents.map(a => a.id), message: msg })
        });
        const data = await res.json();
        (data.results || []).forEach((r: { agent: string; response: string }) => {
          setMessages(prev => [...prev, { role: 'swarm', content: r.response, agentId: r.agent }]);
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'system', content: `Algo salió mal: ${e}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#030303', color: '#E0E0E0', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER GLOBAL */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '52px', borderBottom: '1px solid #111', backgroundColor: '#050505', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={22} weight="duotone" style={{ color: '#00D9FF' }} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>AgentOS</span>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => setView('select')} style={{ background: 'none', border: 'none', borderBottom: view === 'select' ? '2px solid #00D9FF' : '2px solid transparent', color: view === 'select' ? '#fff' : '#666', fontSize: '13px', fontWeight: 600, padding: '15px 8px', cursor: 'pointer' }}>select</button>
          <button onClick={() => setView('teams')} style={{ background: 'none', border: 'none', borderBottom: view === 'teams' ? '2px solid #00D9FF' : '2px solid transparent', color: view === 'teams' ? '#fff' : '#666', fontSize: '13px', fontWeight: 600, padding: '15px 8px', cursor: 'pointer' }}>teams</button>
          <button onClick={() => setView('interact')} style={{ background: 'none', border: 'none', borderBottom: view === 'interact' ? '2px solid #00D9FF' : '2px solid transparent', color: view === 'interact' ? '#fff' : '#666', fontSize: '13px', fontWeight: 600, padding: '15px 8px', cursor: 'pointer' }}>interact</button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'select' && (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Col 1: Agents */}
            <div style={{ flex: 1, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#040404' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', border: '1px solid #161616', borderRadius: '10px', padding: '8px 12px' }}>
                  <MagnifyingGlass size={14} style={{ color: '#444' }} />
                  <input value={agentSearch} onChange={e => setAgentSearch(e.target.value)} placeholder="Buscar agentes..." style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: '13px', width: '100%' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
                {filteredAgents.map(a => {
                  const selected = !!selectedAgents.find(sa => sa.id === a.id);
                  return (
                    <div key={a.id} style={{ display: 'flex', flexDirection: 'column', padding: '16px', borderRadius: '12px', backgroundColor: '#0a0a0a', border: selected ? '1px solid #1a4a1a' : '1px solid #111', position: 'relative' }}>
                      {a.risk && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: '10px', backgroundColor: '#2a1010', color: '#ff6666', padding: '2px 6px', borderRadius: '4px' }}>{a.risk}</span>}
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>{catEmoji(a.category)}</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ddd', marginBottom: '4px' }}>{a.name || a.id}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px', flex: 1 }}>{a.description?.slice(0, 80)}...</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => toggleAgent(a)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: selected ? '1px solid #1a4a1a' : '1px solid #222', backgroundColor: selected ? '#0a1a0a' : '#111', color: selected ? '#7EC87E' : '#ddd', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          {selected ? '✔ Seleccionado' : 'Seleccionar'}
                        </button>
                        <button onClick={() => handleOptimizeAgent(a)} disabled={optimizingId === a.id} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #16404a', backgroundColor: '#05181c', color: '#00D9FF', cursor: 'pointer' }}>
                          {optimizingId === a.id ? '...' : <Lightning size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid #111', backgroundColor: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>{selectedAgents.length} agentes | KB: {assignedKB ? assignedKB.title : 'ninguno'}</span>
                <button onClick={() => setView('interact')} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#00D9FF', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  → Interactuar
                </button>
              </div>
            </div>

            {/* Col 2: Atlas KB */}
            <div style={{ flex: 1, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#040404' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', border: '1px solid #161616', borderRadius: '10px', padding: '8px 12px' }}>
                  <MagnifyingGlass size={14} style={{ color: '#444' }} />
                  <input value={kbSearch} onChange={e => setKBSearch(e.target.value)} placeholder="Buscar conocimiento..." style={{ background: 'none', border: 'none', outline: 'none', color: '#ccc', fontSize: '13px', width: '100%' }} />
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredAtlas.map(kb => {
                  const active = assignedKB?.title === kb.title;
                  return (
                    <div key={kb.id || kb.title} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#0a0a0a', border: active ? '1px solid #1a1a4a' : '1px solid #111', display: 'flex', gap: '12px' }}>
                      <div style={{ fontSize: '24px' }}>📄</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: active ? '#8080ff' : '#ddd', marginBottom: '4px' }}>{kb.title}</div>
                        <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>{kb.category}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{kb.content?.slice(0, 100)}...</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setAssignedKB(active ? null : kb)} style={{ padding: '6px 12px', borderRadius: '6px', border: active ? '1px solid #1a1a4a' : '1px solid #222', backgroundColor: active ? '#0a0a1a' : '#111', color: active ? '#8080ff' : '#ddd', cursor: 'pointer', fontSize: '11px' }}>
                            {active ? 'Asignado' : 'Asignar'}
                          </button>
                          <button onClick={() => handleOptimizeKB(kb)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #16404a', backgroundColor: '#05181c', color: '#00D9FF', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lightning size={12} /> Mejorar KB
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Col 3: AI Assistant */}
            <div style={{ width: assistantOpen ? '288px' : '48px', transition: 'width 0.2s', display: 'flex', flexDirection: 'column', backgroundColor: '#050505' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d', display: 'flex', alignItems: 'center', justifyContent: assistantOpen ? 'space-between' : 'center' }}>
                {assistantOpen && <span style={{ fontSize: '13px', fontWeight: 600, color: '#00D9FF' }}>Asistente AI</span>}
                <button onClick={() => setAssistantOpen(!assistantOpen)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                  {assistantOpen ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                </button>
              </div>
              {assistantOpen && (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assistantMessages.map((m, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: m.role === 'user' ? '#0d0d1a' : '#0a0a0a', border: '1px solid #111', color: m.role === 'user' ? '#fff' : '#00D9FF', fontSize: '12px' }}>
                        {m.content}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px', borderTop: '1px solid #0d0d0d' }}>
                    <input value={assistantInput} onChange={e => setAssistantInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAssistantSend(); }} placeholder="Ej: Encuentra agentes..." style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#0a0a0a', border: '1px solid #161616', color: '#fff', fontSize: '12px', outline: 'none' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {view === 'teams' && (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Col 1: Mis Equipos */}
            <div style={{ width: '256px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#040404' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ccc' }}>Mis Equipos</span>
                <button onClick={handleNewTeam} style={{ background: 'none', border: 'none', color: '#00D9FF', cursor: 'pointer' }}><Plus size={16} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teams.map(t => (
                  <div key={t.id} onClick={() => setEditingTeam(t)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: editingTeam?.id === t.id ? '#0a1a0a' : '#0a0a0a', border: editingTeam?.id === t.id ? '1px solid #1a4a1a' : '1px solid #111', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{t.agents.length} agentes</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><Trash size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2: Constructor */}
            <div style={{ flex: 1, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#030303' }}>
              {editingTeam ? (
                <>
                  <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '18px', fontWeight: 600, outline: 'none', padding: '4px 0' }} />
                    <select value={editingTeam.kbTitle || ''} onChange={e => setEditingTeam({...editingTeam, kbTitle: e.target.value})} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#0a0a0a', border: '1px solid #222', color: '#ccc', fontSize: '12px' }}>
                      <option value="">Sin KB compartido</option>
                      {atlasItems.map(kb => <option key={kb.id || kb.title} value={kb.title}>{kb.title}</option>)}
                    </select>
                    <button onClick={handleSaveTeam} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#111', border: '1px solid #222', color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Guardar</button>
                    <button onClick={() => { setActiveTeam(editingTeam); setInteractMode('team'); setView('interact'); }} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#0a1a0a', border: '1px solid #1a4a1a', color: '#7EC87E', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>▶ Activar</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
                    {agents.map(a => {
                      const checked = !!editingTeam.agents.find(ea => ea.id === a.id);
                      return (
                        <label key={a.id} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '8px', backgroundColor: '#0a0a0a', border: checked ? '1px solid #1a4a1a' : '1px solid #111', cursor: 'pointer', alignItems: 'center' }}>
                          <input type="checkbox" checked={checked} onChange={e => {
                            if (e.target.checked) setEditingTeam({...editingTeam, agents: [...editingTeam.agents, a]});
                            else setEditingTeam({...editingTeam, agents: editingTeam.agents.filter(ea => ea.id !== a.id)});
                          }} style={{ accentColor: '#7EC87E' }} />
                          <span style={{ fontSize: '20px' }}>{catEmoji(a.category)}</span>
                          <span style={{ fontSize: '13px', color: '#ddd' }}>{a.name || a.id}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Selecciona o crea un equipo</div>
              )}
            </div>

            {/* Col 3: AI Advisor */}
            <div style={{ width: '288px', display: 'flex', flexDirection: 'column', backgroundColor: '#050505' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#7B9C7F' }}>AI Advisor</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teamAdvisorMessages.map((m, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: m.role === 'user' ? '#0d0d1a' : '#0a0a0a', border: '1px solid #111', color: m.role === 'user' ? '#fff' : '#7B9C7F', fontSize: '12px' }}>
                    {m.content}
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px', borderTop: '1px solid #0d0d0d' }}>
                <input value={teamAdvisorInput} onChange={e => setTeamAdvisorInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleTeamAdvisorSend(); }} placeholder="Ej: Recomiéndame un equipo..." style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#0a0a0a', border: '1px solid #161616', color: '#fff', fontSize: '12px', outline: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {view === 'interact' && (
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Sidebar Contexto */}
            <div style={{ width: '288px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', backgroundColor: '#040404' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d', display: 'flex', gap: '8px' }}>
                <button onClick={() => setInteractMode('agent')} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: interactMode === 'agent' ? '1px solid #1a3a1a' : '1px solid transparent', backgroundColor: interactMode === 'agent' ? '#0a1a0a' : 'transparent', color: interactMode === 'agent' ? '#7EC87E' : '#666', fontSize: '12px', cursor: 'pointer' }}>Modo Agente</button>
                <button onClick={() => setInteractMode('team')} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: interactMode === 'team' ? '1px solid #2a1a3e' : '1px solid transparent', backgroundColor: interactMode === 'team' ? '#140a1e' : 'transparent', color: interactMode === 'team' ? '#b060ff' : '#666', fontSize: '12px', cursor: 'pointer' }}>Modo Equipo</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {interactMode === 'agent' && (
                  <>
                    <button onClick={() => setView('select')} style={{ padding: '8px', background: 'none', border: '1px dashed #333', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '12px', marginBottom: '8px' }}>← Volver a Seleccionar</button>
                    {selectedAgents.map(a => (
                      <div key={a.id} onClick={() => setActiveAgentForChat(a)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: activeAgentForChat?.id === a.id ? '#0a1a0a' : '#0a0a0a', border: activeAgentForChat?.id === a.id ? '1px solid #1a4a1a' : '1px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{catEmoji(a.category)}</span>
                        <span style={{ fontSize: '13px', color: activeAgentForChat?.id === a.id ? '#7EC87E' : '#ddd' }}>{a.name || a.id}</span>
                      </div>
                    ))}
                    {assignedKB && (
                      <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: '#0a0a1a', border: '1px solid #1a1a3a' }}>
                        <div style={{ fontSize: '11px', color: '#8080ff', marginBottom: '4px' }}>KB Asignado</div>
                        <div style={{ fontSize: '13px', color: '#ccc' }}>{assignedKB.title}</div>
                      </div>
                    )}
                  </>
                )}
                {interactMode === 'team' && (
                  <>
                    {activeTeam ? (
                      <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#140a1e', border: '1px solid #2a1a3e' }}>
                        <div style={{ fontSize: '14px', color: '#b060ff', fontWeight: 600, marginBottom: '8px' }}>{activeTeam.name}</div>
                        {activeTeam.agents.map(a => (
                          <div key={a.id} style={{ fontSize: '12px', color: '#ccc', marginBottom: '4px', display: 'flex', gap: '6px' }}>
                            <span>{catEmoji(a.category)}</span>
                            <span>{a.name || a.id}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>Ningún equipo activo</div>
                    )}
                  </>
                )}
                <div style={{ marginTop: '24px' }}>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>Tools Disponibles</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {tools.map(t => (
                      <span key={t.name} style={{ fontSize: '10px', color: '#888', backgroundColor: '#111', padding: '2px 6px', borderRadius: '4px', border: '1px solid #222' }}>{t.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Consola */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#030303' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #0d0d0d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: interactMode === 'team' ? '#b060ff' : '#7EC87E' }}>
                  {interactMode === 'team' ? (activeTeam?.name || 'Equipo') : (activeAgentForChat?.name || activeAgentForChat?.id || 'Selecciona un agente')}
                </div>
                <button onClick={() => setMessages([])} style={{ background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer' }}>Limpiar</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    {(m.role === 'agent' || m.role === 'swarm') && m.agentId && (
                      <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px', marginLeft: '4px' }}>{m.agentId} {m.role === 'swarm' && '🌀'}</div>
                    )}
                    <div style={{ padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: m.role === 'user' ? '#0d0d1a' : m.role === 'swarm' ? '#14081e' : m.role === 'system' ? '#111' : '#060d06', border: m.role === 'user' ? '1px solid #1a1a2e' : m.role === 'swarm' ? '1px solid #2a1040' : m.role === 'system' ? '1px solid #222' : '1px solid #0d200d', color: m.role === 'user' ? '#fff' : m.role === 'swarm' ? '#c090ff' : m.role === 'system' ? '#888' : '#9BC89F', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div style={{ alignSelf: 'flex-start', fontSize: '12px', color: '#666' }}>•••</div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid #0d0d0d' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea value={inputMsg} onChange={e => setInputMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }} placeholder="Escribe un mensaje..." style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: '#0a0a0a', border: '1px solid #161616', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', height: '48px' }} />
                  <button onClick={handleChatSend} disabled={isLoading || !inputMsg.trim()} style={{ padding: '0 16px', borderRadius: '12px', backgroundColor: interactMode === 'team' ? '#140a1e' : '#0a1a0a', border: 'none', color: interactMode === 'team' ? '#b060ff' : '#7EC87E', cursor: 'pointer' }}><PaperPlaneTilt size={20} /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
