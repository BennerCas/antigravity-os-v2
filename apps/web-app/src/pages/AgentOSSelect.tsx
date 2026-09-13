import { useState } from 'react';
import { API_URL } from '../lib/api';
import { Sparkle, X, Lightning, ArrowRight, MagnifyingGlass, Brain, BookOpen } from '@phosphor-icons/react';

export interface AgentItem { id: string; name: string; category: string; description: string; instructions: string; risk?: string; }
export interface AtlasItem { id?: string; title: string; category: string; content: string; isMultiPrompt?: boolean; }

interface Props {
  agents: AgentItem[];
  atlasItems: AtlasItem[];
  selectedAgents: AgentItem[];
  setSelectedAgents: (a: AgentItem[]) => void;
  assignedKB: AtlasItem | null;
  setAssignedKB: (kb: AtlasItem | null) => void;
  onGoToInteract: () => void;
}

const catEmoji = (cat: string) => {
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

const parseAgentSuggestions = (aiResponse: string, agents: AgentItem[]): AgentItem[] => {
  const found: AgentItem[] = [];
  agents.forEach(a => {
    const name = (a.name || a.id).toLowerCase();
    if (aiResponse.toLowerCase().includes(name)) {
      found.push(a);
    }
  });
  return Array.from(new Set(found)).slice(0, 6);
};

const parseKBSuggestions = (aiResponse: string, atlasItems: AtlasItem[]): AtlasItem[] => {
  const found: AtlasItem[] = [];
  atlasItems.forEach(a => {
    const title = (a.title || '').toLowerCase();
    if (aiResponse.toLowerCase().includes(title)) {
      found.push(a);
    }
  });
  return Array.from(new Set(found)).slice(0, 3);
};

export default function AgentOSSelect({
  agents,
  atlasItems,
  selectedAgents,
  setSelectedAgents,
  assignedKB,
  setAssignedKB,
  onGoToInteract
}: Props) {
  const [agentQuery, setAgentQuery] = useState('');
  const [kbQuery, setKbQuery] = useState('');
  const [agentLoading, setAgentLoading] = useState(false);
  const [kbLoading, setKbLoading] = useState(false);
  
  const [agentAiResponse, setAgentAiResponse] = useState('');
  const [kbAiResponse, setKbAiResponse] = useState('');
  
  const [suggestedAgents, setSuggestedAgents] = useState<AgentItem[]>([]);
  const [suggestedKbs, setSuggestedKbs] = useState<AtlasItem[]>([]);

  const searchAgents = async (query: string) => {
    if (!query) return;
    setAgentLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/search-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: 'agents' })
      });
      const data = await res.json();
      const text = data.text || '';
      setAgentAiResponse(text);
      setSuggestedAgents(parseAgentSuggestions(text, agents));
    } catch (err) {
      console.error(err);
      setAgentAiResponse('Error al buscar agentes.');
    } finally {
      setAgentLoading(false);
    }
  };

  const searchKBs = async (query: string) => {
    if (!query) return;
    setKbLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/search-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, context: 'kb' })
      });
      const data = await res.json();
      const text = data.text || '';
      setKbAiResponse(text);
      setSuggestedKbs(parseKBSuggestions(text, atlasItems));
    } catch (err) {
      console.error(err);
      setKbAiResponse('Error al buscar conocimientos.');
    } finally {
      setKbLoading(false);
    }
  };

  const optimizeAgent = async (agent: AgentItem) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id, instructions: agent.instructions })
      });
      const data = await res.json();
      alert(`Resultado: ${data.message || 'Optimizado con éxito'}`);
    } catch (err) {
      console.error(err);
      alert('Error al optimizar agente');
    }
  };

  const optimizeKb = async (kb: AtlasItem) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/agents/optimize-kb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kb_title: kb.title, content: kb.content })
      });
      const data = await res.json();
      alert(`Resultado: ${data.message || 'Mejorado con éxito'}`);
    } catch (err) {
      console.error(err);
      alert('Error al mejorar conocimiento');
    }
  };

  const toggleAgent = (agent: AgentItem) => {
    if (selectedAgents.find(a => a.id === agent.id)) {
      setSelectedAgents(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const agentChips = ['Marketing', 'Redacción', 'Análisis de datos', 'Código', 'Legal', 'Investigación'];
  const kbChips = ['Copywriting', 'SEO', 'FlowBoard', 'Marketing', 'Legal'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#050505', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', borderRight: '1px solid #1a1a1a', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Brain size={64} color="#00D9FF" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 600, margin: '0 0 0.5rem' }}>¿Qué tipo de agente necesitas?</h1>
            <p style={{ color: '#888', margin: 0 }}>Describe tu tarea y la IA encontrará el agente ideal</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              value={agentQuery}
              onChange={(e) => setAgentQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchAgents(agentQuery)}
              placeholder="Ej: Necesito un agente para analizar métricas de ventas..."
              style={{ flex: 1, padding: '1rem', backgroundColor: '#090909', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#00D9FF'}
              onBlur={(e) => e.target.style.borderColor = '#1a1a1a'}
            />
            <button 
              onClick={() => searchAgents(agentQuery)}
              disabled={agentLoading}
              style={{ padding: '0 1.5rem', backgroundColor: '#00D9FF', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {agentLoading ? <Sparkle className="animate-spin" /> : <MagnifyingGlass />} Buscar
            </button>
          </div>

          {!agentAiResponse && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {agentChips.map(chip => (
                <button 
                  key={chip}
                  onClick={() => { setAgentQuery(chip); searchAgents(chip); }}
                  style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', color: '#ccc', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#111'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0d0d0d'}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {agentAiResponse && (
            <div style={{ backgroundColor: '#0a1a0a', border: '1px solid #1a4a1a', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', color: '#7EC87E', fontSize: '0.9rem' }}>
              {agentAiResponse}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {suggestedAgents.map(agent => {
              const isSelected = !!selectedAgents.find(a => a.id === agent.id);
              return (
                <div key={agent.id} style={{ 
                  backgroundColor: isSelected ? '#0a1a0a' : '#090909', 
                  border: `1px solid ${isSelected ? '#1a4a1a' : '#131313'}`, 
                  borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>{catEmoji(agent.category)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</h3>
                      <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', backgroundColor: '#1a1a1a', borderRadius: '4px', color: '#888' }}>{agent.category}</span>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#999', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {agent.description || agent.instructions.substring(0, 80) + '...'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => toggleAgent(agent)}
                      style={{ flex: 1, padding: '0.5rem', backgroundColor: isSelected ? 'transparent' : '#111', color: isSelected ? '#7EC87E' : '#fff', border: isSelected ? '1px solid #7EC87E' : '1px solid #222', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                    >
                      {isSelected ? '✔ Seleccionado' : '✔ Seleccionar'}
                    </button>
                    <button 
                      onClick={() => optimizeAgent(agent)}
                      style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ffb347', border: '1px solid #4a331a', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Optimizar instrucciones"
                    >
                      <Lightning size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAgents.length > 0 && (
            <div style={{ marginTop: 'auto', borderTop: '1px solid #1a1a1a', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem' }}>Tus agentes seleccionados ({selectedAgents.length}):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedAgents.map(agent => (
                  <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#111', border: '1px solid #222', padding: '0.25rem 0.5rem', borderRadius: '16px', fontSize: '0.85rem' }}>
                    {agent.name}
                    <button onClick={() => toggleAgent(agent)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* COLUMNA DERECHA */}
        <div style={{ width: '25rem', backgroundColor: '#080808', display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <BookOpen size={48} color="#7EC87E" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>¿Qué conocimiento necesita?</h2>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              value={kbQuery}
              onChange={(e) => setKbQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchKBs(kbQuery)}
              placeholder="Buscar KB..."
              style={{ flex: 1, padding: '0.75rem', backgroundColor: '#090909', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#7EC87E'}
              onBlur={(e) => e.target.style.borderColor = '#1a1a1a'}
            />
            <button 
              onClick={() => searchKBs(kbQuery)}
              disabled={kbLoading}
              style={{ padding: '0 1rem', backgroundColor: '#222', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {kbLoading ? <Sparkle className="animate-spin" /> : <MagnifyingGlass />}
            </button>
          </div>

          {!kbAiResponse && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center', marginBottom: '1rem' }}>
              {kbChips.map(chip => (
                <button 
                  key={chip}
                  onClick={() => { setKbQuery(chip); searchKBs(chip); }}
                  style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', color: '#999', padding: '0.25rem 0.75rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {kbAiResponse && (
            <div style={{ backgroundColor: '#0a1a0a', border: '1px solid #1a4a1a', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', color: '#7EC87E', fontSize: '0.8rem' }}>
              {kbAiResponse}
            </div>
          )}
          
          {assignedKB && (
             <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div>
                 <div style={{ fontSize: '0.75rem', color: '#7EC87E' }}>KB Asignado</div>
                 <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{assignedKB.title}</div>
               </div>
               <button onClick={() => setAssignedKB(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}><X size={16}/></button>
             </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestedKbs.map(kb => {
              const isAssigned = assignedKB?.title === kb.title;
              return (
                <div key={kb.id || kb.title} style={{ 
                  backgroundColor: '#090909', 
                  border: `1px solid ${isAssigned ? '#7EC87E' : '#131313'}`, 
                  borderRadius: '8px', padding: '1rem' 
                }}>
                  <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>{kb.title}</h4>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', backgroundColor: '#1a1a1a', borderRadius: '4px', color: '#888' }}>{kb.category}</span>
                  <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.8rem', color: '#888', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {kb.content.substring(0, 80)}...
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setAssignedKB(isAssigned ? null : kb)}
                      style={{ flex: 1, padding: '0.4rem', backgroundColor: isAssigned ? 'transparent' : '#111', color: isAssigned ? '#7EC87E' : '#fff', border: isAssigned ? '1px solid #7EC87E' : '1px solid #222', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      {isAssigned ? 'Asignado' : 'Asignar'}
                    </button>
                    <button 
                      onClick={() => optimizeKb(kb)}
                      style={{ padding: '0.4rem', backgroundColor: 'transparent', color: '#ffb347', border: '1px solid #4a331a', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Mejorar conocimiento"
                    >
                      <Lightning size={14} /> Mejorar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ padding: '1rem 2rem', backgroundColor: '#000', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '2rem', color: '#888', fontSize: '0.9rem' }}>
          <div>Agentes: <span style={{ color: '#fff', fontWeight: 600 }}>{selectedAgents.length}</span></div>
          <div>KB: <span style={{ color: '#fff', fontWeight: 600 }}>{assignedKB ? assignedKB.title : 'Ninguno'}</span></div>
        </div>
        <button 
          onClick={onGoToInteract}
          disabled={selectedAgents.length === 0}
          style={{ padding: '0.75rem 2rem', backgroundColor: selectedAgents.length > 0 ? '#00D9FF' : '#222', color: selectedAgents.length > 0 ? '#000' : '#888', border: 'none', borderRadius: '30px', cursor: selectedAgents.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Ir a Interactuar <ArrowRight weight="bold" />
        </button>
      </div>

    </div>
  );
}
