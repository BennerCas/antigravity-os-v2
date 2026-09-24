import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../lib/api';
import type { AgentItem, AtlasItem } from './AgentOSSelect';
import type { Team } from './AgentOSTeams';
import { PaperPlaneTilt, UsersThree, Robot, ArrowLeft, Trash } from '@phosphor-icons/react';

interface Props {
  selectedAgents: AgentItem[];
  assignedKB: AtlasItem | null;
  teams: Team[];
  agents: AgentItem[];
  onGoToSelect: () => void;
  onGoToTeams: () => void;
}

export default function AgentOSInteract({ selectedAgents, assignedKB, teams, agents, onGoToSelect, onGoToTeams }: Props) {
  const [mode, setMode] = useState<'agent'|'team'>(() => (localStorage.getItem('agentos_interact_mode') as 'agent'|'team') || 'agent');
  const [activeAgent, setActiveAgent] = useState<AgentItem|null>(null);
  const [activeTeamId, setActiveTeamId] = useState<string|null>(() => localStorage.getItem('agentos_active_team_id'));
  const [messages, setMessages] = useState<{role:'user'|'agent'|'swarm'; content:string; agentId?:string; agentName?:string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tools, setTools] = useState<{name:string; description:string}[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('agentos_interact_mode', mode);
  }, [mode]);

  useEffect(() => {
    fetch(`${API_URL}/agents/tools`)
      .then(r => r.json())
      .then(d => setTools(d.tools || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (activeAgent) {
      setMessages([{ role: 'agent', content: `Hola, soy ${activeAgent.name || activeAgent.id}. ¿En qué te puedo ayudar hoy?`, agentName: activeAgent.name }]);
    } else {
      setMessages([]);
    }
  }, [activeAgent]);

  useEffect(() => {
    if (mode === 'team' && activeTeamId) {
      const t = teams.find(t => t.id === activeTeamId);
      if (t) {
        setMessages([{ role: 'swarm', content: `Equipo ${t.name} activado. Escribe una tarea para que resolvamos en cadena.` }]);
      }
    }
  }, [mode, activeTeamId, teams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeTeam = teams.find(t => t.id === activeTeamId) || null;

  const handleSend = async () => {
    if (!inputMsg.trim() || isLoading) return;
    
    if (mode === 'agent' && !activeAgent) return;
    if (mode === 'team' && !activeTeam) return;

    const userMsg = inputMsg;
    setInputMsg('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      if (mode === 'agent' && activeAgent) {
        const res = await fetch(`${API_URL}/agents/chat`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            agent_id: activeAgent.id, 
            message: userMsg, 
            atlas_knowledge_id: assignedKB?.title,
            history: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [m.content] }))
          })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'agent', content: data.response || 'Error', agentName: activeAgent.name }]);
      } 
      else if (mode === 'team' && activeTeam) {
        const res = await fetch(`${API_URL}/agents/swarm`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ 
            agent_ids: activeTeam.agentIds, 
            message: userMsg 
          })
        });
        const data = await res.json();
        
        if (data.results && Array.isArray(data.results)) {
          data.results.forEach((r: any) => {
            const agentInfo = agents.find(a => a.id === r.agent);
            setMessages(prev => [...prev, { role: 'swarm', content: r.response, agentId: r.agent, agentName: agentInfo?.name || r.agent }]);
          });
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', content: 'Error al comunicar con el agente/equipo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--surface-canvas)] text-[var(--text-primary)] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-72 bg-[var(--surface-canvas)] border-r border-[#111] flex flex-col">
        <div className="p-3 border-b border-[#111] flex gap-2">
          <button onClick={() => setMode('agent')} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'agent' ? 'bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E]' : 'bg-[var(--surface-canvas)] border border-[#111] text-[var(--text-secondary)]'}`}>Individual</button>
          <button onClick={() => setMode('team')} className={`flex-1 py-1.5 text-xs font-bold rounded ${mode === 'team' ? 'bg-[#1a0a2e] border border-[#3a1a5e] text-[#b060ff]' : 'bg-[var(--surface-canvas)] border border-[#111] text-[var(--text-secondary)]'}`}>Equipo</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'agent' ? (
            <>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Tus Agentes Seleccionados</h3>
              {selectedAgents.length === 0 ? (
                <div className="text-center text-xs text-[var(--text-secondary)] mt-4">No has seleccionado agentes. <button onClick={onGoToSelect} className="text-[var(--theme-border)] hover:underline block mt-2">Ir a seleccionar</button></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedAgents.map(a => (
                    <div key={a.id} onClick={() => setActiveAgent(a)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${activeAgent?.id === a.id ? 'bg-[#0a1a0a] border-[#1a4a1a]' : 'bg-[var(--surface-canvas)] border-[#111] hover:border-[#222]'}`}>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${activeAgent?.id === a.id ? 'text-[#7EC87E]' : 'text-[#ccc]'}`}>{a.name || a.id}</span>
                        <span className="text-[10px] text-[var(--text-secondary)]">{a.category}</span>
                      </div>
                      {activeAgent?.id === a.id && <div className="w-2 h-2 rounded-full bg-[#7EC87E] animate-pulse" />}
                    </div>
                  ))}
                </div>
              )}
              {assignedKB && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Base de Conocimiento</h3>
                  <div className="p-2 bg-[#0a0a1a] border border-[#1a1a4a] text-[#8080ff] rounded text-xs font-bold truncate">{assignedKB.title}</div>
                </div>
              )}
              {tools.length > 0 && activeAgent && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Tools Habilitadas</h3>
                  <div className="flex flex-wrap gap-1">
                    {tools.map(t => <span key={t.name} className="px-2 py-1 bg-[#111] border border-[#222] rounded text-[10px] text-[var(--text-secondary)]">{t.name}</span>)}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Equipos Disponibles</h3>
              {teams.length === 0 ? (
                <div className="text-center text-xs text-[var(--text-secondary)] mt-4">No has creado equipos. <button onClick={onGoToTeams} className="text-[#b060ff] hover:underline block mt-2">Ir a crear equipo</button></div>
              ) : (
                <div className="flex flex-col gap-2">
                  <select 
                    value={activeTeamId || ''} 
                    onChange={e => { setActiveTeamId(e.target.value); localStorage.setItem('agentos_active_team_id', e.target.value); }}
                    className="w-full bg-[var(--surface-canvas)] border border-[#111] rounded p-2 text-sm text-[#ccc] outline-none focus:border-[#3a1a5e]"
                  >
                    <option value="" disabled>Selecciona un equipo</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  
                  {activeTeam && (
                    <div className="mt-4">
                      <div className="p-3 bg-[#1a0a2e] border border-[#3a1a5e] rounded-lg">
                        <span className="text-xs text-[#b060ff] font-bold block mb-2">Modo Swarm: ejecución en cadena</span>
                        <div className="flex flex-wrap gap-1">
                          {activeTeam.agentIds.map(id => {
                            const a = agents.find(x => x.id === id);
                            return <span key={id} className="px-2 py-1 bg-[var(--surface-canvas)] border border-[#2a1040] rounded text-[10px] text-[#ccc]">{a?.name || id}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-3 border-t border-[#111]">
          <button onClick={mode === 'agent' ? onGoToSelect : onGoToTeams} className="w-full flex items-center justify-center gap-2 py-2 bg-[var(--surface-canvas)] border border-[#111] rounded text-[var(--text-secondary)] text-xs font-bold hover:bg-[#111] hover:text-[#ccc]">
            <ArrowLeft size={14} /> Volver a {mode === 'agent' ? 'Seleccionar' : 'Equipos'}
          </button>
        </div>
      </div>

      {/* CHAT CONSOLE */}
      <div className="flex-1 flex flex-col bg-[var(--surface-canvas)]">
        {/* Header */}
        <div className="h-14 border-b border-[#111] flex items-center px-6 justify-between bg-[var(--surface-canvas)]">
          <div className="flex items-center gap-3">
            {mode === 'agent' && activeAgent ? (
              <><Robot size={24} className="text-[#7EC87E]" /><span className="font-bold text-[var(--text-primary)]">{activeAgent.name || activeAgent.id}</span><span className="px-2 py-0.5 bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E] text-[10px] rounded uppercase font-bold tracking-wider">Individual</span></>
            ) : mode === 'team' && activeTeam ? (
              <><UsersThree size={24} className="text-[#b060ff]" /><span className="font-bold text-[var(--text-primary)]">{activeTeam.name}</span><span className="px-2 py-0.5 bg-[#1a0a2e] border border-[#3a1a5e] text-[#b060ff] text-[10px] rounded uppercase font-bold tracking-wider">Equipo Swarm</span></>
            ) : (
              <span className="text-[var(--text-secondary)] font-bold">Consola</span>
            )}
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 text-xs">
              <Trash size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {!activeAgent && mode === 'agent' && (
            <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] flex-col gap-2">
              <ArrowLeft size={24} />
              <p>Selecciona un agente desde el panel izquierdo</p>
            </div>
          )}
          {!activeTeam && mode === 'team' && (
            <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] flex-col gap-2">
              <ArrowLeft size={24} />
              <p>Selecciona un equipo desde el panel izquierdo</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user' ? 'bg-[#0d0d1a] border border-[#1a1a2e] text-[#ccc] rounded-br-none' :
                m.role === 'swarm' ? 'bg-[#14081e] border border-[#2a1040] text-[#d0a0ff] rounded-bl-none' :
                'bg-[#060d06] border border-[#0d200d] text-[#9BC89F] rounded-bl-none'
              }`}>
                {(m.role === 'agent' || m.role === 'swarm') && m.agentName && (
                  <div className={`text-[10px] font-bold mb-2 uppercase tracking-wider ${m.role === 'swarm' ? 'text-[#a070ff]' : 'text-[#6a9a6a]'}`}>
                    {m.agentName}
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--surface-canvas)] border border-[#111] px-4 py-3 rounded-xl rounded-bl-none text-[var(--text-secondary)]">
                <span className="animate-pulse">•••</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#111] bg-[var(--surface-canvas)]">
          <div className={`flex bg-[var(--surface-canvas)] border rounded-xl overflow-hidden p-2 transition-colors focus-within:border-[#00D9FF] ${
            (mode === 'agent' && !activeAgent) || (mode === 'team' && !activeTeam) ? 'opacity-50 pointer-events-none border-[#111]' : 'border-[#1a1a1a]'
          }`}>
            <textarea
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={(mode === 'agent' && activeAgent) ? `Escribe a ${activeAgent.name || activeAgent.id}... (Shift+Enter para nueva línea)` : mode === 'team' && activeTeam ? `Envía una tarea al equipo ${activeTeam.name}...` : 'Deshabilitado'}
              className="flex-1 bg-transparent border-none px-3 py-2 text-sm text-[#ccc] focus:outline-none resize-none"
              rows={2}
            />
            <div className="flex items-end px-2">
              <button 
                onClick={handleSend} 
                disabled={isLoading || !inputMsg.trim()} 
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                  mode === 'team' 
                    ? 'bg-[#1a0a2e] text-[#b060ff] hover:bg-[#2a1040]' 
                    : 'bg-[#0a1a0a] text-[#7EC87E] hover:bg-[#112a11]'
                } disabled:opacity-50`}
              >
                {mode === 'team' ? <UsersThree size={20} weight="fill" /> : <PaperPlaneTilt size={20} weight="fill" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

