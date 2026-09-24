with open('backend/routers/studio.py', 'a', encoding='utf-8') as f:
    f.write('''\n@router.post("/amd-gpu/activate")
async def activate_amd_gpu():
    import subprocess
    import os
    try:
        subprocess.run(["powershell", "-Command", "Stop-Process -Name 'ollama', 'ollama app' -Force -ErrorAction SilentlyContinue"], check=False)
        env = os.environ.copy()
        env["OLLAMA_IGPU_ENABLE"] = "1"
        env["HSA_OVERRIDE_GFX_VERSION"] = "11.0.0"
        ollama_path = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
        if not os.path.exists(ollama_path):
            ollama_path = "ollama"
        subprocess.Popen(
            [ollama_path, "serve"],
            env=env,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return {"status": "success", "message": "Ollama reiniciado con aceleracion AMD RDNA3 (IGPU=1, GFX=11.0.0)"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
''')
