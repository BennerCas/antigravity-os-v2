const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// Use json.dumps to safely escape python strings in compiler.py
content = content.replace(/import os\n/, 'import os\nimport json\n');

// For crewai
content = content.replace(/content = \(node\.content or ''\)\.strip\(\)\.replace\('\\n', ' '\)/g, "content = json.dumps((node.content or '').strip().replace('\\n', ' '))");
content = content.replace(/role=\\"\{role\}\\",/g, 'role={role},');
content = content.replace(/goal=\\"\{content\}\\",/g, 'goal={content},');
content = content.replace(/backstory=\\"You are an expert \{role\}\.\",/g, 'backstory=f"You are an expert {role}.",');
content = content.replace(/description=\\"\{title\}: \{content\}\\",/g, 'description=f"{title}: {content}",');
content = content.replace(/expected_output=\\"Appropriate result for \{title\}\\",/g, 'expected_output=f"Appropriate result for {title}",');

// For autogen (if any)
content = content.replace(/system_message=\\"\{content\}\\",/g, 'system_message={content},');
content = content.replace(/name=\\"\{title_clean\}\\",/g, 'name="{title_clean}",');

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed string escaping in compiler.py");
