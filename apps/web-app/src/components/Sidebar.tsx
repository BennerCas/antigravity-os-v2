import { NavLink } from 'react-router-dom';
import { Compass, Robot, Hammer, LockKey, Code, Network, TreeStructure } from '@phosphor-icons/react';
import { EngineIndicator } from './EngineIndicator';

export function Sidebar() {
  const navItems = [
    { path: '/atlas',         label: 'Atlas',          icon: <Compass       size={20} weight="light" /> },
    { path: '/agents',        label: 'Agentes',        icon: <Robot         size={20} weight="light" /> },
    { path: '/flows',         label: 'Nexus',          icon: <Network       size={20} weight="light" /> },
    { path: '/builder',       label: 'Builder',        icon: <Hammer        size={20} weight="light" /> },
    { path: '/vault',         label: 'Vault',          icon: <LockKey       size={20} weight="light" /> },
    { path: '/coding',        label: 'Coding',         icon: <Code          size={20} weight="light" /> },
    { path: '/architecture',  label: 'Arquitectura',   icon: <TreeStructure size={20} weight="light" /> },
    { path: '/automations',   label: 'Automatización', icon: <Code          size={20} weight="light" /> },
  ];

  return (
    <aside
      className="sidebar-container flex h-screen w-60 flex-col"
      style={{ backgroundColor: '#000000', borderRight: '1px solid #2A2A2A' }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-16 px-6"
        style={{ borderBottom: '1px solid #2A2A2A' }}
      >
        <h1 style={{ color: '#FFFFFF', fontSize: '17px', fontWeight: 700, letterSpacing: '0.02em', margin: 0 }}>
          Antigravity OS
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-full transition-colors text-xs font-bold uppercase tracking-widest ${
                isActive ? 'nav-item-active' : 'nav-item-inactive'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#151515' : 'transparent',
              border: `1px solid ${isActive ? '#2A2A2A' : 'transparent'}`,
              borderRadius: '9999px',
              color: isActive ? '#FFFFFF' : '#8A8A8A',
              textDecoration: 'none',
            })}
          >
            {item.icon}
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="p-5"
        style={{ borderTop: '1px solid #2A2A2A' }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #2A2A2A',
              backgroundColor: '#151515',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Agent 1</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#8A8A8A' }}>UI Architect</p>
          </div>
          <EngineIndicator />
        </div>
      </div>
    </aside>
  );
}
