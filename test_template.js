const fs = require('fs');
let content = fs.readFileSync('apps/web-app/src/data/flowsTemplates.ts', 'utf8');
const match = content.match(/builderData:\s*(\{.*?\})/s);
if (match) {
    console.log(typeof match[1]);
    console.log(match[1].substring(0, 50));
}
