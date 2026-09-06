const fs = require('fs');
const path = 'apps/web-app/src/components/BuilderNodes.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/w-\[360px\] h-\[640px\]/g, 'w-full h-full min-w-[360px] min-h-[640px]');
content = content.replace(/minWidth=\{288\}/g, 'minWidth={360}');
content = content.replace(/minHeight=\{200\}/g, 'minHeight={640}');
content = content.replace(/minWidth=\{320\}/g, 'minWidth={360}');
content = content.replace(/minHeight=\{150\}/g, 'minHeight={640}');

fs.writeFileSync(path, content, 'utf8');
console.log("Restored full resizing capability with new 9:16 dimensions");
