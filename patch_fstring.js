const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

// Fix Agent appending
content = content.replace(
/code\.append\(f'''agent_\{i\} = Agent\(\n    role="\{role\}",\n    goal="\{content\}",\n    backstory="You are an expert \{role\}\.",/g,
`// Safe serialization
        safe_role = json.dumps(role)
        safe_goal = content # Already json.dumps
        safe_backstory = json.dumps(f"You are an expert {role}.")
        
        code.append(f'''agent_{i} = Agent(
    role={safe_role},
    goal={safe_goal},
    backstory={safe_backstory},`
);

// Fix Task appending
content = content.replace(
/code\.append\(f'''task_\{i\} = Task\(\n    description="\{title\}: \{content\}",\n    expected_output="Appropriate result for \{title\}",/g,
`// Safe serialization
        safe_desc = json.dumps(f"{title}: " + json.loads(content))
        safe_expected = json.dumps(f"Appropriate result for {title}")
        
        code.append(f'''task_{i} = Task(
    description={safe_desc},
    expected_output={safe_expected},`
);

fs.writeFileSync(path, content, 'utf8');
