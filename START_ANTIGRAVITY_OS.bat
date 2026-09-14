@echo off
:: Antigravity OS v2 - lanzador silencioso (INICIAR.vbs -> launcher.ps1)
:: Verifica ubicacion antes de lanzar para no abrir una consola con error.
if not exist "%~dp0INICIAR.vbs" (
    echo [Antigravity OS] Falta INICIAR.vbs en esta carpeta.
    echo Ejecutalo desde la raiz del repositorio.
    pause
    exit /b 1
)
wscript.exe //nologo "%~dp0INICIAR.vbs"
