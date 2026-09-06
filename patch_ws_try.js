const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const startExecution = \(\) => \{[\s\S]*?setIsExecuting\(true\);[\s\S]*?setTerminalLogs\(\['Iniciando conexión con Runtime\.\.\.'\]\);[\s\S]*?const ws = new WebSocket\('ws:\/\/127\.0\.0\.1:8000\/api\/v1\/ws\/execute'\);/,
    `const startExecution = () => {
    try {
      console.log('startExecution triggered!');
      setIsExecuting(true);
      setTerminalLogs(['Iniciando conexión con Runtime...']);
      const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws/execute');`
);

content = content.replace(
    /ws\.onclose = \(\) => \{[\s\S]*?setTerminalLogs\(prev => \[\.\.\.prev, 'Conexión cerrada\.'\]\);[\s\S]*?\};/,
    `ws.onclose = () => {
      setTerminalLogs(prev => [...prev, 'Conexión cerrada.']);
    };
    } catch (err) {
      alert('Error in startExecution: ' + err);
      console.error(err);
    }`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched startExecution with try-catch and console.log");
