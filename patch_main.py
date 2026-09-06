import codecs

file_path = r'C:\antigravityAS\Antigravity_OS\backend\main.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

content = content.replace(
    'from routers import execute, search, prompts, builder_actions, vault',
    'from routers import execute, search, prompts, builder_actions, vault, compiler, runtime'
)

content = content.replace(
    'app.include_router(vault.router, prefix="/api/v1")',
    'app.include_router(vault.router, prefix="/api/v1")\napp.include_router(compiler.router, prefix="/api/v1")\napp.include_router(runtime.router, prefix="/api/v1")'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("Updated main.py")
