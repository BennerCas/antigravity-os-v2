import React from 'react';

export const THEME_STYLES: Record<string, React.CSSProperties> = {
  "Deep Space": { '--theme-bg': '#0A0E17', '--theme-bar': 'rgba(18,24,38,0.8)', '--theme-card': '#121826', '--theme-text': '#F8FAFC', '--theme-border': '#2563eb' } as React.CSSProperties,
  "Cyberpunk": { '--theme-bg': '#0f0f00', '--theme-bar': 'rgba(20,20,0,0.8)', '--theme-card': '#1a1a00', '--theme-text': '#00ff00', '--theme-border': '#ffff00' } as React.CSSProperties,
  "Nord": { '--theme-bg': '#2e3440', '--theme-bar': 'rgba(59,66,82,0.8)', '--theme-card': '#3b4252', '--theme-text': '#d8dee9', '--theme-border': '#88c0d0' } as React.CSSProperties,
  "Dracula": { '--theme-bg': '#282a36', '--theme-bar': 'rgba(68,71,90,0.8)', '--theme-card': '#44475a', '--theme-text': '#f8f8f2', '--theme-border': '#ff79c6' } as React.CSSProperties,
  "Matrix": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,30,0,0.8)', '--theme-card': '#001100', '--theme-text': '#00ff41', '--theme-border': '#00ff41' } as React.CSSProperties,
  "Solarized": { '--theme-bg': '#001e26', '--theme-bar': 'rgba(0,30,38,0.8)', '--theme-card': '#002b36', '--theme-text': '#93a1a1', '--theme-border': '#b58900' } as React.CSSProperties,
  "Solarized Dark": { '--theme-bg': '#002b36', '--theme-bar': 'rgba(7,54,66,0.8)', '--theme-card': '#073642', '--theme-text': '#839496', '--theme-border': '#268bd2' } as React.CSSProperties,
  "Monokai": { '--theme-bg': '#272822', '--theme-bar': 'rgba(62,61,50,0.8)', '--theme-card': '#3e3d32', '--theme-text': '#f8f8f2', '--theme-border': '#a6e22e' } as React.CSSProperties,
  "Synthwave": { '--theme-bg': '#262335', '--theme-bar': 'rgba(36,27,47,0.8)', '--theme-card': '#241b2f', '--theme-text': '#ff7edb', '--theme-border': '#36f9f6' } as React.CSSProperties,
  "Oceanic": { '--theme-bg': '#1b2b34', '--theme-bar': 'rgba(52,61,70,0.8)', '--theme-card': '#343d46', '--theme-text': '#d8dee9', '--theme-border': '#6699cc' } as React.CSSProperties,
  "Gruvbox": { '--theme-bg': '#282828', '--theme-bar': 'rgba(60,56,54,0.8)', '--theme-card': '#3c3836', '--theme-text': '#ebdbb2', '--theme-border': '#fabd2f' } as React.CSSProperties,
  "Ayu Mirage": { '--theme-bg': '#1f2430', '--theme-bar': 'rgba(36,43,56,0.8)', '--theme-card': '#242b38', '--theme-text': '#cbccc6', '--theme-border': '#ffcc66' } as React.CSSProperties,
  "Palenight": { '--theme-bg': '#292d3e', '--theme-bar': 'rgba(50,55,77,0.8)', '--theme-card': '#32374d', '--theme-text': '#a6accd', '--theme-border': '#c792ea' } as React.CSSProperties,
  "Tokyo Night": { '--theme-bg': '#1a1b26', '--theme-bar': 'rgba(36,40,59,0.8)', '--theme-card': '#24283b', '--theme-text': '#a9b1d6', '--theme-border': '#7aa2f7' } as React.CSSProperties,
  "Cobalt2": { '--theme-bg': '#193549', '--theme-bar': 'rgba(21,35,45,0.8)', '--theme-card': '#15232d', '--theme-text': '#ffffff', '--theme-border': '#ffc600' } as React.CSSProperties,
  "Night Owl": { '--theme-bg': '#011627', '--theme-bar': 'rgba(1,31,56,0.8)', '--theme-card': '#011f38', '--theme-text': '#d6deeb', '--theme-border': '#82aaff' } as React.CSSProperties,
  "Shades of Purple": { '--theme-bg': '#2d2b55', '--theme-bar': 'rgba(30,30,63,0.8)', '--theme-card': '#1e1e3f', '--theme-text': '#a599e9', '--theme-border': '#fad000' } as React.CSSProperties,
  "Material": { '--theme-bg': '#263238', '--theme-bar': 'rgba(55,71,79,0.8)', '--theme-card': '#37474f', '--theme-text': '#eeffff', '--theme-border': '#80cbc4' } as React.CSSProperties,
  "One Dark": { '--theme-bg': '#282c34', '--theme-bar': 'rgba(33,37,43,0.8)', '--theme-card': '#21252b', '--theme-text': '#abb2bf', '--theme-border': '#61afef' } as React.CSSProperties,
  "Github Dark": { '--theme-bg': '#0d1117', '--theme-bar': 'rgba(22,27,34,0.8)', '--theme-card': '#161b22', '--theme-text': '#c9d1d9', '--theme-border': '#58a6ff' } as React.CSSProperties,
  "Vesper": { '--theme-bg': '#101010', '--theme-bar': 'rgba(24,24,24,0.8)', '--theme-card': '#181818', '--theme-text': '#ffffff', '--theme-border': '#ffc799' } as React.CSSProperties,
  "Rose Pine": { '--theme-bg': '#191724', '--theme-bar': 'rgba(31,29,46,0.8)', '--theme-card': '#1f1d2e', '--theme-text': '#e0def4', '--theme-border': '#ebbcba' } as React.CSSProperties,
  "Neon Orange": { '--theme-bg': '#0a0500', '--theme-bar': 'rgba(26,10,0,0.8)', '--theme-card': '#1a0a00', '--theme-text': '#ffaa00', '--theme-border': '#ff6600' } as React.CSSProperties,
  "Neon Yellow": { '--theme-bg': '#0a0a00', '--theme-bar': 'rgba(26,26,0,0.8)', '--theme-card': '#1a1a00', '--theme-text': '#ffff00', '--theme-border': '#cccc00' } as React.CSSProperties,
  "Neon Red": { '--theme-bg': '#0a0000', '--theme-bar': 'rgba(26,0,0,0.8)', '--theme-card': '#1a0000', '--theme-text': '#ff3333', '--theme-border': '#ff0000' } as React.CSSProperties,
  "Neon Cyan": { '--theme-bg': '#000a0a', '--theme-bar': 'rgba(0,26,26,0.8)', '--theme-card': '#001a1a', '--theme-text': '#00ffff', '--theme-border': '#00cccc' } as React.CSSProperties,
  "Neon Green": { '--theme-bg': '#000a00', '--theme-bar': 'rgba(0,26,0,0.8)', '--theme-card': '#001a00', '--theme-text': '#33ff33', '--theme-border': '#ffff00' } as React.CSSProperties,
  "CyberLED Orange": { '--theme-bg': '#000000', '--theme-bar': 'rgba(15,15,15,0.8)', '--theme-card': '#0f0f0f', '--theme-text': '#ffffff', '--theme-border': '#ff6600' } as React.CSSProperties,
  "CyberLED Yellow": { '--theme-bg': '#000000', '--theme-bar': 'rgba(15,15,15,0.8)', '--theme-card': '#0f0f0f', '--theme-text': '#ffffff', '--theme-border': '#ffff00' } as React.CSSProperties,
  "CyberLED Red": { '--theme-bg': '#000000', '--theme-bar': 'rgba(15,15,15,0.8)', '--theme-card': '#0f0f0f', '--theme-text': '#ffffff', '--theme-border': '#ff0000' } as React.CSSProperties,
  "CyberLED Cyan": { '--theme-bg': '#000000', '--theme-bar': 'rgba(15,15,15,0.8)', '--theme-card': '#0f0f0f', '--theme-text': '#ffffff', '--theme-border': '#00ffff' } as React.CSSProperties,
  "CyberLED Green": { '--theme-bg': '#000000', '--theme-bar': 'rgba(15,15,15,0.8)', '--theme-card': '#0f0f0f', '--theme-text': '#ffffff', '--theme-border': '#00ff00' } as React.CSSProperties,
  "Camo Green": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': '#0a0e17', '--theme-text': '#ffffff', '--theme-border': '#ADFF2F' } as React.CSSProperties,
  "Camo Cyan": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': '#0a0e17', '--theme-text': '#ffffff', '--theme-border': '#00ffff' } as React.CSSProperties,
  "Camo Light": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': '#0a0e17', '--theme-text': '#ffffff', '--theme-border': '#32CD32' } as React.CSSProperties,
  "Camo Blue": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': '#0a0e17', '--theme-text': '#ffffff', '--theme-border': '#4169E1' } as React.CSSProperties,
};

