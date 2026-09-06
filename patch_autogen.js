const fs = require('fs');
const path = 'backend/routers/compiler.py';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
/code\.append\(f'''\{user_proxy\} = autogen\.UserProxyAgent\(\n    name="\{title\}",\n    system_message="\{content\}",/g,
`safe_title = json.dumps(title)
            safe_content = content
            code.append(f'''{user_proxy} = autogen.UserProxyAgent(
    name={safe_title},
    system_message={safe_content},`
);

content = content.replace(
/code\.append\(f'''\{assistant\} = autogen\.AssistantAgent\(\n    name="\{title\}",\n    llm_config=llm_config,\n    system_message="\{content\}"/g,
`safe_title = json.dumps(title)
            safe_content = content
            code.append(f'''{assistant} = autogen.AssistantAgent(
    name={safe_title},
    llm_config=llm_config,
    system_message={safe_content}`
);

content = content.replace(
/code\.append\(f"    \{user_proxy\}\.initiate_chat\(\{assistants\[0\]\}, message='\{exec_plan\}'\)"\)/g,
`safe_exec_plan = json.dumps(exec_plan)
        code.append(f"    {user_proxy}.initiate_chat({assistants[0]}, message={safe_exec_plan})")`
);


fs.writeFileSync(path, content, 'utf8');
