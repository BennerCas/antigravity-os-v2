# ============================================================
# Antigravity OS v2 - Launcher Unificado
# Ejecutado de forma invisible por INICIAR.vbs
#
# v2 (2026-09-14):
#  - Raiz derivada de la ubicacion del propio script (portable, sin C:\antigravityAS)
#  - Detecta .venv del backend; crea backend/.env desde .env.example si falta
#  - uvicorn con --reload-exclude sandbox/* : escribir runner.py ya NO reinicia el server
#  - Logs reales en logs\ (launcher, backend, frontend) - antes todo era >nul
#  - Vite con --strictPort (si 5174 esta ocupado, falla ruidoso en el log, no abre URL vacia)
#  - Espera health-check del backend (127.0.0.1:8001) antes de abrir Chrome
#  - Limpieza solo de los puertos del OS: no mata otros procesos Node del sistema
#  - Sin caracteres no-ASCII (a prueba de Windows PowerShell 5.1 sin BOM)
#
# Uso manual:  powershell -ExecutionPolicy Bypass -File launcher.ps1 [-NoOllamaReset]
# ============================================================
#requires -version 3
param(
    [switch]$NoOllamaReset,
    [string]$Root = $PSScriptRoot
)


# --- AUTO-ELEVACION A ADMINISTRADOR ---
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    $argsString = ""
    if ($NoOllamaReset) { $argsString += " -NoOllamaReset" }
    if ($Root) { $argsString += " -Root `"$Root`"" }
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`"$argsString" -Verb RunAs
    exit
}

$ErrorActionPreference = "SilentlyContinue"

# --- Rutas (todo relativo a donde vive este script) ---
if (-not $Root) { Write-Host "Ejecuta INICIAR.vbs o pasa -Root <dir>"; exit 1 }
$rootDir = if ((Resolve-Path $Root) -ne $null) { (Resolve-Path $Root).Path } else { Write-Host "Root no existe: $Root"; exit 1 }
$backendDir = Join-Path $rootDir "backend"
$webAppDir  = Join-Path $rootDir "apps\web-app"
$logDir     = Join-Path $rootDir "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$LogFile      = Join-Path $logDir "launcher.log"
$backendLog   = Join-Path $logDir "backend.log"
$frontendLog  = Join-Path $logDir "frontend.log"
$setupLog     = Join-Path $logDir "setup.log"

function Log { param($m)
    $s = "[" + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + "] " + $m
    Write-Host $m
    Add-Content -Path $LogFile -Value $s
}

$backendPort = 8001
$port        = 5174
$url         = "http://localhost:$port"
$apiUrl      = "http://127.0.0.1:$backendPort"
$ollamaUrl   = "http://127.0.0.1:11434"

# --- Chrome en modo App con perfil aislado (conserva localStorage) ---
$chromePaths = @(
    "C:\Program Files\Google\Chrome Beta\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
$chromePath = $null
foreach ($p in $chromePaths) { if (Test-Path $p) { $chromePath = $p; break } }
$chromeProfile = Join-Path $env:LOCALAPPDATA "AntigravityOS_v2\ChromeProfile"

# --- Python del backend: .venv local > venv raiz > python del PATH ---
$py = $null
foreach ($c in @(
    (Join-Path $backendDir ".venv\Scripts\python.exe"),
    (Join-Path $rootDir   ".venv\Scripts\python.exe"),
    (Join-Path $rootDir   "venv\Scripts\python.exe")
)) { if (Test-Path $c) { $py = $c; break } }
if (-not $py) { $g = Get-Command python.exe -ErrorAction SilentlyContinue; if ($g) { $py = $g.Source } }

# --- Deps del backend (solo si faltan; sin pins aun: audit C pendiente) ---
if ($py -and (Test-Path "$backendDir\requirements.txt")) {
    & $py -c "import fastapi, uvicorn" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Log "Faltan dependencias del backend: instalando (tarda lo primero)..."
        & $py -m pip install -r "$backendDir\requirements.txt" *>> $setupLog
    }
}

# --- backend/.env: no fallar en limpio; crear template desde .env.example ---
if (-not (Test-Path "$backendDir\.env") -and (Test-Path "$backendDir\.env.example")) {
    Copy-Item "$backendDir\.env.example" "$backendDir\.env"
    Log "backend\.env creado desde .env.example - edita tus API keys cuando puedas"
}

# ============================================================
# 0. VRAM y Motor Local (Ollama + AMD RDNA3 Shield)
# ============================================================
function OllamaUp {
    try { $null = Invoke-RestMethod "$ollamaUrl/api/tags" -TimeoutSec 2; $true } catch { $false }
}

# BUG FIX 3: Declarar $ollamaProc FUERA del bloque if para que el shutdown lo vea
$ollamaProc = $null

