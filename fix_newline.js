const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// The problematic string at line 104 has a literal newline inside a raw string
// We'll replace it entirely
content = content.replace(/code\.append\(r"load_dotenv\(r'C:\\\\antigravityAS\\\\BennerAI\\\\\.env'\)\r?\n"\)/, 'code.append("load_dotenv(r\'C:\\\\antigravityAS\\\\BennerAI\\\\.env\')")');

// Let's also catch the case where it doesn't have the r prefix if I changed it
content = content.replace(/code\.append\("load_dotenv\(r'C:\\\\antigravityAS\\\\BennerAI\\\\\.env'\)\r?\n"\)/, 'code.append("load_dotenv(r\'C:\\\\antigravityAS\\\\BennerAI\\\\.env\')")');
content = content.replace(/code\.append\(r"load_dotenv\(r'C:\\\\antigravityAS\\\\BennerAI\\\\\.env'\)[\r\n]+"\)/g, 'code.append("load_dotenv(r\'C:\\\\antigravityAS\\\\BennerAI\\\\.env\')")');

fs.writeFileSync(path, content, 'utf8');
