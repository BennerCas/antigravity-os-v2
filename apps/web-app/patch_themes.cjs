const fs = require('fs');

let builder = fs.readFileSync('src/pages/Builder.tsx', 'utf-8');

const newThemeStyles = `const THEME_STYLES: Record<string, React.CSSProperties> = {
  "Cyberpunk": { '--theme-bg': '#f3e600', '--theme-bar': 'rgba(255,0,60,0.8)', '--theme-card': '#222222', '--theme-text': '#00ff00', '--theme-border': '#ff003c' } as React.CSSProperties,
  "Nord": { '--theme-bg': '#2e3440', '--theme-bar': 'rgba(59,66,82,0.8)', '--theme-card': '#3b4252', '--theme-text': '#d8dee9', '--theme-border': '#81a1c1' } as React.CSSProperties,
  "Dracula": { '--theme-bg': '#282a36', '--theme-bar': 'rgba(68,71,90,0.8)', '--theme-card': '#44475a', '--theme-text': '#f8f8f2', '--theme-border': '#bd93f9' } as React.CSSProperties,
  "Matrix": { '--theme-bg': '#000000', '--theme-bar': 'rgba(0,30,0,0.8)', '--theme-card': '#001100', '--theme-text': '#00ff41', '--theme-border': '#008f11' } as React.CSSProperties,
  "Solarized": { '--theme-bg': '#002b36', '--theme-bar': 'rgba(7,54,66,0.8)', '--theme-card': '#073642', '--theme-text': '#839496', '--theme-border': '#2aa198' } as React.CSSProperties,
  "Monokai": { '--theme-bg': '#272822', '--theme-bar': 'rgba(62,61,50,0.8)', '--theme-card': '#3e3d32', '--theme-text': '#f8f8f2', '--theme-border': '#a6e22e' } as React.CSSProperties,
  "Synthwave": { '--theme-bg': '#262335', '--theme-bar': 'rgba(36,27,47,0.8)', '--theme-card': '#241b2f', '--theme-text': '#36f9f6', '--theme-border': '#f92aad' } as React.CSSProperties,
  "Oceanic": { '--theme-bg': '#1b2b34', '--theme-bar': 'rgba(52,61,70,0.8)', '--theme-card': '#343d46', '--theme-text': '#c0c5ce', '--theme-border': '#5fb3b3' } as React.CSSProperties,
  "Gruvbox": { '--theme-bg': '#282828', '--theme-bar': 'rgba(60,56,54,0.8)', '--theme-card': '#3c3836', '--theme-text': '#ebdbb2', '--theme-border': '#fabd2f' } as React.CSSProperties,
  "Ayu Mirage": { '--theme-bg': '#1f2430', '--theme-bar': 'rgba(28,33,43,0.8)', '--theme-card': '#1c212b', '--theme-text': '#cbccc6', '--theme-border': '#ffcc66' } as React.CSSProperties,
  "Palenight": { '--theme-bg': '#292d3e', '--theme-bar': 'rgba(67,71,88,0.8)', '--theme-card': '#434758', '--theme-text': '#a6accd', '--theme-border': '#c792ea' } as React.CSSProperties,
  "Tokyo Night": { '--theme-bg': '#1a1b26', '--theme-bar': 'rgba(36,40,59,0.8)', '--theme-card': '#24283b', '--theme-text': '#c0caf5', '--theme-border': '#7aa2f7' } as React.CSSProperties,
  "Cobalt2": { '--theme-bg': '#193549', '--theme-bar': 'rgba(25,53,73,0.8)', '--theme-card': '#15232d', '--theme-text': '#ffffff', '--theme-border': '#ffc600' } as React.CSSProperties,
  "Night Owl": { '--theme-bg': '#011627', '--theme-bar': 'rgba(1,22,39,0.8)', '--theme-card': '#011627', '--theme-text': '#d6deeb', '--theme-border': '#82aaff' } as React.CSSProperties,
  "Shades of Purple": { '--theme-bg': '#2d2b55', '--theme-bar': 'rgba(30,30,63,0.8)', '--theme-card': '#1e1e3f', '--theme-text': '#a599e9', '--theme-border': '#fad000' } as React.CSSProperties,
  "Material": { '--theme-bg': '#263238', '--theme-bar': 'rgba(38,50,56,0.8)', '--theme-card': '#263238', '--theme-text': '#eeffff', '--theme-border': '#80cbc4' } as React.CSSProperties,
  "One Dark": { '--theme-bg': '#282c34', '--theme-bar': 'rgba(40,44,52,0.8)', '--theme-card': '#282c34', '--theme-text': '#abb2bf', '--theme-border': '#61afef' } as React.CSSProperties,
  "Github Dark": { '--theme-bg': '#0d1117', '--theme-bar': 'rgba(22,27,34,0.8)', '--theme-card': '#161b22', '--theme-text': '#c9d1d9', '--theme-border': '#58a6ff' } as React.CSSProperties,
  "Vesper": { '--theme-bg': '#101010', '--theme-bar': 'rgba(20,20,20,0.8)', '--theme-card': '#141414', '--theme-text': '#a0a0a0', '--theme-border': '#ffc799' } as React.CSSProperties,
  "Rose Pine": { '--theme-bg': '#191724', '--theme-bar': 'rgba(31,29,46,0.8)', '--theme-card': '#1f1d2e', '--theme-text': '#e0def4', '--theme-border': '#ebbcba' } as React.CSSProperties,
};`;