if (-not $NoOllamaReset) {
    # Matar cualquier instancia previa limpiamente
    taskkill /F /IM "ollama app.exe"         2>$null | Out-Null
    taskkill /F /IM ollama_llama_server.exe 2>$null | Out-Null
    taskkill /F /IM ollama.exe               2>$null | Out-Null
    Start-Sleep -Seconds 2

    Log "Iniciando Ollama con escudo AMD RDNA3 (ROCm + iGPU)..."
    # Variables OBLIGATORIAS para AMD Radeon 860M
    $env:OLLAMA_IGPU_ENABLE       = "1"
    $env:OLLAMA_NUM_PARALLEL      = "1"
    $env:OLLAMA_KEEP_ALIVE        = "10m"

    # Arrancar SIN ventana de consola visible
    $ollamaProc = Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden -PassThru

    # Esperar hasta que Ollama responda - hasta 45s (primera carga en AMD puede tardar)
    Log "Esperando que Ollama levante (hasta 45s)..."
    $w = 0; while (-not (OllamaUp) -and $w -lt 45) { Start-Sleep -Seconds 1; $w++ }

    if (OllamaUp) {
        Log "Ollama activo en $ollamaUrl. Pre-calentando hermes3:8b..."

        # BUG FIX 1: Usar archivo temporal en lugar de string con \" (escape invalido en PS)
        # \"..\" dentro de una double-quoted string en PS no es escape valido - termina el string
        $preloadScript = Join-Path $env:TEMP "ag_preload_hermes.ps1"
        $preloadBody   = '{"model":"hermes3:8b","prompt":" ","keep_alive":"30m"}'
        Set-Content -Path $preloadScript -Value @"
try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/generate' -Method Post ``
        -Body '$preloadBody' -ContentType 'application/json' -TimeoutSec 300
} catch {
    Write-Host "Precarga hermes3 fallo: `$(`$_.Exception.Message)"
}
"@
        Start-Process "powershell" -WindowStyle Hidden -ArgumentList "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$preloadScript`""
        Log "Precarga iniciada (hermes3:8b). La primera consulta puede tardar 30-60s."
    } else {
        Log "AVISO: Ollama no respondio en 45s. Continuando sin motor local (usara Free.AI)."
    }
}

# ============================================================
# 1. Backend FastAPI (127.0.0.1:8001, reload sin watchear sandbox)
# ============================================================
$backend = $null
if ($py -and (Test-Path "$backendDir\main.py")) {
    $cmdline = "/c chcp 65001>nul & `"$py`" -m uvicorn main:app --host 127.0.0.1 --port $backendPort --reload --reload-exclude `"sandbox/*`" --reload-exclude `"sandbox\*`" --reload-exclude `"..\apps\*`" --reload-exclude `"apps/*`" --reload-exclude `"dist/*`" >> `"$backendLog`" 2>&1"
    $backend = Start-Process "cmd.exe" -ArgumentList $cmdline -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru
    Log "Backend lanzado en puerto $backendPort (log: logs\backend.log)"
} else {
    Log "AVISO: no lance el backend (python o main.py no encontrados)"
}

# ============================================================
# 2. Dependencias del frontend si faltan (silencioso)
# ============================================================
if (-not (Test-Path "$webAppDir\node_modules")) {
    Log "npm install del web-app (puede tardar varios minutos)..."
    Start-Process "cmd.exe" -ArgumentList "/c npm install --no-audit --no-fund >> `"$setupLog`" 2>&1" -WorkingDirectory $webAppDir -WindowStyle Hidden -Wait
}

# ============================================================
# 3. Vite dev-server en 5174 (proxy /api -> 8001, ver vite.config.ts)
# ============================================================
$frontend = Start-Process "cmd.exe" -ArgumentList "/c npx vite --port $port --strictPort >> `"$frontendLog`" 2>&1" -WorkingDirectory $webAppDir -WindowStyle Hidden -PassThru

# ============================================================
# 4. Health-checks antes de abrir la UI
# ============================================================
$apiReady = $false; $t = 0
while ($t -lt 30 -and -not $apiReady) {
    Start-Sleep -Seconds 1; $t++
    try { $r = Invoke-WebRequest "$apiUrl/" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
          if ($r.StatusCode -eq 200) { $apiReady = $true } } catch {}
}
if ($apiReady) { Log "Backend OK en $apiUrl" } else { Log "AVISO: backend sin responder tras 30s - revisa logs\backend.log" }

$feReady = $false; $t = 0
while ($t -lt 45 -and -not $feReady) {
    Start-Sleep -Seconds 1; $t++
    try { $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
          if ($r.StatusCode -eq 200) { $feReady = $true } } catch {}
}
if ($feReady) { Log "Frontend OK en $url" } else { Log "AVISO: Vite sin responder tras 45s - revisa logs\frontend.log" }

# ============================================================
# 5. Chrome modo App (sin barra); fallback al navegador del sistema
# ============================================================
$chromeArgs = @(
    "--app=$url",
    "--user-data-dir=$chromeProfile",
    "--no-first-run",
    "--no-default-browser-check",
    "--start-maximized"
)

if ($chromePath) {
    Start-Process -FilePath $chromePath -ArgumentList $chromeArgs -PassThru -Wait | Out-Null
} else {
    Log "Chrome no encontrado: abriendo navegador predeterminado"
    Start-Process $url
    while ($frontend -and -not $frontend.HasExited) { Start-Sleep -Seconds 5 }
}

# ============================================================
# 6. El usuario cerro la ventana -> apagar SOLO lo de Antigravity
# ============================================================
# BUG FIX 2: Incluir $ollamaProc en el shutdown para que cierre limpio con la app
foreach ($proc in @($frontend, $backend, $ollamaProc)) {
    if ($proc -and -not $proc.HasExited) { taskkill /T /F /PID $proc.Id 2>$null | Out-Null }
}
foreach ($pt in @($port, $backendPort)) {
    foreach ($ln in ((netstat -ano) | Select-String ":$pt .*LISTENING")) {
        $cols = ($ln.ToString() -split '\s+') | Where-Object { $_ }
        $ownerPid = $cols[-1]
        if ($ownerPid -match '^\d+$' -and [int]$ownerPid -gt 4) { taskkill /F /PID $ownerPid 2>$null | Out-Null }
    }
}
Log "Antigravity OS detenido."

