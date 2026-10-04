import asyncio
import json
import os
import sys
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.healer import auto_heal_script

router = APIRouter()


@router.websocket("/ws/execute")
async def execute_script(websocket: WebSocket):
    await websocket.accept()
    try:
        # Wait for trigger message
        data = await websocket.receive_text()
        trigger = False

        try:
            payload = json.loads(data)
            if payload.get("command") == "run":
                trigger = True
        except json.JSONDecodeError:
            if data.strip() == "run":
                trigger = True

        if trigger:
            max_retries = 3
            attempts = 0

            while attempts <= max_retries:

                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                runner_path = os.path.join(base_dir, "sandbox", "runner.py")

                import subprocess
                import threading

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
                            errors="replace",
                        )
                        for line in iter(proc.stdout.readline, ""):
                            if line:
                                asyncio.run_coroutine_threadsafe(
                                    queue.put(("data", line)), loop
                                )
                        proc.stdout.close()
                        proc.wait()
                        asyncio.run_coroutine_threadsafe(
                            queue.put(("done", proc.returncode)), loop
                        )
                    except Exception as exc:
                        asyncio.run_coroutine_threadsafe(
                            queue.put(("error", str(exc))), loop
                        )

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
                        await websocket.send_text(
                            f"[SYSTEM-ERROR] Thread error: {msg_content}"
                        )
                        break

                if returncode == 0:
                    await websocket.send_text(
                        f"[DONE] Process exited with code {returncode}"
                    )
                    try:
                        import db

                        db.execution_log(
                            framework="langgraph",
                            model_used="hybrid",
                            exit_code=returncode,
                            log="".join(stderr_output),
                        )
                    except Exception:
                        pass
                    break
                else:
                    if attempts < max_retries:
                        await websocket.send_text(
                            "[HEALING] Error detectado. Iniciando Auto-Curación IA..."
                        )

                        runner_path = os.path.join(
                            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "sandbox",
                            "runner.py",
                        )
                        if os.path.exists(runner_path):
                            with open(runner_path, "r", encoding="utf-8") as f:
                                code = f.read()

                            error_text = "".join(stderr_output)
                            fixed_code = await auto_heal_script(code, error_text)

                            with open(runner_path, "w", encoding="utf-8") as f:
                                f.write(fixed_code)

                        attempts += 1
                    else:
                        await websocket.send_text("[HEALING-FAILED]")
                        try:
                            import db

                            db.execution_log(
                                framework="unknown",
                                model_used="hybrid",
                                exit_code=returncode,
                                log="".join(stderr_output),
                            )
                        except Exception:
                            pass
                        break
        else:
            await websocket.send_text("[ERROR] Invalid trigger message")
            await websocket.close()

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        err_msg = traceback.format_exc()
        print(f"Error during execution: {err_msg}")
        try:
            await websocket.send_text(f"[SYSTEM-ERROR] {type(e).__name__}: {e!s}")
        except:
            pass
