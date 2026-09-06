const fs = require('fs');
const path1 = 'apps/web-app/src/components/BuilderNodes.tsx';
let content1 = fs.readFileSync(path1, 'utf8');

content1 = content1.replace(
    /className="drawing-node-wrapper" style=\{\{ pointerEvents: "none", width: 1, height: 1, overflow: "visible" \}\}/g,
    'className="drawing-node-wrapper" style={{ pointerEvents: "none", width: 1, height: 1, overflow: "visible" }}\n      /* \n        SELLO DE SEGURIDAD (ANTI-REGRESION):\n        No eliminar el style width: 1, height: 1, overflow: "visible". \n        ReactFlow requiere dimensiones base para no aplicar opacity: 0 al medir nodos personalizados.\n      */'
);

fs.writeFileSync(path1, content1, 'utf8');

const path2 = 'apps/web-app/src/pages/Builder.tsx';
let content2 = fs.readFileSync(path2, 'utf8');

content2 = content2.replace(
    /selectable: false,\n\s*width: 1,\n\s*height: 1/g,
    'selectable: false,\n        // SELLO DE SEGURIDAD: Previene que ReactFlow oculte el nodo durante el ciclo de medición\n        width: 1,\n        height: 1'
);

fs.writeFileSync(path2, content2, 'utf8');
console.log("Seals applied to drawing logic.");
