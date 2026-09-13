import { useState } from 'react';
import { API_URL } from '../lib/api';
import type { AgentItem, AtlasItem } from './AgentOSSelect';
import { PaperPlaneTilt, Trash, Plus, Play, UsersThree, Brain } from '@phosphor-icons/react';

export interface Team {
  id: string;
  name: string;
  agentIds: string[];
  kbTitle?: string;
  createdAt: string;
}

interface Props {
  agents: AgentItem[];
  atlasItems: AtlasItem[];
  teams: Team[];
  setTeams: (t: Team[]) => void;
  onActivateTeam: (team: Team) => void;
}

export default function AgentOSTeams({ agents, atlasItems, teams, setTeams, onActivateTeam }: Props) {
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  const [teamName, setTeamName] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [kbSearch, setKbSearch] = useState('');
  const [suggestedAgents, setSuggestedAgents] = useState<AgentItem[]>([]);
  const [suggestedKB, setSuggestedKB] = useState<AtlasItem[]>([]);
  const [teamAgents, setTeamAgents] = useState<AgentItem[]>([]);
  const [teamKB, setTeamKB] = useState<AtlasItem | null>(null);
  const [isSearchingAgents, setIsSearchingAgents] = useState(false);
  const [isSearchingKB, setIsSearchingKB] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState<{role:string, content:string}[]>([]);
  const [isAdvisorLoading, setIsAdvisorLoading] = useState(false);

  const startNewTeam = () => {
    setEditingTeam({ id: `team_${Date.now()}`, name: 'Nuevo Equipo', agentIds: [], createdAt: new Date().toISOString() });
    setTeamName('Nuevo Equipo');
    setTeamAgents([]);
    setTeamKB(null);
    setSuggestedAgents([]);
    setSuggestedKB([]);
  };

  const loadTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamAgents(agents.filter(a => team.agentIds.includes(a.id)));
    setTeamKB(atlasItems.find(k => k.title === team.kbTitle) || null);
    setSuggestedAgents([]);
    setSuggestedKB([]);
  };

  const deleteTeam = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTeams(teams.filter(t => t.id !== id));
    if (editingTeam?.id === id) setEditingTeam(null);
  };

  const saveTeam = () => {
    if (!editingTeam) return;
    const newTeam: Team = {
      ...editingTeam,
      name: teamName || 'Sin Nombre',
      agentIds: teamAgents.map(a => a.id),
      kbTitle: teamKB?.title
    };
    const exists = teams.some(t => t.id === newTeam.id);
    if (exists) {
      setTeams(teams.map(t => t.id === newTeam.id ? newTeam : t));
    } else {
      setTeams([newTeam, ...teams]);
    }
  };

  const searchAssist = async (query: string, context: 'agents'|'kb') => {
    if (!query.trim()) return;
    if (context === 'agents') setIsSearchingAgents(true);
    else setIsSearchingKB(true);

    try {
      const res = await fetch(`${API_URL}/agents/search-assist`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ query, context })
      });
      const data = await res.json();
      const text = data.response.toLowerCase();
      
      if (context === 'agents') {
        const found = agents.filter(a => text.includes((a.name||a.id).toLowerCase())).slice(0,6);
        setSuggestedAgents(found);
      } else {
        const found = atlasItems.filter(k => text.includes(k.title.toLowerCase())).slice(0,3);
        setSuggestedKB(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingAgents(false);
      setIsSearchingKB(false);
    }
  };

  const askAdvisor = async () => {
    if (!advisorInput.trim()) return;
    const newMsg = { role: 'user', content: advisorInput };
    setAdvisorMessages(p => [...p, newMsg]);
    setAdvisorInput('');
    setIsAdvisorLoading(true);

    try {
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          agent_id: 'agentos_team_advisor',
          message: newMsg.content,
          override_instructions: 'Eres un experto en crear equipos de agentes IA. Sugiere combinaciones óptimas de agentes para los objetivos del usuario. Responde de forma concisa.'
        })
      });
      const data = await res.json();
      setAdvisorMessages(p => [...p, { role: 'agent', content: data.response || 'Error de respuesta' }]);
    } catch {
      setAdvisorMessages(p => [...p, { role: 'agent', content: 'Advisor no disponible' }]);
    } finally {
      setIsAdvisorLoading(false);
    }
  };

  const optimizeTeam = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch(`${API_URL}/agents/chat`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          agent_id: 'agentos_team_advisor',
          message: `Analiza esta combinación de agentes: ${teamAgents.map(a=>a.name||a.id).join(', ')}. Base de conocimiento: ${teamKB?.title || 'Ninguna'}. ¿Cómo puedo optimizar este equipo?`,
          override_instructions: 'Eres un experto en optimizar equipos de IA. Analiza la combinación de agentes y sugiere mejoras o flujos de trabajo en 3 oraciones.'
        })
      });
      const data = await res.json();
      alert(`⚡ Optimización sugerida:\n\n${data.response}`);
    } catch {
      alert('Error al optimizar equipo');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex h-full bg-[#050505] text-[#E0E0E0] overflow-hidden">
      <div className="w-64 bg-[#080808] border-r border-[#111] flex flex-col">
        <div className="p-4 border-b border-[#111] flex items-center justify-between">
          <span className="font-bold text-[#7EC87E] flex items-center gap-2"><UsersThree size={18} /> Mis Equipos</span>
          <button onClick={startNewTeam} className="p-1.5 bg-[#0a1a0a] border border-[#1a4a1a] rounded text-[#7EC87E] hover:bg-[#112a11]">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {teams.length === 0 ? (
            <div className="text-center text-xs text-[#555] mt-10">No tienes equipos guardados. Crea uno para empezar.</div>
          ) : (
            teams.map(t => (
              <div key={t.id} onClick={() => loadTeam(t)} 
                className={`p-3 mb-2 rounded-lg cursor-pointer border transition-all ${editingTeam?.id === t.id ? 'bg-[#1a0a2e] border-[#3a1a5e]' : 'bg-[#090909] border-[#131313] hover:border-[#222]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[#c090ff] truncate pr-2">{t.name}</span>
                  <button onClick={(e) => deleteTeam(e, t.id)} className="text-[#555] hover:text-[#ff5555]"><Trash size={14} /></button>
                </div>
                <div className="text-xs text-[#666] mb-2">{t.agentIds.length} agentes • {t.kbTitle ? 'Con KB' : 'Sin KB'}</div>
                <button onClick={(e) => { e.stopPropagation(); onActivateTeam(t); }} 
                  className="w-full py-1 bg-[#1a0a2e] border border-[#3a1a5e] text-[#b060ff] text-xs font-bold rounded flex items-center justify-center gap-1 hover:bg-[#2a1040]">
                  <Play size={12} weight="fill" /> Activar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto p-6">
        {!editingTeam ? (
          <div className="flex flex-col items-center justify-center h-full">
            <UsersThree size={64} className="text-[#1a1a2e] mb-4" />
            <h2 className="text-xl font-bold mb-2">Constructor de Equipos Swarm</h2>
            <p className="text-[#666] text-sm mb-6 max-w-md text-center">Agrupa agentes especialistas y asígnales una base de conocimiento compartida para que resuelvan tareas complejas en cadena.</p>
            <button onClick={startNewTeam} className="px-6 py-3 bg-[#1a0a2e] text-[#b060ff] border border-[#3a1a5e] rounded-lg font-bold hover:bg-[#2a1040] transition-colors flex items-center gap-2">
              <Plus size={18} /> Crear mi primer equipo
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            <input 
              value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="Nombre del equipo..."
              className="w-full bg-transparent border-none text-2xl font-bold text-center mb-8 focus:outline-none focus:text-[#00D9FF] transition-colors"
            />
            <div className="mb-8 p-5 bg-[#080808] border border-[#111] rounded-xl">
              <h3 className="text-sm font-bold text-[#7EC87E] mb-3 flex items-center gap-2"><Brain size={16} /> Especialistas del Equipo</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  value={agentSearch} onChange={e => setAgentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchAssist(agentSearch, 'agents')}
                  placeholder="¿Qué necesita hacer este equipo?"
                  className="flex-1 bg-[#050505] border border-[#1a1a1a] rounded-lg px-4 py-2 text-sm text-[#ccc] focus:outline-none focus:border-[#7EC87E]"
                />
                <button onClick={() => searchAssist(agentSearch, 'agents')} className="px-4 bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E] rounded-lg font-bold text-sm">
                  {isSearchingAgents ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {suggestedAgents.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {suggestedAgents.map(a => {
                    const selected = teamAgents.some(ta => ta.id === a.id);
                    return (
                      <div key={a.id} onClick={() => {
                        if (selected) setTeamAgents(teamAgents.filter(ta => ta.id !== a.id));
                        else setTeamAgents([...teamAgents, a]);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selected ? 'bg-[#0a1a0a] border-[#1a4a1a]' : 'bg-[#090909] border-[#131313]'}`}>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${selected ? 'text-[#7EC87E]' : 'text-[#ccc]'}`}>{a.name || a.id}</span>
                          <span className="text-[10px] text-[#555]">{a.category}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'bg-[#7EC87E] border-[#7EC87E]' : 'border-[#333]'}`}>
                          {selected && <div className="w-2 h-2 bg-[#050505] rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {teamAgents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#111]">
                  {teamAgents.map(a => (
                    <div key={a.id} className="flex items-center gap-1 bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E] px-3 py-1 rounded-full text-xs">
                      {a.name || a.id}
                      <button onClick={() => setTeamAgents(teamAgents.filter(ta => ta.id !== a.id))} className="ml-1 hover:text-[#fff]"><Trash size={12}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-8 p-5 bg-[#080808] border border-[#111] rounded-xl">
              <h3 className="text-sm font-bold text-[#8080ff] mb-3 flex items-center gap-2"><Brain size={16} /> Conocimiento Compartido</h3>
              <div className="flex gap-2 mb-4">
                <input 
                  value={kbSearch} onChange={e => setKbSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchAssist(kbSearch, 'kb')}
                  placeholder="¿Sobre qué tema debe basarse el equipo?"
                  className="flex-1 bg-[#050505] border border-[#1a1a1a] rounded-lg px-4 py-2 text-sm text-[#ccc] focus:outline-none focus:border-[#8080ff]"
                />
                <button onClick={() => searchAssist(kbSearch, 'kb')} className="px-4 bg-[#0a0a1a] border border-[#1a1a4a] text-[#8080ff] rounded-lg font-bold text-sm">
                  {isSearchingKB ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {suggestedKB.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {suggestedKB.map(k => (
                    <div key={k.title} onClick={() => setTeamKB(teamKB?.title === k.title ? null : k)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${teamKB?.title === k.title ? 'bg-[#0a0a1a] border-[#1a1a4a]' : 'bg-[#090909] border-[#131313]'}`}>
                      <span className={`text-sm font-bold ${teamKB?.title === k.title ? 'text-[#8080ff]' : 'text-[#ccc]'}`}>{k.title}</span>
                      <div className={`w-4 h-4 rounded-full border ${teamKB?.title === k.title ? 'bg-[#8080ff] border-[#8080ff]' : 'border-[#333]'}`} />
                    </div>
                  ))}
                </div>
              )}
              {teamKB && (
                <div className="mt-2 text-xs text-[#8080ff] font-bold">KB Asignado: {teamKB.title}</div>
              )}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={saveTeam} className="flex-1 py-3 bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E] rounded-lg font-bold hover:bg-[#112a11]">
                💾 Guardar Equipo
              </button>
              <button onClick={optimizeTeam} disabled={isOptimizing || teamAgents.length === 0} className="flex-1 py-3 bg-[#1a1a0a] border border-[#4a4a1a] text-[#c8c87e] rounded-lg font-bold hover:bg-[#2a2a11] disabled:opacity-50">
                {isOptimizing ? '⏳ Analizando...' : '⚡ Optimizar combinación'}
              </button>
              <button onClick={() => onActivateTeam(editingTeam)} className="flex-1 py-3 bg-[#1a0a2e] border border-[#3a1a5e] text-[#b060ff] rounded-lg font-bold hover:bg-[#2a1040]">
                ▶ Activar y Usar
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="w-72 bg-[#080808] border-l border-[#111] flex flex-col">
        <div className="p-4 border-b border-[#111]">
          <span className="font-bold text-[#00D9FF] flex items-center gap-2"><Brain size={18} /> Advisor IA</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="bg-[#050505] p-3 rounded-lg border border-[#111] text-xs text-[#ccc]">
            ¡Hola! Dime qué quieres lograr y te recomendaré qué agentes juntar en tu equipo.
          </div>
          {advisorMessages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg text-xs ${m.role === 'user' ? 'bg-[#0d0d1a] border border-[#1a1a2e] text-[#8080ff] self-end ml-4' : 'bg-[#050505] border border-[#111] text-[#ccc] mr-4'}`}>
              {m.content}
            </div>
          ))}
          {isAdvisorLoading && (
            <div className="bg-[#050505] p-3 rounded-lg border border-[#111] text-xs text-[#555] w-12 text-center">•••</div>
          )}
        </div>
        <div className="p-3 border-t border-[#111]">
          <div className="flex bg-[#050505] border border-[#1a1a1a] rounded-lg overflow-hidden focus-within:border-[#00D9FF]">
            <input 
              value={advisorInput} onChange={e => setAdvisorInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askAdvisor()}
              placeholder="Pregunta al advisor..."
              className="flex-1 bg-transparent border-none px-3 py-2 text-xs text-[#ccc] focus:outline-none"
            />
            <button onClick={askAdvisor} disabled={!advisorInput.trim() || isAdvisorLoading} className="px-3 text-[#00D9FF] hover:bg-[#111] disabled:opacity-50">
              <PaperPlaneTilt size={14} weight="fill" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
