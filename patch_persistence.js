const fs = require('fs');
const path = 'apps/web-app/src/pages/Builder.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace executionResult state
content = content.replace(
    /const \[executionResult, setExecutionResult\] = useState<any>\(null\);/,
    `const [executionResult, setExecutionResult] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('builder_executionResult');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  useEffect(() => {
    if (executionResult) localStorage.setItem('builder_executionResult', JSON.stringify(executionResult));
    else localStorage.removeItem('builder_executionResult');
  }, [executionResult]);`
);

// Replace compiledCode state
content = content.replace(
    /const \[compiledCode, setCompiledCode\] = useState<string \| null>\(null\);/,
    `const [compiledCode, setCompiledCode] = useState<string | null>(() => {
    return localStorage.getItem('builder_compiledCode') || null;
  });
  
  useEffect(() => {
    if (compiledCode) localStorage.setItem('builder_compiledCode', compiledCode);
    else localStorage.removeItem('builder_compiledCode');
  }, [compiledCode]);`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Persistence injected into Builder.tsx");
