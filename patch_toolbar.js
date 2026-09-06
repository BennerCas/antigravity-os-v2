const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const newStyles = `
          .theme-btn { color: var(--theme-text); background: var(--theme-bg); transition: all 0.2s; border: 1px solid var(--theme-border); border-radius: 6px; font-weight: 500; }
          .theme-btn:hover { background: var(--theme-border); color: var(--theme-bg); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .theme-btn.active { background: var(--theme-text); color: var(--theme-bg); border-color: var(--theme-text); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); transform: none; }
          .theme-divider { width: 1px; height: 24px; background: var(--theme-border); opacity: 0.5; margin: 0 8px; }
          .theme-select { background: var(--theme-bg); color: var(--theme-text); border: 1px solid var(--theme-border); padding: 4px 8px; border-radius: 6px; font-weight: 500; outline: none; cursor: pointer; }
          .theme-select:hover { border-color: var(--theme-text); }
`;

content = content.replace(
    /\.theme-btn \{ color: var\(--theme-text\); background: transparent; transition: all 0\.2s; border: 1px solid transparent; \}\s*\.theme-btn:hover \{ background: var\(--theme-bg\); border-color: var\(--theme-border\); opacity: 0\.8; \}\s*\.theme-btn\.active \{ background: var\(--theme-card\); border-color: var\(--theme-border\); \}\s*\.theme-divider \{ width: 1px; height: 24px; background: var\(--theme-border\); opacity: 0\.5; margin: 0 4px; \}\s*\.theme-select \{ background: var\(--theme-card\); color: var\(--theme-text\); border: 1px solid var\(--theme-border\); \}/,
    newStyles.trim()
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated toolbar button styles for contrast");
