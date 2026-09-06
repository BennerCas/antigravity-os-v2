const fs = require('fs');
const path = 'apps/web-app/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ Sidebar \} from '\.\/components\/Sidebar';/, "import { Sidebar } from './components/Sidebar';\nimport { ErrorBoundary } from './components/ErrorBoundary';");

content = content.replace(/<Routes>/, "<ErrorBoundary>\n              <Routes>");
content = content.replace(/<\/Routes>/, "</Routes>\n            </ErrorBoundary>");

fs.writeFileSync(path, content, 'utf8');
