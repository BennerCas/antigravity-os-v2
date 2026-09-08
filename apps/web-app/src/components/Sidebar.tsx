import { NavLink } from 'react-router-dom';
import { Compass, Robot, Hammer, LockKey, Code, Network, TreeStructure, SpeakerHigh, PlayCircle, PauseCircle, StopCircle, FastForward, Rewind, GraduationCap } from '@phosphor-icons/react';
import { EngineIndicator } from './EngineIndicator';
import { useTTSStore } from '../lib/ttsStore';
import { useEffect } from 'react';

export function Sidebar() {
  const { 
    isActive, isPaused, currentSection, volume, speed, 
    pause, resume, stop, setVolume, setSpeed, initVoices 
  } = useTTSStore();

  useEffect(() => {
    initVoices();
  }, [initVoices]);

  const navItems = [
    { path: '/atlas',         label: 'Atlas',          icon: <Compass       size={20} weight="light" /> },
    { path: '/agents',        label: 'Agentes',        icon: <Robot         size={20} weight="light" /> },
    { path: '/flows',         label: 'Nexus',          icon: <Network       size={20} weight="light" /> },
    { path: '/builder',       label: 'Builder',        icon: <Hammer        size={20} weight="light" /> },
    { path: '/academy',       label: 'Academy',        icon: <GraduationCap size={20} weight="light" /> },
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
      <nav className="flex-1 px-3 py-5 overflow-y-auto" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
              backgroundColor: isActive ? '#0A1C0D' : 'transparent',
              border: `1px solid ${isActive ? '#174A1F' : 'transparent'}`,
              borderRadius: '9999px',
              color: isActive ? '#7B9C7F' : '#8A8A8A',
              textDecoration: 'none',
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            })}
          >
            {item.icon}
            <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* TTS Global Player */}
      {(isActive || isPaused) && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-[#0A1C0D] border border-[#174A1F] animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <SpeakerHigh size={16} weight="duotone" className="text-[#7B9C7F]" />
            <span className="text-[10px] font-bold text-[#7B9C7F] uppercase tracking-wider truncate">
              {currentSection || 'Leyendo...'}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-[#A0C0A8]">
            <button 
              onClick={() => {
                const s = speed - 0.25;
                setSpeed(s < 0.5 ? 0.5 : s);
              }} 
              className="p-1 hover:text-white transition-colors" title="Más lento"
            >
              <Rewind size={18} weight="fill" />
            </button>

            {isPaused ? (
              <button onClick={resume} className="p-1 hover:text-white transition-colors" title="Reanudar">
                <PlayCircle size={24} weight="fill" className="text-[#7B9C7F]" />
              </button>
            ) : (
              <button onClick={pause} className="p-1 hover:text-white transition-colors" title="Pausar">
                <PauseCircle size={24} weight="fill" className="text-[#7B9C7F]" />
              </button>
            )}

            <button onClick={stop} className="p-1 hover:text-[#FF6B6B] transition-colors" title="Detener">
              <StopCircle size={24} weight="fill" />
            </button>

            <button 
              onClick={() => {
                const s = speed + 0.25;
                setSpeed(s > 2 ? 2 : s);
              }} 
              className="p-1 hover:text-white transition-colors" title="Más rápido"
            >
              <FastForward size={18} weight="fill" />
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[#174A1F]/50">
            <span className="text-[9px] font-mono text-[#666]">VOL</span>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#7B9C7F]"
            />
            <span className="text-[9px] font-mono text-[#666]">VEL {speed}x</span>
          </div>
        </div>
      )}

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
