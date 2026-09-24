import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_startup = """@app.on_event("startup")
async def startup_event():
    import db
    db.init_db()"""

new_startup = """def _ensure_amd_acceleration():
    # Establece las variables de entorno para esta y cualquier sub-procesos
    os.environ["OLLAMA_IGPU_ENABLE"] = "1"
    os.environ["HSA_OVERRIDE_GFX_VERSION"] = "11.0.0"
    
    # Reinicia ollama silenciosamente en background
    import subprocess
    try:
        subprocess.run(["powershell", "-Command", "Stop-Process -Name 'ollama', 'ollama app' -Force -ErrorAction SilentlyContinue"], check=False)
        ollama_path = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
        if not os.path.exists(ollama_path):
            ollama_path = "ollama"
        subprocess.Popen(
            [ollama_path, "serve"],
            env=os.environ,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("[GPU] Aceleracion AMD RDNA3 inyectada y servicio Ollama reiniciado.")
    except Exception as e:
        print(f"[GPU] Error al inyectar AMD RDNA3: {e}")

@app.on_event("startup")
async def startup_event():
    _ensure_amd_acceleration()
    import db
    db.init_db()"""

if old_startup in content:
    content = content.replace(old_startup, new_startup)
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Modificado main.py!")
else:
    print("No se encontro old_startup")
