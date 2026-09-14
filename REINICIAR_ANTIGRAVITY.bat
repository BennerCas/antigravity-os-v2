@echo off
:: ============================================================
:: Antigravity OS v2 - Reinicio seguro
:: Mata SOLO lo del OS: los procesos escuchando 5174 (Vite) y
:: 8001 (FastAPI), y las ventanas Chrome del perfil aislado
:: AntigravityOS_v2.  NO toca tu navegador completo ni otros
:: procesos Node del sistema (antes: taskkill /IM node.exe y
:: /IM chrome.exe a discrecion).
:: ============================================================
echo ========================================================
echo Antigravity OS - reinicio seguro
echo ========================================================

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":5174 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r ":8001 .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: Chrome de la app: solo instancias con el perfil aislado en la linea de mando
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='chrome.exe'\" | Where-Object { $_.CommandLine -like '*AntigravityOS_v2*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" 2>nul

echo.
echo Iniciando Antigravity OS v2...
wscript.exe //nologo "%~dp0INICIAR.vbs"
echo.
echo Listo. Si no aparece la ventana, revisa logs\launcher.log y logs\frontend.log
timeout /t 4 >nul
