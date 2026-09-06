const fs = require('fs');
const path = 'apps/web-app/src/components/builder/PropertiesPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /playTTS\(data\.content\)/g,
    'playTTS(data.content as string)'
);

content = content.replace(
    /playTTS\(frameworkDescriptions\[data\.framework \|\| 'auto'\]\)/g,
    'playTTS(frameworkDescriptions[data.framework as string || \'auto\'])'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed TTS types.");
