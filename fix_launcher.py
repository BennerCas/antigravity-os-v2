with open('launcher.ps1', 'r', encoding='utf-8') as f:
    ps1 = f.read()

ps1 = ps1.replace('npx vite --port  >nul 2>&1', 'npx vite --port  --force >nul 2>&1')

with open('launcher.ps1', 'w', encoding='utf-8') as f:
    f.write(ps1)

print("Launcher updated with --force")
