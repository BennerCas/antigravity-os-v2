const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
    /const buildInitialNodes = \(\): Node\[\] => \{/,
    `const buildInitialNodes = (): Node[] => {
    console.log("buildInitialNodes called!");
    console.log("location.state:", location.state);
    console.log("templateFlow:", templateFlow);
    if (templateFlow && templateFlow.nodes) {
        console.log("Returning templateFlow.nodes:", templateFlow.nodes);
        return templateFlow.nodes;
    }`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added logging to buildInitialNodes");