export const getContrastYIQ = (colorStr: string) => {
  if (!colorStr) return '#ffffff';
  let c = colorStr.trim();
  if (c.startsWith('rgba') || c.startsWith('rgb')) {
    const floats = c.match(/[\d.]+/g);
    if (floats && floats.length >= 3) {
      const r = parseFloat(floats[0]);
      const g = parseFloat(floats[1]);
      const b = parseFloat(floats[2]);
      let a = 1;
      if (floats.length > 3) a = parseFloat(floats[3]);
      
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      if (a < 0.3) return '#ffffff'; 
      return (yiq >= 128) ? '#000000' : '#ffffff';
    }
  }
  if (c.startsWith('#')) {
    c = c.substring(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length === 6) {
      const r = parseInt(c.substr(0,2), 16);
      const g = parseInt(c.substr(2,2), 16);
      const b = parseInt(c.substr(4,2), 16);
      const yiq = ((r*299)+(g*587)+(b*114))/1000;
      return (yiq >= 128) ? '#000000' : '#ffffff';
    }
  }
  return '#ffffff';
};

const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const parseColor = (colorStr: string): [number, number, number] => {
    if (!colorStr) return [0,0,0];
    let c = colorStr.trim();
    if (c.startsWith('rgb')) {
        const floats = c.match(/[\d.]+/g);
        if (floats && floats.length >= 3) return [parseFloat(floats[0]), parseFloat(floats[1]), parseFloat(floats[2])];
    }
    if (c.startsWith('#')) {
        c = c.substring(1);
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        if (c.length === 6) return [parseInt(c.substr(0,2), 16), parseInt(c.substr(2,2), 16), parseInt(c.substr(4,2), 16)];
    }
    return [0,0,0];
};

