const fs = require('fs');
let code = fs.readFileSync('src/pages/Builder.tsx', 'utf-8');

// Add bgPattern state
if (!code.includes('const [bgPattern')) {
  code = code.replace(/const \[theme, setTheme\] = useState\('Dracula'\);/, 
    "const [theme, setTheme] = useState('Dracula');\n  const [bgPattern, setBgPattern] = useState<string>('dots');"
  );
}

// Modify <Background />
code = code.replace(/<Background color="#ffffff" gap=\{16\} size=\{1\} \/>/, 
  `<Background color="var(--theme-text)" gap={16} size={1} variant={bgPattern as any} style={{ opacity: 0.3 }} />`
);

// Replace button styles in top bar
const oldBarStart = `      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl rounded-2xl p-2 flex items-center gap-2 border shadow-2xl transition-colors duration-300" style={{ backgroundColor: "var(--theme-bar)", borderColor: "var(--theme-border)" }}>`;

const newBarStart = `      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] backdrop-blur-xl rounded-2xl p-2 flex items-center gap-2 shadow-2xl transition-colors duration-300 border-2" style={{ backgroundColor: "var(--theme-bar)", borderColor: "var(--theme-border)", color: "var(--theme-text)" }}>
        <style>{\`
          .theme-btn { color: var(--theme-text); background: transparent; transition: all 0.2s; border: 1px solid transparent; }
          .theme-btn:hover { background: var(--theme-bg); border-color: var(--theme-border); opacity: 0.8; }
          .theme-btn.active { background: var(--theme-card); border-color: var(--theme-border); }
          .theme-divider { width: 1px; height: 24px; background: var(--theme-border); opacity: 0.5; margin: 0 4px; }
          .theme-select { background: var(--theme-card); color: var(--theme-text); border: 1px solid var(--theme-border); }
        \`}</style>`;

code = code.replace(oldBarStart, newBarStart);

// Replace specific buttons and elements
code = code.replace(/className="p-2 rounded hover:bg-white\/10 flex items-center gap-1 text-sm transition-colors text-white"/g, 'className="p-2 rounded flex items-center gap-1 text-sm theme-btn"');
code = code.replace(/className="p-2 rounded hover:bg-white\/10 disabled:opacity-50 transition-colors text-white"/g, 'className="p-2 rounded disabled:opacity-50 theme-btn"');
code = code.replace(/className="p-2 rounded hover:bg-white\/10 transition-colors text-white"/g, 'className="p-2 rounded theme-btn"');
code = code.replace(/className="w-px h-6 bg-white\/20 mx-1"/g, 'className="theme-divider"');

code = code.replace(/className=\{`p-2 rounded transition-colors text-white \$\{cursorMode === 'pan' \? 'bg-white\/20' : 'hover:bg-white\/10'\}`\}/g, "className={`p-2 rounded theme-btn ${cursorMode === 'pan' ? 'active' : ''}`}");
code = code.replace(/className=\{`p-2 rounded transition-colors text-white \$\{cursorMode === 'draw' \? 'bg-white\/20' : 'hover:bg-white\/10'\}`\}/g, "className={`p-2 rounded theme-btn ${cursorMode === 'draw' ? 'active' : ''}`}");
code = code.replace(/className=\{`p-2 rounded transition-colors text-white \$\{cursorMode === 'line' \? 'bg-white\/20' : 'hover:bg-white\/10'\}`\}/g, "className={`p-2 rounded theme-btn ${cursorMode === 'line' ? 'active' : ''}`}");
code = code.replace(/className=\{`p-2 rounded transition-colors text-white \$\{cursorMode === 'erase' \? 'bg-white\/20' : 'hover:bg-white\/10'\}`\}/g, "className={`p-2 rounded theme-btn ${cursorMode === 'erase' ? 'active' : ''}`}");

code = code.replace(/className=\{`px-3 py-1\.5 text-sm rounded transition-colors text-white \$\{showMinimap \? 'bg-white\/20' : 'bg-white\/10 hover:bg-white\/20'\}`\}/g, "className={`px-3 py-1.5 text-sm rounded theme-btn ${showMinimap ? 'active' : ''}`}");
code = code.replace(/className=\{`px-3 py-1\.5 text-sm rounded transition-colors text-white \$\{showControls \? 'bg-white\/20' : 'bg-white\/10 hover:bg-white\/20'\}`\}/g, "className={`px-3 py-1.5 text-sm rounded theme-btn ${showControls ? 'active' : ''}`}");

code = code.replace(/className="px-3 py-1\.5 text-sm bg-white\/10 hover:bg-white\/20 rounded transition-colors text-white font-mono"/g, 'className="px-3 py-1.5 text-sm rounded theme-btn font-mono"');
code = code.replace(/className="px-3 py-1\.5 text-sm bg-white\/10 hover:bg-white\/20 rounded transition-colors text-white"/g, 'className="px-3 py-1.5 text-sm rounded theme-btn"');

// Fix selects
code = code.replace(/className="bg-black\/40 border border-white\/20 rounded p-1\.5 text-sm outline-none cursor-pointer text-white max-w-\[120px\]"/g, 'className="rounded p-1.5 text-sm outline-none cursor-pointer theme-select max-w-[120px]"');
code = code.replace(/className="bg-transparent text-white\/90 border border-white\/20 rounded p-1 text-sm outline-none ml-4"/g, 'className="rounded p-1 text-sm outline-none cursor-pointer theme-select ml-4"');

// Change the border of the color picker wrapper
code = code.replace(/border-white\/50/g, 'border-[var(--theme-border)]');


// Insert Bg pattern select next to theme select
const themeSelectRegex = /<select[\s\S]*?value=\{theme\}[\s\S]*?onChange=\{\(e\) => setTheme\(e\.target\.value\)\}[\s\S]*?<\/select>/;
const bgSelect = `$&
        <select 
          value={bgPattern} 
          onChange={(e) => setBgPattern(e.target.value)}
          className="rounded p-1.5 text-sm outline-none cursor-pointer theme-select max-w-[100px]"
          title="Fondo"
        >
          <option value="dots">Puntos</option>
          <option value="lines">Líneas</option>
          <option value="cross">Cruces</option>
        </select>`;

code = code.replace(themeSelectRegex, bgSelect);

fs.writeFileSync('src/pages/Builder.tsx', code);
