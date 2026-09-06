const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// 1. Add utf-8 header
content = content.replace(
  /def generate_langgraph_code\(nodes: List\[Node\], edges: List\[Edge\], execution_plan: Optional\[str\]\) -> str:\n    code = \[\]/,
  `def generate_langgraph_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:\n    code = ["# -*- coding: utf-8 -*-"]`
);

// 2. Fix the prompt string. 
// Old: code.append(f"    prompt = '{content} ' + state.get('input', '')")
// Since content is already json dumped (e.g. "my text"), we don't need surrounding quotes.
content = content.replace(
  /code\.append\(f"    prompt = '\{content\} ' \+ state\.get\('input', ''\)"\)/g,
  `code.append(f"    prompt = {content} + ' ' + state.get('input', '')")`
);

// 3. Fix exec_plan string escaping
content = content.replace(
  /exec_plan = \(execution_plan or 'Start execution'\)\.replace\('\\n', ' '\)\n    code\.append\(f"    result = app\.invoke\(\{\{'input': '\{exec_plan\}'\}\}\)"\)/g,
  `safe_exec_plan = json.dumps(execution_plan or 'Start execution')
    code.append(f"    result = app.invoke({{'input': {safe_exec_plan}}})")`
);

fs.writeFileSync(path, content, 'utf8');
