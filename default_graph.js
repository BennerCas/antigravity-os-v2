const fs = require('fs');
let content = fs.readFileSync('apps/web-app/src/pages/Academy.tsx', 'utf-8');
content = content.replace("useState<AcademyTab>('hub');", "useState<AcademyTab>('graph');");
fs.writeFileSync('apps/web-app/src/pages/Academy.tsx', content);
