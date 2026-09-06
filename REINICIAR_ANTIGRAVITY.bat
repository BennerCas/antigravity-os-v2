@echo off
echo ========================================================
echo Limpiando procesos huerfanos de Node/Vite (Antigravity)
echo ========================================================
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM chrome.exe >nul 2>&1

echo.
echo Iniciando Antigravity OS...
wscript.exe //nologo "%~dp0INICIAR.vbs"
echo.
echo Listo. La nueva version con el contenido completo cargara ahora.
pause
