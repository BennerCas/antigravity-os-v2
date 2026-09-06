import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\compiler.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_logic = """    if framework == "crewai":
        script_content = generate_crewai_code(request.nodes, request.edges, request.execution_plan)
    elif framework == "autogen":
        script_content = generate_autogen_code(request.nodes, request.edges, request.execution_plan)
    else:
        script_content = f"# Generated script for framework: {framework}\\nprint('Not implemented for this framework')\""""

new_logic = """    if framework == "autogen":
        script_content = generate_autogen_code(request.nodes, request.edges, request.execution_plan)
    else:
        # Default to crewai for 'auto' or unrecognized frameworks
        script_content = generate_crewai_code(request.nodes, request.edges, request.execution_plan)"""

content = content.replace(old_logic, new_logic)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("compiler.py logic fixed.")
