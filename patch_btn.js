const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\{ejecutarLoading \?/g, '{showProgressModal ?');
content = content.replace(/disabled=\{ejecutarLoading\}/g, 'disabled={showProgressModal}');

fs.writeFileSync(path, content, 'utf8');