builder = builder.replace(/const THEME_STYLES: Record<string, string> = {[\s\S]*?};\n/, newThemeStyles + '\n');
builder = builder.replace(/const themeClass = THEME_STYLES\[theme\] \|\| .*?;\s*return \(\s*<div className=\{`fixed inset-0 z-50 flex flex-col \$\{themeClass\} transition-colors duration-300`\}>/, 'const themeStyle = THEME_STYLES[theme] || THEME_STYLES["Dracula"];\n  return (\n    <div className="fixed inset-0 z-50 flex flex-col transition-colors duration-300" style={{ ...themeStyle, backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>');
builder = builder.replace(/className="absolute top-4 left-1\/2 -translate-x-1\/2 z-\[60\] bg-black\/60 backdrop-blur-xl rounded-2xl p-2 flex items-center gap-2 border border-white\/20 shadow-2xl"/, 'className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl rounded-2xl p-2 flex items-center gap-2 border shadow-2xl transition-colors duration-300" style={{ backgroundColor: "var(--theme-bar)", borderColor: "var(--theme-border)" }}');

fs.writeFileSync('src/pages/Builder.tsx', builder);

let nodes = fs.readFileSync('src/components/BuilderNodes.tsx', 'utf-8');
nodes = nodes.replace(/bg-gradient-to-br from-indigo-500 to-purple-600/g, 'transition-colors duration-300');
nodes = nodes.replace(/bg-slate-800/g, 'transition-colors duration-300');
nodes = nodes.replace(/border-indigo-300/g, 'border-transparent');
nodes = nodes.replace(/border-blue-500/g, 'border-transparent');
nodes = nodes.replace(/border-green-500/g, 'border-transparent');
nodes = nodes.replace(/border-yellow-500/g, 'border-transparent');

nodes = nodes.replace(/className="transition-colors duration-300 p-6 rounded-xl shadow-2xl text-white w-72 border-2 border-transparent relative"/g, 'className="transition-colors duration-300 p-6 rounded-xl shadow-2xl w-72 border-t-4 relative" style={{ backgroundColor: "var(--theme-card)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}');
nodes = nodes.replace(/className="transition-colors duration-300 p-5 rounded-xl shadow-\[0_20px_50px_rgba\(0,_0,_0,_0\.5\)\] w-72 border-t-4 border-transparent transform transition-transform hover:scale-105 text-white relative"/g, 'className="transition-colors duration-300 p-5 rounded-xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] w-72 border-t-4 transform transition-transform hover:scale-105 relative" style={{ backgroundColor: "var(--theme-card)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}');
nodes = nodes.replace(/className="transition-colors duration-300 p-5 rounded-xl shadow-\[0_20px_50px_rgba\(0,_0,_0,_0\.5\)\] w-72 border-t-4 border-transparent text-white relative"/g, 'className="transition-colors duration-300 p-5 rounded-xl shadow-[0_20px_50px_rgba(0,_0,_0,_0.5)] w-72 border-t-4 relative" style={{ backgroundColor: "var(--theme-card)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}');

nodes = nodes.replace(/bg-slate-700/g, 'bg-black/20');
nodes = nodes.replace(/border-slate-600/g, 'border-white/10');
fs.writeFileSync('src/components/BuilderNodes.tsx', nodes);
