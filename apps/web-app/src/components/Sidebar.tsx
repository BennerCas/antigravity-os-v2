import { NavLink } from 'react-router-dom';
import { Compass, Robot,  Hammer, LockKey, Code, Network, TreeStructure } from '@phosphor-icons/react';
import { EngineIndicator } from './EngineIndicator';

export function Sidebar() {
  const navItems = [
    { path: '/atlas', label: 'Atlas', icon: <Compass size={24} weight="light" /> },
    { path: '/agents', label: 'Agentes', icon: <Robot size={24} weight="light" /> },
    { path: '/flows', label: 'Nexus', icon: <Network size={24} weight="light" /> },
    { path: '/builder', label: 'Builder', icon: <Hammer size={24} weight="light" /> },
    { path: '/vault', label: 'Vault', icon: <LockKey size={24} weight="light" /> },
    { path: '/coding', label: 'Coding', icon: <Code size={24} weight="light" /> },
    { path: '/architecture', label: 'Arquitectura', icon: <TreeStructure size={24} weight="light" /> },
    { path: '/automations', label: 'Automatización', icon: <Code size={24} weight="light" /> },
  ];

  return (
    <aside className="sidebar-container flex h-screen w-64 flex-col bg-[var(--surface-canvas)] border-r border-[var(--stroke-subtle)]">
      <div className="flex items-center h-16 px-6 border-b border-[var(--stroke-subtle)]">
        <h1 className="text-[var(--text-primary)] text-xl font-bold tracking-wide">Antigravity OS</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-full transition-colors font-bold uppercase tracking-wide text-[11px] ${
                isActive
                  ? 'bg-red-500/5 text-white border border-red-500'
                  : 'text-[#9ca3af] hover:text-white border border-transparent'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-[var(--stroke-subtle)] bg-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-transparent border border-red-500"></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)]">Agent 1</p>
            <p className="text-xs font-medium text-[var(--text-secondary)]">UI Architect</p>
          </div>
          <EngineIndicator />
        </div>
      </div>
    </aside>
  );
}
