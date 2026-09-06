const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /type: cursorMode === 'line' \? 'line' : 'free'\s*\},\s*draggable: false,\s*selectable: false\s*\};/g,
    `type: cursorMode === 'line' ? 'line' : 'free'\n        },\n        draggable: false,\n        selectable: false,\n        width: 1,\n        height: 1\n      };`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed Builder.tsx newNode dimensions");
