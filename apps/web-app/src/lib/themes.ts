import React from 'react';

export const THEME_STYLES: Record<string, React.CSSProperties> = {
  "Deep Space": { '--theme-bg': '#0A0E17', '--theme-bar': 'rgba(18,24,38,0.8)', '--theme-card': '#121826', '--theme-text': '#F8FAFC', '--theme-border': '#242E45' } as React.CSSProperties,
  "Cyberpunk": { '--theme-bg': '#f3e600', '--theme-bar': 'rgba(0,0,0,0.8)', '--theme-card': '#000000', '--theme-text': '#00ff00', '--theme-border': '#ff003c' } as React.CSSProperties,
  "Nord": { '--theme-bg': '#eceff4', '--theme-bar': 'rgba(46,52,64,0.8)', '--theme-card': '#2e3440', '--theme-text': '#d8dee9', '--theme-border': '#88c0d0' } as React.CSSProperties,
  "Dracula": { '--theme-bg': '#282a36', '--theme-bar': 'rgba(25,26,33,0.8)', '--theme-card': '#191A21', '--theme-text': '#f8f8f2', '--theme-border': '#ff79c6' } as React.CSSProperties,
  "Matrix": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,65,0.2)', '--theme-card': '#002200', '--theme-text': '#00ff41', '--theme-border': '#00ff41' } as React.CSSProperties,
  "Solarized": { '--theme-bg': '#fdf6e3', '--theme-bar': 'rgba(7,54,66,0.8)', '--theme-card': '#073642', '--theme-text': '#93a1a1', '--theme-border': '#b58900' } as React.CSSProperties,
  "Monokai": { '--theme-bg': '#272822', '--theme-bar': 'rgba(20,20,17,0.8)', '--theme-card': '#141411', '--theme-text': '#f8f8f2', '--theme-border': '#f92672' } as React.CSSProperties,
  "Synthwave": { '--theme-bg': '#262335', '--theme-bar': 'rgba(54,249,246,0.2)', '--theme-card': '#49265c', '--theme-text': '#36f9f6', '--theme-border': '#f92aad' } as React.CSSProperties,
  "Oceanic": { '--theme-bg': '#1b2b34', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#1b2b34', '--theme-border': '#ec5f67' } as React.CSSProperties,
  "Gruvbox": { '--theme-bg': '#fbf1c7', '--theme-bar': 'rgba(40,40,40,0.8)', '--theme-card': '#282828', '--theme-text': '#ebdbb2', '--theme-border': '#cc241d' } as React.CSSProperties,
  "Ayu Mirage": { '--theme-bg': '#1f2430', '--theme-bar': 'rgba(250,250,250,0.8)', '--theme-card': '#fafafa', '--theme-text': '#1f2430', '--theme-border': '#ffcc66' } as React.CSSProperties,
  "Palenight": { '--theme-bg': '#292d3e', '--theme-bar': 'rgba(26,28,35,0.8)', '--theme-card': '#1a1c23', '--theme-text': '#a6accd', '--theme-border': '#c792ea' } as React.CSSProperties,
  "Tokyo Night": { '--theme-bg': '#1a1b26', '--theme-bar': 'rgba(169,177,214,0.8)', '--theme-card': '#a9b1d6', '--theme-text': '#1a1b26', '--theme-border': '#f7768e' } as React.CSSProperties,
  "Cobalt2": { '--theme-bg': '#193549', '--theme-bar': 'rgba(255,198,0,0.8)', '--theme-card': '#ffc600', '--theme-text': '#193549', '--theme-border': '#ff9d00' } as React.CSSProperties,
  "Night Owl": { '--theme-bg': '#011627', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#011627', '--theme-border': '#82aaff' } as React.CSSProperties,
  "Shades of Purple": { '--theme-bg': '#2d2b55', '--theme-bar': 'rgba(30,30,63,0.8)', '--theme-card': '#1e1e3f', '--theme-text': '#fad000', '--theme-border': '#ff2c70' } as React.CSSProperties,
  "Material": { '--theme-bg': '#eceff1', '--theme-bar': 'rgba(38,50,56,0.8)', '--theme-card': '#263238', '--theme-text': '#eeffff', '--theme-border': '#80cbc4' } as React.CSSProperties,
  "One Dark": { '--theme-bg': '#282c34', '--theme-bar': 'rgba(30,34,39,0.8)', '--theme-card': '#1e2227', '--theme-text': '#abb2bf', '--theme-border': '#61afef' } as React.CSSProperties,
  "Github Dark": { '--theme-bg': '#0d1117', '--theme-bar': 'rgba(255,255,255,0.8)', '--theme-card': '#ffffff', '--theme-text': '#24292e', '--theme-border': '#58a6ff' } as React.CSSProperties,
  "Vesper": { '--theme-bg': '#101010', '--theme-bar': 'rgba(250,250,250,0.8)', '--theme-card': '#fafafa', '--theme-text': '#101010', '--theme-border': '#ffc799' } as React.CSSProperties,
  "Rose Pine": { '--theme-bg': '#191724', '--theme-bar': 'rgba(250,244,237,0.8)', '--theme-card': '#faf4ed', '--theme-text': '#575279', '--theme-border': '#ebbcba' } as React.CSSProperties,
  "Neon Orange": { '--theme-bg': '#0a0500', '--theme-bar': 'rgba(255,100,0,0.2)', '--theme-card': '#1a0a00', '--theme-text': '#ffaa00', '--theme-border': '#ff6600' } as React.CSSProperties,
  "Neon Yellow": { '--theme-bg': '#0a0a00', '--theme-bar': 'rgba(255,255,0,0.2)', '--theme-card': '#1a1a00', '--theme-text': '#ffff00', '--theme-border': '#cccc00' } as React.CSSProperties,
  "Neon Red": { '--theme-bg': '#0a0000', '--theme-bar': 'rgba(255,0,0,0.2)', '--theme-card': '#1a0000', '--theme-text': '#ff3333', '--theme-border': '#ff0000' } as React.CSSProperties,
  "Neon Cyan": { '--theme-bg': '#000a0a', '--theme-bar': 'rgba(0,255,255,0.2)', '--theme-card': '#001a1a', '--theme-text': '#00ffff', '--theme-border': '#00cccc' } as React.CSSProperties,
  "Neon Green": { '--theme-bg': '#000a00', '--theme-bar': 'rgba(0,255,0,0.2)', '--theme-card': '#001a00', '--theme-text': '#33ff33', '--theme-border': '#00ff00' } as React.CSSProperties,
  "CyberLED Orange": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,100,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ff6600' } as React.CSSProperties,
  "CyberLED Yellow": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,255,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ffff00' } as React.CSSProperties,
  "CyberLED Red": { '--theme-bg': '#000000', '--theme-bar': 'rgba(255,0,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#ff0000' } as React.CSSProperties,
  "CyberLED Cyan": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,255,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#00ffff' } as React.CSSProperties,
  "CyberLED Green": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,255,0,0.8)', '--theme-card': '#000000', '--theme-text': '#ffffff', '--theme-border': '#00ff00' } as React.CSSProperties,
  "Camo Green": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': 'rgba(10,14,23,0.85)', '--theme-text': '#ffffff', '--theme-border': '#ADFF2F' } as React.CSSProperties,
  "Camo Cyan": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': 'rgba(10,14,23,0.85)', '--theme-text': '#ffffff', '--theme-border': '#00ffff' } as React.CSSProperties,
  "Camo Light": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': 'rgba(10,14,23,0.85)', '--theme-text': '#ffffff', '--theme-border': '#32CD32' } as React.CSSProperties,
  "Camo Blue": { '--theme-bg': '#05070a', '--theme-bar': 'rgba(10,14,23,0.85)', '--theme-card': 'rgba(10,14,23,0.85)', '--theme-text': '#ffffff', '--theme-border': '#4169E1' } as React.CSSProperties,
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

const getContrastRatio = (color1: string, color2: string) => {
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
};

export const applyThemeToDocument = (themeName: string) => {
  const theme = THEME_STYLES[themeName] || THEME_STYLES["Deep Space"];
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

  // Use base text if contrast ratio is acceptable (>= 3.0), else fallback to strict YIQ Black/White
  const textOnBg = getContrastRatio(baseText, bg) >= 3.0 ? baseText : getContrastYIQ(bg);
  const textOnCard = getContrastRatio(baseText, card) >= 3.0 ? baseText : getContrastYIQ(card);
  const textOnBar = getContrastRatio(baseText, bar) >= 3.0 ? baseText : getContrastYIQ(bar);

  root.style.setProperty('--text-on-bg', textOnBg);
  root.style.setProperty('--text-on-card', textOnCard);
  root.style.setProperty('--text-on-bar', textOnBar);

  // Default theme-text is based on background
  root.style.setProperty('--theme-text', textOnBg);

  root.style.setProperty('--surface-canvas', 'var(--theme-bg)');
  root.style.setProperty('--surface-card', 'var(--theme-card)');
  root.style.setProperty('--text-primary', textOnBg);
  root.style.setProperty('--text-secondary', textOnBg);
  root.style.setProperty('--stroke-subtle', 'var(--theme-border)');
};
