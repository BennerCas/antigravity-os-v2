const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

const useEffectSnippet = `
  useEffect(() => {
    if (cursorMode === 'erase') {
      document.body.classList.add('erase-mode');
    } else {
      document.body.classList.remove('erase-mode');
    }
    return () => document.body.classList.remove('erase-mode');
  }, [cursorMode]);
`;

content = content.replace(
  /const themeStyle = THEME_STYLES\[theme\] \|\| THEME_STYLES\["Dracula"\];/,
  useEffectSnippet + '\n  const themeStyle = THEME_STYLES[theme] || THEME_STYLES["Dracula"];'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Added erase-mode class toggle to Builder.tsx");
