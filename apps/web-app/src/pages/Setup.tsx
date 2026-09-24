import React, { useState, useEffect } from 'react';
import { THEME_STYLES, applyThemeToDocument, getContrastYIQ, getContrastRatio } from '../lib/themes';

const hexToRgb = (hex: string) => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  return [parseInt(c.substr(0,2), 16), parseInt(c.substr(2,2), 16), parseInt(c.substr(4,2), 16)];
};

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r,g,b].map(x => {
    const hex = Math.round(Math.min(255, Math.max(0, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export default function Setup() {
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('builderTheme') || 'Deep Space');
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('selectedThemes') || '[]') } catch { return [] } });
  useEffect(() => { localStorage.setItem('selectedThemes', JSON.stringify(selectedThemes)); }, [selectedThemes]);
  
  const [customThemes, setCustomThemes] = useState<Record<string, React.CSSProperties>>(() => {
    try { return JSON.parse(localStorage.getItem('customThemes') || '{}'); } catch { return {}; }
  });

  const ALL_THEMES = { ...THEME_STYLES, ...customThemes };

  const handleThemeChange = (themeName: string) => {
    setCurrentTheme(themeName);
    localStorage.setItem('builderTheme', themeName);
    applyThemeToDocument(themeName);
  };

  const toggleSelection = (themeName: string) => {
    setSelectedThemes(prev => prev.includes(themeName) ? prev.filter(t => t !== themeName) : [...prev, themeName]);
  };

  const saveCustomThemes = (newThemes: Record<string, React.CSSProperties>) => {
    const updated = { ...customThemes, ...newThemes };
    setCustomThemes(updated);
    localStorage.setItem('customThemes', JSON.stringify(updated));
  };

  const handleQuantumUpgrade = () => {
    const targets = selectedThemes.length > 0 ? selectedThemes : Object.keys(ALL_THEMES);
    const newThemes: Record<string, React.CSSProperties> = {};
    
    targets.forEach(name => {
      const t = ALL_THEMES[name] as any;
      const rgbBg = hexToRgb(t['--theme-bg']);
      const rgbBorder = hexToRgb(t['--theme-border']);
      
      const newBg = rgbToHex(rgbBg[0]*0.5, rgbBg[1]*0.5, rgbBg[2]*0.5);
      const newBorder = rgbToHex(255 - rgbBorder[0], 255 - rgbBorder[1], 255 - rgbBorder[2]);
      
      newThemes[name + ' Quantum'] = {
        ...t,
        '--theme-bg': newBg,
        '--theme-card': rgbToHex(rgbBg[0]*0.6, rgbBg[1]*0.6, rgbBg[2]*0.6),
        '--theme-border': newBorder,
        '--theme-text': '#ffffff'
      } as React.CSSProperties;
    });
    
    saveCustomThemes(newThemes);
    setSelectedThemes([]);
  };

  const handleFusion = () => {
    if (selectedThemes.length < 2 || selectedThemes.length > 3) {
      alert("Selecciona 2 o 3 temas para fusionarlos.");
      return;
    }
    
    let sumBg = [0,0,0], sumCard = [0,0,0], sumBorder = [0,0,0];
    selectedThemes.forEach(name => {
      const t = ALL_THEMES[name] as any;
      const bg = hexToRgb(t['--theme-bg']);
      const card = hexToRgb(t['--theme-card']);
      const border = hexToRgb(t['--theme-border']);
      sumBg = [sumBg[0]+bg[0], sumBg[1]+bg[1], sumBg[2]+bg[2]];
      sumCard = [sumCard[0]+card[0], sumCard[1]+card[1], sumCard[2]+card[2]];
      sumBorder = [sumBorder[0]+border[0], sumBorder[1]+border[1], sumBorder[2]+border[2]];
    });
    
    const count = selectedThemes.length;
    const newName = "Fusion " + selectedThemes.map(s => s.split(' ')[0]).join('-');
    
    const newThemes: Record<string, React.CSSProperties> = {
      [newName]: {
        '--theme-bg': rgbToHex(sumBg[0]/count, sumBg[1]/count, sumBg[2]/count),
        '--theme-card': rgbToHex(sumCard[0]/count, sumCard[1]/count, sumCard[2]/count),
        '--theme-border': rgbToHex(sumBorder[0]/count, sumBorder[1]/count, sumBorder[2]/count),
        '--theme-bar': 'rgba(10,10,10,0.8)',
        '--theme-text': '#ffffff'
      } as React.CSSProperties
    };
    
    saveCustomThemes(newThemes);
    setSelectedThemes([]);
  };

  const handleGenerate = () => {
    const randHex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    const randDark = () => rgbToHex(Math.random()*40, Math.random()*40, Math.random()*40);
    const id = Math.floor(Math.random()*1000);
    
    const newThemes: Record<string, React.CSSProperties> = {
      ['Nexus ' + id]: {
        '--theme-bg': randDark(),
        '--theme-card': randDark(),
        '--theme-border': randHex(),
        '--theme-bar': 'rgba(0,0,0,0.8)',
        '--theme-text': '#ffffff'
      } as React.CSSProperties
    };
    saveCustomThemes(newThemes);
  };

  return (
    <div className="w-full h-full p-6 flex flex-col gap-4 bg-[var(--surface-canvas)] relative">
      <header className="flex justify-between items-end border-b border-[var(--stroke-subtle)] pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Setup</h1>
          <p className="text-xs text-[var(--text-secondary)]">Elige, selecciona y evoluciona tus temas.</p>
        </div>
        <div className="flex gap-2">
          <button id="btn-generate" onClick={handleGenerate} className="px-3 py-1.5 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors text-xs font-bold flex items-center gap-1">
            ✨ Generar
          </button>
          <button id="btn-fuse" onClick={handleFusion} className="px-3 py-1.5 rounded-lg border border-[var(--stroke-subtle)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors text-xs font-bold flex items-center gap-1">
            🧬 Fusionar (2-3)
          </button>
          <button id="btn-quantum" onClick={handleQuantumUpgrade} className="px-3 py-1.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-border)] text-black hover:opacity-80 transition-colors text-xs font-bold shadow-[0_0_15px_var(--theme-border)] flex items-center gap-1">
            🌌 Motor Cuántico
          </button>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pr-2 pb-10">
        <div className="grid grid-cols-7 gap-3 p-2" id="themes-grid">
          {Object.keys(ALL_THEMES).map((themeName) => {
            const isActive = currentTheme === themeName;
            const isSelected = selectedThemes.includes(themeName);
            const themeVars = ALL_THEMES[themeName] as any;
            const bg = themeVars['--theme-bg'];
            const border = themeVars['--theme-border'];
            const baseText = themeVars['--theme-text'] || '#ffffff';
            const textOnBg = getContrastRatio(baseText, bg) >= 3.0 ? baseText : getContrastYIQ(bg);

            return (
              <div
                key={themeName}
                onMouseEnter={() => setHoveredTheme(themeName)}
                onMouseLeave={() => setHoveredTheme(null)}
                onClick={() => toggleSelection(themeName)}
                className="relative flex flex-col items-center justify-between p-2 rounded-xl transition-all duration-200 shadow-sm hover:shadow-xl group h-24 theme-card cursor-pointer"
                data-theme-name={themeName}
                style={{ 
                  background: bg,
                  borderColor: isActive || isSelected ? border : border + '40',
                  borderWidth: isActive || isSelected ? '2px' : '1px',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? `0 0 10px ${border}80` : 'none',
                  zIndex: isActive || isSelected ? 10 : 1
                }}
              >
                {/* Cabecera de Card: Checkbox + ACTIVO */}
                <div className="w-full flex justify-between items-start">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 cursor-pointer accent-[var(--theme-border)] theme-checkbox pointer-events-none"
                    />
                  </label>
                  {isActive && (
                    <div className="text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md" style={{ background: border, color: getContrastYIQ(border) }}>
                      ACTIVO
                    </div>
                  )}
                </div>

                <span className="font-bold text-[12px] text-center w-full truncate px-1 my-1" style={{ color: textOnBg }}>
                  {themeName}
                </span>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleThemeChange(themeName); }}
                  className="theme-activate-btn w-full text-[10px] px-2 py-1 rounded border hover:opacity-80 transition-all font-bold"
                  style={{ borderColor: border, color: textOnBg, background: 'rgba(0,0,0,0.3)' }}
                >
                  Activar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {hoveredTheme && ALL_THEMES[hoveredTheme] && (() => {
        const hTheme = ALL_THEMES[hoveredTheme] as any;
        const hBg = hTheme['--theme-bg'];
        const hCard = hTheme['--theme-card'];
        const hBorder = hTheme['--theme-border'];
        const hBaseText = hTheme['--theme-text'] || '#ffffff';
        
        const hTextOnBg = getContrastRatio(hBaseText, hBg) >= 3.0 ? hBaseText : getContrastYIQ(hBg);
        const hTextOnCard = getContrastRatio(hBaseText, hCard) >= 3.0 ? hBaseText : getContrastYIQ(hCard);

        return (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="w-[500px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-2" style={{ 
              borderColor: hBorder,
              background: hBg 
            }}>
              <div className="px-3 py-1.5 border-b flex justify-between items-center text-[10px] font-bold tracking-widest uppercase" style={{ 
                borderColor: hBorder,
                background: hCard,
                color: hTextOnCard
              }}>
                <span>Vista Previa</span>
                <span style={{ color: hBorder }}>{hoveredTheme}</span>
              </div>
              
              <div className="p-3 flex gap-3 h-32">
                <div className="flex-1 rounded-lg border flex flex-col overflow-hidden" style={{ borderColor: hBorder, background: hCard }}>
                  <div className="h-4 border-b flex items-center px-1.5 text-[7px] font-bold" style={{ borderColor: hBorder, color: hBorder }}>AgentOS</div>
                  <div className="p-1.5 grid grid-cols-2 gap-1">
                    <div className="h-5 rounded-sm border" style={{ borderColor: hBorder, background: hBg }}></div>
                    <div className="h-5 rounded-sm border" style={{ borderColor: hBorder, background: hBg }}></div>
                    <div className="col-span-2 h-8 rounded-sm border" style={{ borderColor: hBorder, background: hBg }}></div>
                  </div>
                </div>

                <div className="flex-1 rounded-lg border flex flex-col overflow-hidden relative" style={{ borderColor: hBorder, background: hBg }}>
                  <div className="h-4 border-b flex items-center px-1.5 text-[7px] font-bold absolute top-0 w-full z-10" style={{ borderColor: hBorder, background: hCard, color: hTextOnCard }}>Nodos</div>
                  <div className="absolute inset-0 pt-4 p-2 flex items-center justify-center">
                    <div className="w-8 h-4 rounded-full border absolute top-6 left-2" style={{ borderColor: hBorder, background: hCard }}></div>
                    <div className="w-10 h-4 rounded-full border absolute bottom-4 right-2" style={{ borderColor: hBorder, background: hCard }}></div>
                    <div className="w-6 h-6 rounded-md border z-10 shadow-sm" style={{ borderColor: hBorder, background: hTextOnBg }}></div>
                    <div className="w-full h-px absolute top-1/2 left-0 -rotate-12" style={{ background: hBorder, opacity: 0.5 }}></div>
                  </div>
                </div>

                <div className="flex-1 rounded-lg border flex flex-col overflow-hidden" style={{ borderColor: hBorder, background: hCard }}>
                  <div className="h-4 border-b flex items-center px-1.5 text-[7px] font-bold" style={{ borderColor: hBorder, color: hBorder }}>CoautorIA</div>
                  <div className="p-1.5 flex flex-col gap-1 flex-1 justify-end">
                    <div className="w-3/4 p-1 rounded-md text-[5px] self-start" style={{ background: hBg, color: hTextOnBg }}>Analiza el cdigo...</div>
                    <div className="w-3/4 p-1 rounded-md text-[5px] self-end shadow-sm" style={{ background: hBorder, color: getContrastYIQ(hBorder) }}>Claro, es un...</div>
                    <div className="h-3 w-full rounded-full border mt-1" style={{ borderColor: hBorder, background: hBg }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


