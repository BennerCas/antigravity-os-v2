const fs = require('fs');
let content = fs.readFileSync('apps/web-app/src/pages/Academy.tsx', 'utf-8');
content = content.replace("const [graphViewMode, setGraphViewMode] = useState<'hub' | 'missions' | '3d'>('hub');", "const [graphViewMode, setGraphViewMode] = useState<'hub' | 'missions' | '3d'>('3d');");
fs.writeFileSync('apps/web-app/src/pages/Academy.tsx', content);
