import { useState, useEffect } from 'react';
import { Brain, Target, HardDrives, ChatCircle, Graph, MagnifyingGlass, Kanban } from '@phosphor-icons/react';
import AgentOSStudio from './AgentOSStudio';
import AgentOSInfinityBoard from './AgentOSInfinityBoard';
import AgentOSAgentland from './AgentOSAgentland';

import AgentOSInteract from './AgentOSInteract';
import AgentOSFlowboard from './AgentOSFlowboard';
import AgentOSInspector from './AgentOSInspector';
import type { AgentItem, AtlasItem } from './AgentOSSelect';
import type { Team } from './AgentOSTeams';

type View = 'studio' | 'infinityboard' | 'agentland' | 'interact' | 'flowboard' | 'inspector';

export default function AgentOS() {
  const [view, setView] = useState<View>(() => (localStorage.getItem('agentos_view') as View) || 'studio');
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgents] = useState<AgentItem[]>([]);
  const [assignedKB] = useState<AtlasItem | null>(null);
  const [teams] = useState<Team[]>([]);
  useEffect(() => {
    fetch((import.meta.env.BASE_URL || '/') + 'skills_v2.json')
      .then(r => r.json()).then(setAgents).catch(() => {});
    fetch((import.meta.env.BASE_URL || '/') + 'prompts_db.json')
      .then(r => r.json()).then((()=>{})).catch(() => {});
  }, []);

  useEffect(() => { localStorage.setItem('agentos_view', view); }, [view]);
  useEffect(() => { try { localStorage.setItem('agentos_selected_agents', JSON.stringify(selectedAgents)); } catch {} }, [selectedAgents]);
  useEffect(() => { try { localStorage.setItem('agentos_assigned_kb', assignedKB ? JSON.stringify(assignedKB) : 'null'); } catch {} }, [assignedKB]);
  useEffect(() => { try { localStorage.setItem('agentos_teams', JSON.stringify(teams)); } catch {} }, [teams]);

  return (
    <div className="flex flex-col h-full w-full bg-[#030303] text-[#E0E0E0] overflow-hidden font-sans">
      
      {/* HEADER GLOBAL */}
      <div className="flex items-center px-6 h-[52px] border-b border-[#111] bg-[#050505] shrink-0 gap-2">
        <Brain size={20} weight="duotone" className="text-[#00D9FF]" />
        <span className="text-[15px] font-bold text-white tracking-tight">AgentOS</span>
        <div className="flex-1" />
        
        {/* TAB NAVIGATION */}
        {[
          { id:'studio', label:'The AureliOS', icon:<Target size={15}/> },
          { id:'infinityboard', label:'InfinityBoard', icon:<Kanban size={15}/> },
          { id:'agentland', label:'Agentland', icon:<HardDrives size={15}/> },
          { id:'interact', label:'Interactuar', icon:<ChatCircle size={15}/> },
          { id:'flowboard', label:'Flowboard', icon:<Graph size={15}/> },
          { id:'inspector', label:'Inspector', icon:<MagnifyingGlass size={15}/> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id as View)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ${
              view === tab.id 
                ? 'bg-[#0a1a0a] border border-[#1a4a1a] text-[#7EC87E] font-bold' 
                : 'border border-transparent text-[#555] font-medium hover:text-[#888]'
            }`}>
            {tab.icon}
            {tab.label}
            {tab.id === 'studio' && selectedAgents.length > 0 && (
              <span className="text-[10px] bg-[#00D9FF] text-[#000] rounded-full px-1.5 font-extrabold ml-1">
                {selectedAgents.length}
              </span>
            )}
            {tab.id === 'agentland' && teams.length > 0 && (
              <span className="text-[10px] bg-[#b060ff] text-[#fff] rounded-full px-1.5 font-extrabold ml-1">
                {teams.length}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* SCREENS */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0" style={{ display: view === 'studio' ? 'block' : 'none' }}>
          <AgentOSStudio />
        </div>
        <div className="absolute inset-0" style={{ display: view === 'infinityboard' ? 'block' : 'none' }}>
          <AgentOSInfinityBoard />
        </div>
        <div className="absolute inset-0" style={{ display: view === 'agentland' ? 'block' : 'none' }}>
          <AgentOSAgentland />
        </div>
        <div className="absolute inset-0" style={{ display: view === 'interact' ? 'block' : 'none' }}>
          <AgentOSInteract
            selectedAgents={[]}
            assignedKB={null}
            teams={[]}
            agents={agents}
            onGoToSelect={() => setView('studio')}
            onGoToTeams={() => setView('agentland')}
          />
        </div>
        <div className="absolute inset-0" style={{ display: view === 'flowboard' ? 'block' : 'none' }}>
          <AgentOSFlowboard />
        </div>
        <div className="absolute inset-0" style={{ display: view === 'inspector' ? 'block' : 'none' }}>
          <AgentOSInspector />
        </div>
      </div>
    </div>
  );
}
