const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<button onClick=\{\(\) => navigate\(-1\)\} className="p-2 rounded flex items-center gap-1 text-sm theme-btn">/g,
  `<button onClick={() => { window.history.length > 2 ? navigate(-1) : navigate('/atlas') }} className="p-2 rounded flex items-center gap-1 text-sm theme-btn">`
);

fs.writeFileSync(path, content, 'utf8');
