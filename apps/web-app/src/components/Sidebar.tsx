import { NavLink } from 'react-router-dom';
import { Compass, Robot,  Hammer, LockKey, Code, Network, TreeStructure } from '@phosphor-icons/react';
import { EngineIndicator } from './EngineIndicator';

export function Sidebar() {
  const navItems = [
    { path: '/atlas', label: 'Atlas', icon: <Compass size={24} weight="duotone" /> },
    { path: '/agents', label: 'Agentes', icon: <Robot size={24} weight="duotone" /> },
    { path: '/flows', label: 'Nexus', icon: <Network size={24} weight="duotone" /> },
    { path: '/builder', label: 'Builder', icon: <Hammer size={24} weight="duotone" /> },
    { path: '/vault', label: 'Vault', icon: <LockKey size={24} weight="duotone" /> },
    { path: '/coding', label: 'Coding', icon: <Code size={24} weight="duotone" /> },
    { path: '/architecture', label: 'Arquitectura', icon: <TreeStructure size={24} weight="duotone" /> },
    { path: '/automations', label: 'Automatización', icon: <Code size={24} weight="duotone" /> },
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
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-cyan)] shadow-[inset_0_0_0_1px_var(--accent-cyan)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-[var(--stroke-subtle)] bg-[var(--surface-card)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--accent-cyan)] to-[var(--accent-violet)] shadow-[0_0_10px_var(--accent-soft)]"></div>
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
