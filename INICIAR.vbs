' Antigravity OS v2
' Doble-clic para lanzar. No abre NINGUNA ventana de consola.
' Busca launcher.ps1 a su lado: el repo puede vivir en cualquier
' carpeta (antes dependia de rutas fijas C:\antigravityAS).
' Si ya hay una instancia, Vite fallara por --strictPort y lo veras
' en logs\frontend.log (nada de servidores doblados en silencio).
' ============================================================
Dim wsh, fso, scriptDir
Set wsh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

If Not fso.FileExists(scriptDir & "launcher.ps1") Then
    MsgBox "No se encontro launcher.ps1 junto a INICIAR.vbs." & vbCrLf & _
           "Ejecuta estos archivos desde la raiz del repositorio Antigravity_OS_v2.", _
           vbCritical, "Antigravity OS"
    WScript.Quit 1
End If

' WindowStyle 0 = completamente oculto (sin parpadeo de consola)
wsh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "launcher.ps1""", 0, False

Set wsh = Nothing
Set fso = Nothing