export const getContrastRatio = (color1: string, color2: string) => {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

export const applyThemeToDocument = (themeName: string) => {
  let customThemes: Record<string, React.CSSProperties> = {};
  try {
    const local = localStorage.getItem('customThemes');
    if (local) customThemes = JSON.parse(local);
  } catch(e) {}
  
  const ALL = { ...THEME_STYLES, ...customThemes };
  const theme = ALL[themeName] || THEME_STYLES["Deep Space"];
  const root = document.documentElement;
  
  root.setAttribute('data-theme', themeName);

  Object.entries(theme).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(key, value);
    }
  });

  const themeAny = theme as any;
  const baseText = themeAny['--theme-text'] as string;
  const bg = themeAny['--theme-bg'] as string;
  const card = themeAny['--theme-card'] as string;
  const bar = themeAny['--theme-bar'] as string;

  const textOnBg = getContrastRatio(baseText, bg) >= 3.0 ? baseText : getContrastYIQ(bg);
  const textOnCard = getContrastRatio(baseText, card) >= 3.0 ? baseText : getContrastYIQ(card);
  const textOnBar = getContrastRatio(baseText, bar) >= 3.0 ? baseText : getContrastYIQ(bar);

  root.style.setProperty('--text-on-bg', textOnBg);
  root.style.setProperty('--text-on-card', textOnCard);
  root.style.setProperty('--text-on-bar', textOnBar);

  root.style.setProperty('--theme-text', textOnBg);

  root.style.setProperty('--surface-canvas', 'var(--theme-bg)');
  root.style.setProperty('--surface-card', 'var(--theme-card)');
  root.style.setProperty('--text-primary', textOnBg);
  root.style.setProperty('--text-secondary', textOnBg);
  root.style.setProperty('--stroke-subtle', 'var(--theme-border)');
};


