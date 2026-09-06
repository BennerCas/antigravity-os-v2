const fs = require('fs');
const path = 'apps/web-app/src/pages/Flows.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /grid-cols-3 place-content-center items-stretch max-w-7xl mx-auto/g,
  'grid-cols-3 w-full h-full place-items-stretch'
);

fs.writeFileSync(path, content, 'utf8');
