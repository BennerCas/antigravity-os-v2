const fs = require('fs');

let builder = fs.readFileSync('src/pages/Builder.tsx', 'utf-8');

// 1. Add 10 Cyberpunk themes
const extraThemes = `
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
};`;

builder = builder.replace(/};\s*type HistoryState =/, extraThemes + '\n\ntype HistoryState =');

const extraThemeNames = `  "Neon Orange", "Neon Yellow", "Neon Red", "Neon Cyan", "Neon Green",
  "CyberLED Orange", "CyberLED Yellow", "CyberLED Red", "CyberLED Cyan", "CyberLED Green"
];`;
builder = builder.replace(/];\s*const THEME_STYLES/, extraThemeNames + '\n\nconst THEME_STYLES');


// 2. Add nodeStyle state
if (!builder.includes('const [nodeStyle')) {
  builder = builder.replace(/const \[bgPattern, setBgPattern\] = useState\("dots"\);/, 
    'const [bgPattern, setBgPattern] = useState("dots");\n  const [nodeStyle, setNodeStyle] = useState("default");'
  );
}

// 3. Add Node Style select dropdown
const bgSelectRegex = /<select[\s\S]*?value=\{bgPattern\}[\s\S]*?onChange=\{\(e\) => setBgPattern\(e\.target\.value\)\}[\s\S]*?<\/select>/;
const nodeStyleSelect = `$&
        <select 
          value={nodeStyle} 
          onChange={(e) => setNodeStyle(e.target.value)}
          className="rounded p-1.5 text-sm outline-none cursor-pointer theme-select max-w-[120px]"
          title="Estilo de Nodo"
        >
          <option value="default">Default</option>
          <option value="neon">Neón Destello</option>
          <option value="brutalist">Brutalista</option>
          <option value="glass">Cristal 3D</option>
          <option value="wireframe">Wireframe</option>
          <option value="hologram">Holograma</option>
          <option value="soft">Suave Redondo</option>
          <option value="sharp">Afilado 0px</option>
          <option value="terminal">Terminal CLI</option>
          <option value="retro">Retro 8-bit</option>
        </select>`;
builder = builder.replace(bgSelectRegex, nodeStyleSelect);

// 4. Inject global CSS for node styles
const globalStyles = `.theme-node-style-neon .react-flow__node > div { box-shadow: 0 0 25px var(--theme-border), inset 0 0 10px var(--theme-border) !important; border-radius: 12px; }
          .theme-node-style-brutalist .react-flow__node > div { border-radius: 0 !important; border-width: 4px !important; border-style: solid; box-shadow: 8px 8px 0 var(--theme-text) !important; }
          .theme-node-style-glass .react-flow__node > div { background: rgba(0,0,0,0.1) !important; backdrop-filter: blur(12px) !important; border-radius: 16px; border: 1px solid var(--theme-border) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; }
          .theme-node-style-wireframe .react-flow__node > div { background: transparent !important; border: 2px dashed var(--theme-border) !important; border-radius: 0 !important; }
          .theme-node-style-hologram .react-flow__node > div { background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 100%) !important; border: 1px solid var(--theme-border) !important; border-radius: 4px; box-shadow: 0 0 15px var(--theme-border); opacity: 0.9; }
          .theme-node-style-hologram .react-flow__node > div::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--theme-border) 3px); opacity: 0.1; pointer-events: none; }
          .theme-node-style-soft .react-flow__node > div { border-radius: 30px !important; border-width: 0 !important; box-shadow: 0 10px 40px rgba(0,0,0,0.4) !important; }
          .theme-node-style-sharp .react-flow__node > div { border-radius: 0 !important; border: 1px solid var(--theme-border) !important; }
          .theme-node-style-terminal .react-flow__node > div { background: #000 !important; color: #0f0 !important; border: 1px solid #0f0 !important; border-radius: 0 !important; font-family: monospace; }
          .theme-node-style-retro .react-flow__node > div { border: 4px solid var(--theme-border) !important; border-radius: 0 !important; box-shadow: inset -4px -4px 0 rgba(0,0,0,0.5), inset 4px 4px 0 rgba(255,255,255,0.2) !important; }
          `;

builder = builder.replace(/.react-flow__controls-button:hover \{ background-color: var\(--theme-bg\) !important; \}/, `$&
          ${globalStyles}`);

// Wrap ReactFlow in a div with the chosen style class
// The main container is: <div className="fixed inset-0 z-50 flex flex-col transition-colors duration-300"
builder = builder.replace(/<div className="fixed inset-0 z-50 flex flex-col transition-colors duration-300"/, 
  `<div className={\`fixed inset-0 z-50 flex flex-col transition-colors duration-300 theme-node-style-\${nodeStyle}\`}`
);

fs.writeFileSync('src/pages/Builder.tsx', builder);
