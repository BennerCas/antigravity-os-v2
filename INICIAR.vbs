' ============================================================
' INICIAR.vbs  -  Antigravity OS
' Doble-clic para lanzar. No abre NINGUNA ventana de consola.
' ============================================================
Dim wsh
Set wsh = CreateObject("WScript.Shell")

' WindowStyle 0 = completamente oculto (sin parpadeo de consola)
wsh.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File """ _
    & Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) _
    & "launcher.ps1""", 0, False

Set wsh = Nothing
