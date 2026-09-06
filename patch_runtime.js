const fs = require('fs');
const path = 'backend/routers/runtime.py';
let content = fs.readFileSync(path, 'utf8');

const regex = /process = await asyncio\.create_subprocess_exec\([\s\S]*?if process\.returncode == 0:/m;

const replacement = `
                import threading
                import subprocess
                
                loop = asyncio.get_running_loop()
                queue = asyncio.Queue()
                
                def run_subprocess():
                    try:
                        proc = subprocess.Popen(
                            [sys.executable, runner_path],
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            text=True,
                            encoding="utf-8",
                            errors="replace"
                        )
                        for line in iter(proc.stdout.readline, ''):
                            if line:
                                asyncio.run_coroutine_threadsafe(queue.put(("data", line)), loop)
                        proc.stdout.close()
                        proc.wait()
                        asyncio.run_coroutine_threadsafe(queue.put(("done", proc.returncode)), loop)
                    except Exception as exc:
                        asyncio.run_coroutine_threadsafe(queue.put(("error", str(exc))), loop)

                thread = threading.Thread(target=run_subprocess)
                thread.start()
                
                stderr_output = []
                returncode = -1
                
                while True:
                    msg_type, msg_content = await queue.get()
                    if msg_type == "data":
                        stderr_output.append(msg_content)
                        await websocket.send_text(msg_content)
                    elif msg_type == "done":
                        returncode = msg_content
                        break
                    elif msg_type == "error":
                        await websocket.send_text(f"[SYSTEM-ERROR] Thread error: {msg_content}")
                        break
                
                if returncode == 0:`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
