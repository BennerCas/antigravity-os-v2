const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/def generate_crewai_code.*?\n\s*code = \[\]/, 'def generate_crewai_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:\n    code = ["# -*- coding: utf-8 -*-"]');
content = content.replace(/def generate_autogen_code.*?\n\s*code = \[\]/, 'def generate_autogen_code(nodes: List[Node], edges: List[Edge], execution_plan: Optional[str]) -> str:\n    code = ["# -*- coding: utf-8 -*-"]');

fs.writeFileSync(path, content, 'utf8');
console.log("Added coding cookie to generated scripts");
