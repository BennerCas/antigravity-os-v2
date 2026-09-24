import os

path = r'c:\antigravityAS\Antigravity_OS_v2\apps\web-app\src\components\Sidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('setSpeed(s > 2 ? 2 : s);', 'setSpeed(s > 2.5 ? 2.5 : s);')

old_header = '''          <div className="flex items-center gap-2 mb-2">
            <SpeakerHigh size={16} weight="duotone" className="text-[var(--theme-border)]" />
            <span className="text-[10px] font-bold text-[var(--theme-border)] uppercase tracking-wider truncate">
              {isActive || isPaused ? (currentSection || 'Leyendo...') : 'AureliOS TTS'}
            </span>
          </div>'''

new_header = '''          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SpeakerHigh size={16} weight="duotone" className={	ext-[var(--theme-border)] } />
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
              <span className={	ext-[10px] font-bold truncate pl-2 }>
                {isActive || isPaused ? (currentSection || 'General') : 'Inactivo'}
              </span>
            </div>
          </div>'''

content = content.replace(old_header, new_header)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Sidebar.tsx")
