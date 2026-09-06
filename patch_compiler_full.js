const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/code\.append\("load_dotenv\(r'C:\\antigravityAS\\BennerAI\\\.env'\)"\)/g, 'code.append(r"load_dotenv(r\'C:\\antigravityAS\\BennerAI\\.env\')")');
content = content.replace(/code\.append\("load_dotenv\(r'C:\\antigravityAS\\BennerAI\\\.env'\)\\n"\)/g, 'code.append(r"load_dotenv(r\'C:\\antigravityAS\\BennerAI\\.env\')\n")');
content = content.replace(/code\.append\("from crewai import Agent, Task, Crew, Process\r?\n"\)/g, 'code.append("from crewai import Agent, Task, Crew, Process")');

fs.writeFileSync(path, content, 'utf8');
