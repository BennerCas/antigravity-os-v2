import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\execute.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

old_nodedata = """class NodeData(BaseModel):
    id: str
    title: str = "Sin Título"
    content: str = ""
    role: str = "Default Agent"
    framework: str = "auto"
    type: str = "mainPrompt\""""

new_nodedata = """class NodeData(BaseModel):
    id: str
    title: str = "Sin Título"
    content: str = ""
    role: str = "Default Agent"
    framework: str = "auto"
    type: str = "mainPrompt"
    variables: str = ""
    llm_model: str = "hermes3:8b"
    temperature: float = 0.7
    output_schema: str = '{"type": "object"}'"""

content = content.replace(old_nodedata, new_nodedata)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("NodeData updated.")
