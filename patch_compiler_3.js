const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// manual fix for all instances of load_dotenv string
content = content.replace(/load_dotenv\(r'C:\\antigravityAS\\BennerAI\\\.env'\)/g, 'load_dotenv(r\'C:\\\\antigravityAS\\\\BennerAI\\\\.env\')');

// also let's just make sure we remove any unterminated string literals caused by actual newlines inside quotes
content = content.replace(/"from crewai import Agent, Task, Crew, Process\r?\n"/g, '"from crewai import Agent, Task, Crew, Process"');

fs.writeFileSync(path, content, 'utf8');
