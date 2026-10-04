import { NavLink } from 'react-router-dom';
import { Brain, Code, TreeStructure, SpeakerHigh, PlayCircle, PauseCircle, StopCircle, FastForward, Rewind, GraduationCap, UserSwitch, Gear } from '@phosphor-icons/react';
import { useTTSStore } from '../lib/ttsStore';
import { useEffect } from 'react';
import PomodoroTimer from './PomodoroTimer';

export function Sidebar() {
  const { 
    isActive, isPaused, currentSection, volume, speed, 
    voices, selectedVoiceURI, setVoice,
    pause, resume, stop, setVolume, setSpeed, initVoices 
  } = useTTSStore();

  useEffect(() => {
    initVoices();
  }, [initVoices]);

  const navItems = [
    { path: '/agent-os',      label: 'AgentOS',        icon: <Brain         size={20} weight="light" /> },
    { path: '/academy',       label: 'Academy',        icon: <GraduationCap size={20} weight="light" /> },
    { path: '/architecture',  label: 'Arquitectura',   icon: <TreeStructure size={20} weight="light" /> },
    { path: '/automations',   label: 'Automatización', icon: <Code          size={20} weight="light" /> },
    { path: '/setup',         label: 'Setup',          icon: <Gear            size={20} weight="light" /> },
  ];

  return (
    <aside
      className="sidebar-container flex h-screen w-60 flex-col"
      style={{ backgroundColor: 'var(--surface-canvas)', borderRight: '1px solid var(--stroke-subtle)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center h-16 px-6"
        style={{ borderBottom: '1px solid var(--stroke-subtle)' }}
      >
        <h1 style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 700, letterSpacing: '0.02em', margin: 0 }}>
          Antigravity OS
        </h1>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
        {/* Nav */}
        <nav className="px-3 py-5 shrink-0" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 text-xs font-bold uppercase tracking-widest shrink-0 hover:opacity-90 ${
                  isActive ? 'nav-item-active' : 'nav-item-inactive'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--surface-card)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--theme-border)' : 'transparent'}`,
                borderRadius: '9999px',
                color: isActive ? 'var(--theme-border)' : 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: isActive ? '0 0 10px var(--theme-border)' : 'none',
              })}
            >
              <div className="shrink-0">{item.icon}</div>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em' }} className="truncate">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Spacing to push tools to the bottom if space permits */}
        <div className="flex-1 min-h-[20px]"></div>

        {/* TTS Global Player (Always visible) */}
        <div className="mx-3 mb-4 p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--theme-border)]/50 shrink-0">
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SpeakerHigh size={16} weight="duotone" className={`text-[var(--theme-border)] ${isActive && !isPaused ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold text-[var(--theme-border)] uppercase tracking-wider truncate">
                  AureliOS TTS
                </span>
              </div>
              {isActive && !isPaused && (
                <div className="flex gap-0.5 items-end h-3">
                  <div className="w-0.5 bg-[var(--theme-border)] animate-[pulse_1s_ease-in-out_infinite] h-full" />
                  <div className="w-0.5 bg-[var(--theme-border)] animate-[pulse_1.2s_ease-in-out_infinite_0.1s] h-2/3" />
                  <div className="w-0.5 bg-[var(--theme-border)] animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-full" />
                </div>
              )}
            </div>
            
            <div className="bg-[var(--surface-canvas)]/50 rounded p-1.5 border border-[var(--stroke-subtle)] flex items-center justify-between overflow-hidden">
              <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase whitespace-nowrap">Origen:</span>
              <span className={`text-[10px] font-bold truncate pl-2 ${isActive || isPaused ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-50'}`}>
                {isActive || isPaused ? (currentSection || 'General') : 'Inactivo'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            <select
              className="bg-[var(--surface-canvas)] border border-[var(--stroke-subtle)] rounded text-[10px] p-1.5 focus:outline-none focus:border-[var(--theme-border)] text-[var(--text-secondary)] w-full"
              value={selectedVoiceURI || ''}
              onChange={(e) => setVoice(e.target.value)}
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
              {voices.length === 0 && <option>Cargando voces...</option>}
            </select>
          </div>

          <div className="flex items-center justify-between mt-3 text-[var(--text-secondary)]">
            <button 
              onClick={() => {
                const s = speed - 0.25;
                setSpeed(s < 0.5 ? 0.5 : s);
              }} 
              className="p-1 hover:text-[var(--text-primary)] transition-colors disabled:opacity-30" 
              title="Más lento"
            >
              <Rewind size={18} weight="fill" />
            </button>

            {isPaused || (!isActive && !isPaused) ? (
              <button 
                onClick={resume} 
                className="p-1 hover:text-[var(--text-primary)] transition-colors disabled:opacity-30" 
                title="Reanudar"
                disabled={!isActive && !isPaused && !currentSection}
              >
                <PlayCircle size={24} weight="fill" className={isActive || isPaused ? "text-[var(--theme-border)]" : ""} />
              </button>
            ) : (
              <button onClick={pause} className="p-1 hover:text-[var(--text-primary)] transition-colors" title="Pausar">
                <PauseCircle size={24} weight="fill" className="text-[var(--theme-border)]" />
              </button>
            )}

            <button 
              onClick={stop} 
              className="p-1 hover:text-[var(--theme-border)] transition-colors disabled:opacity-30" 
              title="Detener"
              disabled={!isActive && !isPaused}
            >
              <StopCircle size={24} weight="fill" />
            </button>

            <button 
              onClick={() => {
                const s = speed + 0.25;
                setSpeed(s > 2.5 ? 2.5 : s);
              }} 
              className="p-1 hover:text-[var(--text-primary)] transition-colors disabled:opacity-30" 
              title="Más rápido"
            >
              <FastForward size={18} weight="fill" />
            </button>
          </div>
          
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-[var(--theme-border)]/30">
            <span className="text-[9px] font-mono text-[var(--text-secondary)]">VOL</span>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-[var(--surface-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-border)]"
            />
            <span className="text-[9px] font-mono text-[var(--text-secondary)]">VEL {speed}x</span>
          </div>
        </div>

        {/* Pomodoro */}
        <div className="flex flex-col items-center px-4 w-full gap-4 mb-4 shrink-0">
          <PomodoroTimer />
        </div>
      </div>

      {/* User footer */}
      <div
        className="p-5 w-full shrink-0"
        style={{ borderTop: '1px solid var(--stroke-subtle)' }}
      >
        <div className="flex flex-col justify-center w-full">
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textAlign: 'center' }}>HUMAN AI SYNERGY</p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '4px', textAlign: 'center' }}>BY BENNER CASTILLO</p>
        </div>
      </div>
    </aside>
  );
}
