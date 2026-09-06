const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexLogicOld = `      if (event.data.includes('[DONE] Process exited with code 0')) {
        const fullText = terminalLogsRef.current.join('\\n');
        const match = fullText.match(/Final Output:\\s([\\s\\S]*?)(?:\\[DONE\\]|$)/);
        if (match && match[1]) {
           setFinalOutputContent(match[1].trim());
           setShowArtifactModal(true);
        }
      }`;

const regexLogicNew = `      if (event.data.includes('[DONE] Process exited with code 0')) {
        const fullText = terminalLogsRef.current.join('\\n');
        const match = fullText.match(/Final Output:\\s([\\s\\S]*?)(?:\\[DONE\\]|$)/);
        if (match && match[1]) {
           setFinalOutputContent(match[1].trim());
        } else {
           // Fallback: Just grab the last chunks if Final Output string is missing somehow
           const lines = terminalLogsRef.current;
           const lastLines = lines.slice(Math.max(lines.length - 20, 0)).join('\\n');
           setFinalOutputContent("### Resultado Final\\n\\n" + lastLines);
        }
        setShowArtifactModal(true);
      }`;

content = content.replace(regexLogicOld, regexLogicNew);
fs.writeFileSync(path, content, 'utf8');
