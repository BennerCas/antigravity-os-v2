const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const nodesData = nodes\.filter\(n => n\.type !== 'postIt' && n\.type !== 'drawingNode' && n\.type !== 'rulerNode'\)\.map\(n => \(\{\s*id: n\.id,\s*title: n\.data\?\.title \|\| 'Sin Título',\s*content: String\(n\.data\?\.content \|\| ''\),\s*role: n\.data\?\.role \|\| 'Default Agent',\s*framework: n\.data\?\.framework \|\| 'auto',\s*type: n\.type \|\| 'mainPrompt'\s*\}\)\);/g;

const replacement = `const nodesData = nodes.filter(n => n.type !== 'postIt' && n.type !== 'drawingNode' && n.type !== 'rulerNode').map(n => ({
      id: n.id,
      title: n.data?.title || 'Sin Título',
      content: String(n.data?.content || ''),
      role: n.data?.role || 'Default Agent',
      framework: n.data?.framework || 'auto',
      type: n.type || 'mainPrompt',
      variables: n.data?.variables || '',
      llm_model: n.data?.llm_model || 'hermes3:8b',
      temperature: n.data?.temperature || 0.7,
      output_schema: n.data?.output_schema || '{"type": "object"}'
    }));`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log("Builder.tsx nodesData construction updated.");
