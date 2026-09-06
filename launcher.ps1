# ============================================================
# Antigravity OS - Launcher Unificado
# Ejecutado de forma invisible por INICIAR.vbs
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

$rootDir    = "C:\antigravityAS\Antigravity_OS_v2"
$webAppDir  = "$rootDir\apps\web-app"
$backendDir = "$rootDir\backend"
$port       = 5174
$url        = "http://localhost:$port"

# Ruta de Chrome (Beta). Si no existe usa el canal estable.
$chromePaths = @(
    "C:\Program Files\Google\Chrome Beta\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
$chromePath = $null
foreach ($p in $chromePaths) {
    if (Test-Path $p) { $chromePath = $p; break }
}

# Perfil PERSISTENTE en AppData: conserva localStorage (canvas, variantes, progreso)
# entre sesiones. Antes usaba $TEMP y se perdía todo lo generado al cerrar.
$chromeProfile = Join-Path $env:LOCALAPPDATA "AntigravityOS_v2\ChromeProfile"

# 🚀
# 0. Limpiar VRAM y Preparar Motor Híbrido (Benner AI / Hermes 3)
# 🚀
Write-Host "Limpiando VRAM de Ollama..."
taskkill /F /IM "ollama_llama_server.exe" 2>$null
taskkill /F /IM "ollama.exe" 2>$null
Start-Sleep -Seconds 1

Write-Host "Iniciando Benner AI (Ollama)..."
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Pre-cargar hermes3 en VRAM de forma asíncrona (Opcional, acelera la primera consulta)
Start-Process "powershell" -ArgumentList "-WindowStyle Hidden -Command `"$body = @{model='hermes3:8b'}; Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post -Body (\$body | ConvertTo-Json) -ContentType 'application/json' -ErrorAction SilentlyContinue`"" -WindowStyle Hidden

# ─────────────────────────────────────────────────────────────
# 1. Iniciar Backend (FastAPI) en segundo plano oculto
# ─────────────────────────────────────────────────────────────
$backend = $null
if (Test-Path "$backendDir\main.py") {
    $backend = Start-Process `
        -FilePath  "cmd.exe" `
        -ArgumentList "/c", "uvicorn main:app --port 8001 --reload" `
        -WorkingDirectory $backendDir `
        -WindowStyle Hidden `
        -PassThru
}

# ─────────────────────────────────────────────────────────────
# 2. Instalar dependencias si faltan (silencioso)
# ─────────────────────────────────────────────────────────────
if (-not (Test-Path "$webAppDir\node_modules")) {
    Start-Process `
        -FilePath  "cmd.exe" `
        -ArgumentList "/c", "npm install" `
        -WorkingDirectory $webAppDir `
        -WindowStyle Hidden `
        -Wait
}

# ─────────────────────────────────────────────────────────────
# 3. Iniciar Vite dev-server en segundo plano oculto
#    Se usa cmd /c con redirección para suprimir toda salida
# ─────────────────────────────────────────────────────────────
$frontend = Start-Process `
    -FilePath  "cmd.exe" `
    -ArgumentList "/c", "npx vite --port $port >nul 2>&1" `
    -WorkingDirectory $webAppDir `
    -WindowStyle Hidden `
    -PassThru

# ─────────────────────────────────────────────────────────────
# 4. Esperar a que Vite levante el servidor (poll con timeout)
# ─────────────────────────────────────────────────────────────
$maxWait   = 30  # segundos
$elapsed   = 0
$ready     = $false
while ($elapsed -lt $maxWait -and -not $ready) {
    Start-Sleep -Seconds 1
    $elapsed++
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true }
    } catch {}
}

# ─────────────────────────────────────────────────────────────
# 5. Abrir Chrome en modo App (sin barra de navegador)
#    --disable-extensions : evita que las extensiones del usuario se carguen
#    --user-data-dir      : perfil aislado → sin extensiones, sin primera ejecución
#    --app                : modo ventana de app (sin barra de dirección)
#    --start-maximized    : maximizado al abrir
#    --no-first-run       : no mostrar asistente de bienvenida
#    --no-default-browser-check: no preguntar si queremos que sea el predeterminado
# ─────────────────────────────────────────────────────────────
$chromeArgs = @(
    "--app=$url",
    "--user-data-dir=$chromeProfile",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-infobars",
    "--start-maximized"
)

if ($chromePath) {
    $browser = Start-Process -FilePath $chromePath -ArgumentList $chromeArgs -PassThru -Wait
} else {
    # Fallback: abrir con el navegador predeterminado del sistema sin kiosko
    Start-Process $url
    # Esperar indefinidamente si no hay Chrome
    while ($true) { Start-Sleep -Seconds 5 }
}

# ─────────────────────────────────────────────────────────────
# 6. El usuario cerró Chrome → apagar los servidores
# ─────────────────────────────────────────────────────────────
if ($frontend -and -not $frontend.HasExited) {
    taskkill /T /F /PID $frontend.Id 2>$null
}
if ($backend -and -not $backend.HasExited) {
    taskkill /T /F /PID $backend.Id 2>$null
}

# Matar cualquier proceso Vite/Node huérfano en el puerto
$portProcess = (netstat -ano | Select-String ":$port ") -replace '.*\s+(\d+)$', '$1' | Select-Object -First 1
if ($portProcess) { taskkill /F /PID $portProcess 2>$null }
