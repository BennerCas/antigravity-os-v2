const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../apps/web-app/src');

function replaceButtons(filePath, componentPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('TooltipButton')) {
    const importRegex = /import React.*?;/;
    content = content.replace(importRegex, $& \nimport { TooltipButton } from '';);
  }

  // Find the .map(p => ( ... <button ...> ... </button> )) block and replace it
  const buttonRegex = /<button key=\{p\.id\}[\s\S]*?>[\s\S]*?<\/button>/g;
  
  content = content.replace(buttonRegex, (match) => {
    const onClickMatch = match.match(/onClick=\{([^}]+)\}/);
    const onClickStr = onClickMatch ? onClickMatch[0] : 'onClick={() => {}}';
    
    const classNameMatch = match.match(/className="([^"]+)"/);
    const classNameStr = classNameMatch ? classNameMatch[1] : '';
    
    return "<TooltipButton key={p.id} " + onClickStr + " className=\"" + classNameStr + "\" icon={p.icon} label={p.label} description={p.desc || 'Herramienta de análisis para el flujo de trabajo.'} />";
  });

  fs.writeFileSync(filePath, content);
}

replaceButtons(path.join(srcDir, 'components/architecture/FlowArchitect.tsx'), '../builder/TooltipButton');
replaceButtons(path.join(srcDir, 'components/architecture/RunInspector.tsx'), '../builder/TooltipButton');
replaceButtons(path.join(srcDir, 'components/architecture/RunResults.tsx'), '../builder/TooltipButton');
replaceButtons(path.join(srcDir, 'components/builder/PropertiesPanel.tsx'), './TooltipButton');

console.log("Tooltips replaced.");
