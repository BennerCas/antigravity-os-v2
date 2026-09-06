const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// Revert the bad change first
content = content.replace(/json\.dumps\(\(node\.content or '', ensure_ascii=False\)\.strip\(\)\.replace\('\\n', ' '\)\)/g, "json.dumps((node.content or '').strip().replace('\\n', ' '))");
// Revert others
content = content.replace(/safe_role = json\.dumps\(role, ensure_ascii=False\)/g, "safe_role = json.dumps(role)");
content = content.replace(/safe_backstory = json\.dumps\(f"You are an expert \{role\}\.", ensure_ascii=False\)/g, "safe_backstory = json.dumps(f\"You are an expert {role}.\")");
content = content.replace(/safe_desc = json\.dumps\(f"\{title\}: " \+ json\.loads\(content, ensure_ascii=False\)\)/g, "safe_desc = json.dumps(f\"{title}: \" + json.loads(content))");
content = content.replace(/safe_expected = json\.dumps\(f"Appropriate result for \{title\}", ensure_ascii=False\)/g, "safe_expected = json.dumps(f\"Appropriate result for {title}\")");
content = content.replace(/safe_title = json\.dumps\(title, ensure_ascii=False\)/g, "safe_title = json.dumps(title)");
content = content.replace(/safe_exec_plan = json\.dumps\(execution_plan or 'Start execution', ensure_ascii=False\)/g, "safe_exec_plan = json.dumps(execution_plan or 'Start execution')");
content = content.replace(/safe_exec_plan = json\.dumps\(exec_plan, ensure_ascii=False\)/g, "safe_exec_plan = json.dumps(exec_plan)");
fs.writeFileSync(path, content, 'utf8');
