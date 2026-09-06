const fs = require('fs');

let builder = fs.readFileSync('src/pages/Builder.tsx', 'utf-8');

// Add edgeColor state
if (!builder.includes('const [edgeColor')) {
  builder = builder.replace(/const \[strokeColor, setStrokeColor\] = useState<string>\('#ffffff'\);/, 
    "const [strokeColor, setStrokeColor] = useState<string>('#ffffff');\n  const [edgeColor, setEdgeColor] = useState<string>('#58a6ff');"
  );
}

// Modify onConnect
builder = builder.replace(/const newEdges = addEdge\(params, edges\);/, 
  "const newEdges = addEdge({ ...params, animated: true, style: { stroke: edgeColor, strokeWidth: 3 } }, edges);"
);

// Add edgeColor picker to the top bar, next to strokeColor
const colorPickers = `        <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 shadow-sm cursor-pointer ml-1 flex-shrink-0" title="Color de Tinta" style={{ borderColor: 'var(--theme-border)' }}>
          <input 
            type="color" 
            value={strokeColor} 
            onChange={(e) => setStrokeColor(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>
        <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 shadow-sm cursor-pointer ml-1 flex-shrink-0" title="Color del Puente (Edge)" style={{ borderColor: 'var(--theme-border)' }}>
          <input 
            type="color" 
            value={edgeColor} 
            onChange={(e) => setEdgeColor(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>`;

builder = builder.replace(/<div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-\[var\(--theme-border\)\] shadow-sm cursor-pointer ml-1 flex-shrink-0" title="Color de Tinta">[\s\S]*?<\/div>/, colorPickers);

// Fix Background color not visible. We can pass the hex string from THEME_STYLES!
builder = builder.replace(/<Background color="var\(--theme-text\)" gap=\{16\} size=\{1\} variant=\{bgPattern as any\} style=\{\{ opacity: 0\.3 \}\} \/>/,
  "{bgPattern !== 'none' && <Background color={THEME_STYLES[theme]['--theme-border'] as string} gap={16} size={1} variant={bgPattern as any} style={{ opacity: 0.8 }} />}"
);
// Also add 'none' to the bgPattern select options
builder = builder.replace(/<option value="cross">Cruces<\/option>/, '<option value="cross">Cruces</option>\n          <option value="none">Ninguno</option>');

// Fix MiniMap styling
builder = builder.replace(/\{showMinimap && <MiniMap \/>\}/, 
  "{showMinimap && <MiniMap style={{ backgroundColor: 'var(--theme-card)' }} maskColor={'rgba(0,0,0,0.2)'} nodeColor={'var(--theme-border)'} />}"
);

// Add global CSS for Controls and theme-node-btn inside Builder.tsx where other styles are
const globalStyles = `.theme-node-btn { color: var(--theme-text); opacity: 0.5; transition: all 0.2s; }
          .theme-node-btn:hover { opacity: 1; color: var(--theme-text); }
          .theme-node-btn-danger { color: var(--theme-border); opacity: 0.5; transition: all 0.2s; }
          .theme-node-btn-danger:hover { opacity: 1; color: var(--theme-border); }
          .react-flow__controls-button { background-color: var(--theme-card) !important; border-bottom: 1px solid var(--theme-border) !important; fill: var(--theme-text) !important; }
          .react-flow__controls-button:hover { background-color: var(--theme-bg) !important; }`;

builder = builder.replace(/.theme-select \{ background: var\(--theme-card\); color: var\(--theme-text\); border: 1px solid var\(--theme-border\); \}/, `$&
          ${globalStyles}`);

fs.writeFileSync('src/pages/Builder.tsx', builder);

let nodes = fs.readFileSync('src/components/BuilderNodes.tsx', 'utf-8');

// Fix buttons inside CardHeaderActions
nodes = nodes.replace(/text-white\/50 hover:text-white/g, 'theme-node-btn');
nodes = nodes.replace(/text-red-400\/50 hover:text-red-400 hover:bg-red-400\/10/g, 'theme-node-btn-danger');
// Remove hardcoded text-white from all elements inside nodes, let them inherit from var(--theme-text) globally which is set on Builder.tsx
nodes = nodes.replace(/ text-white /g, ' ');
nodes = nodes.replace(/ text-white"/g, '"');
nodes = nodes.replace(/text-white\/70/g, 'opacity-80');
nodes = nodes.replace(/border-white\/20/g, 'border-transparent');
nodes = nodes.replace(/border-white\/10/g, 'border-transparent');
nodes = nodes.replace(/bg-black\/20/g, 'bg-black/10');

fs.writeFileSync('src/components/BuilderNodes.tsx', nodes);
