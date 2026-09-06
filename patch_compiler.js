const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// Fix unterminated string
content = content.replace(
    /"from crewai import Agent, Task, Crew, Process\n"/g,
    '"from crewai import Agent, Task, Crew, Process"'
);
content = content.replace(
    /"from crewai import Agent, Task, Crew, Process\r\n"/g,
    '"from crewai import Agent, Task, Crew, Process"'
);

// Fix escape sequence
content = content.replace(
    /"load_dotenv\(r'C:\\antigravityAS\\BennerAI\\.env'\)"/g,
    '"load_dotenv(r\'C:\\\\antigravityAS\\\\BennerAI\\\\.env\')"'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed syntax error in compiler.py");
