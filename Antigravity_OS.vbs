' Antigravity OS v2
' Lanzador Maestro Silencioso
' Doble-clic para lanzar. No abre NINGUNA ventana de consola.
' ============================================================
Dim wsh, fso, scriptDir
Set wsh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

If Not fso.FileExists(scriptDir & "launcher.ps1") Then
    MsgBox "Error critico: No se encontro el archivo interno 'launcher.ps1'.", 16, "Error"
    WScript.Quit 1
End If

wsh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & scriptDir & "launcher.ps1""", 0, False

Set wsh = Nothing
Set fso = Nothing
