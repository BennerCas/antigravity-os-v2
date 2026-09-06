const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// Replace all json.dumps calls correctly:
content = content.replace(/json\.dumps\(\(node\.content or ''\)\.strip\(\)\.replace\('\\n', ' '\)\)/g, "json.dumps((node.content or '').strip().replace('\\n', ' '), ensure_ascii=False)");
content = content.replace(/safe_role = json\.dumps\(role\)/g, "safe_role = json.dumps(role, ensure_ascii=False)");
content = content.replace(/safe_backstory = json\.dumps\(f"You are an expert \{role\}\."\)/g, "safe_backstory = json.dumps(f\"You are an expert {role}.\", ensure_ascii=False)");
content = content.replace(/safe_desc = json\.dumps\(f"\{title\}: " \+ json\.loads\(content\)\)/g, "safe_desc = json.dumps(f\"{title}: \" + json.loads(content), ensure_ascii=False)");
content = content.replace(/safe_expected = json\.dumps\(f"Appropriate result for \{title\}"\)/g, "safe_expected = json.dumps(f\"Appropriate result for {title}\", ensure_ascii=False)");
content = content.replace(/safe_title = json\.dumps\(title\)/g, "safe_title = json.dumps(title, ensure_ascii=False)");
content = content.replace(/safe_exec_plan = json\.dumps\(execution_plan or 'Start execution'\)/g, "safe_exec_plan = json.dumps(execution_plan or 'Start execution', ensure_ascii=False)");
content = content.replace(/safe_exec_plan = json\.dumps\(exec_plan\)/g, "safe_exec_plan = json.dumps(exec_plan, ensure_ascii=False)");

fs.writeFileSync(path, content, 'utf8');
