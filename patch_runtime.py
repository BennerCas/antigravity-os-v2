import codecs
import os

file_path = r'C:\antigravityAS\Antigravity_OS\backend\routers\runtime.py'
with codecs.open(file_path, 'r', 'utf-8') as f:
    content = f.read()

# Replace python subprocess execution
old_exec = 'process = await asyncio.create_subprocess_exec(\n                    "python", "sandbox/runner.py",'
new_exec = '''
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                runner_path = os.path.join(base_dir, "sandbox", "runner.py")
                process = await asyncio.create_subprocess_exec(
                    "python", runner_path,
'''
content = content.replace(old_exec, new_exec)

# Replace the healing file read logic
old_heal = 'runner_path = "sandbox/runner.py"'
new_heal = 'runner_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sandbox", "runner.py")'
content = content.replace(old_heal, new_heal)

# Let's also catch exceptions in the websocket endpoint and stream them so the UI doesn't just say "Conexión cerrada."
content = content.replace(
    'except Exception as e:\n        print(f"Error during execution: {e}")',
    'except Exception as e:\n        print(f"Error during execution: {e}")\n        try:\n            await websocket.send_text(f"[SYSTEM-ERROR] {e}")\n        except:\n            pass'
)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(content)
print("runtime.py fixed.")
