const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

// Modificar firma de RulerNode
content = content.replace(
    /export const RulerNode = \(\) => \{/g,
    'export const RulerNode = ({ id }: any) => {'
);

// Agregar botón X dentro del return del RulerNode
const closeButton = `
      <button 
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('deleteNode', { detail: { id } }));
        }}
        className="absolute -top-2 -left-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full cursor-pointer shadow hover:scale-110 flex items-center justify-center text-white text-xs z-10 transition-transform"
        title="Cerrar regla"
      >
        ✕
      </button>
`;

content = content.replace(
    /return \(\s*<div ref=\{nodeRef\} className="relative flex items-center justify-center border border-transparent\/50 shadow-lg backdrop-blur-md"/s,
    `return (\n    <div ref={nodeRef} className="relative flex items-center justify-center border border-transparent/50 shadow-lg backdrop-blur-md"`
);

content = content.replace(
    /<div ref=\{nodeRef\} className="relative flex items-center justify-center border border-transparent\/50 shadow-lg backdrop-blur-md"[^>]*>(\s*)/,
    (match, p1) => match + closeButton + p1
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added close button to RulerNode");
