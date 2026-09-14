' Antigravity OS v2
' Lanzador Maestro Silencioso
' Doble-clic para lanzar. No abre NINGUNA ventana de consola.
' Ejecuta el sistema completo y limpia procesos huérfanos antes de arrancar.
' ============================================================
Dim wsh, fso, scriptDir
Set wsh = CreateObject(""WScript.Shell"")
Set fso = CreateObject(""Scripting.FileSystemObject"")

scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, ""\""))

If Not fso.FileExists(scriptDir & ""launcher.ps1"") Then
    MsgBox ""Error crítico: No se encontró el archivo interno 'launcher.ps1' en la misma carpeta."" & vbCrLf & _
           ""Asegúrate de ejecutar esto desde la raíz del repositorio de Antigravity OS."", _
           16, ""Antigravity OS - Error""
    WScript.Quit 1
End If

' 1. Limpieza preventiva silenciosa (por si quedó alguna sesión colgada)
' Mata procesos escuchando en 5174 y 8001
wsh.Run ""powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""foreach( in @(5174,8001)){ foreach( in ((netstat -ano) | Select-String \\\": .*LISTENING\\\")){  = (.ToString() -split '\s+') | Where-Object { $_ }; 43908 = [-1]; if(43908 -match '^\d+$' -and [int]43908 -gt 4){ taskkill /F /PID 43908 2> | Out-Null } } }"""", 0, True

' Mata instancias de Chrome del perfil de Antigravity
wsh.Run ""powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command ""Get-CimInstance Win32_Process -Filter 'Name=''chrome.exe''' | Where-Object { $_ .CommandLine -like '*AntigravityOS_v2*' } | ForEach-Object { Stop-Process -Id $_ .ProcessId -Force }"""", 0, True

' 2. Arranque del sistema maestro
' WindowStyle 0 = completamente oculto (sin parpadeo de consola)
wsh.Run ""powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """""" & scriptDir & ""launcher.ps1"""""""", 0, False

Set wsh = Nothing
Set fso = Nothing
