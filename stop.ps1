Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   APAGANDO ANTIGRAVITY OS & LIBERANDO VRAM  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Deteniendo procesos de backend (Python) y frontend (Node)..." -ForegroundColor Yellow

# Detenemos procesos de Python (Backend) y Node (Frontend)
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "      -> Procesos detenidos." -ForegroundColor Green
Write-Host ""

Write-Host "[2/2] Escaneando Ollama para liberar memoria de GPU (VRAM)..." -ForegroundColor Yellow

try {
    # Consultamos a Ollama qué modelos están ocupando la VRAM actualmente
    $psResponse = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/ps" -Method Get -ErrorAction Stop
    $models = $psResponse.models
    
    if ($models -and $models.Count -gt 0) {
        foreach ($model in $models) {
            $modelName = $model.name
            Write-Host "      -> Expulsando modelo de la VRAM: $modelName ..." -ForegroundColor Magenta
            
            # Al enviar keep_alive = 0, Ollama purga inmediatamente el modelo de la memoria de video
            $body = @{
                model = $modelName
                keep_alive = 0
            } | ConvertTo-Json
            
            Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
        }
        Write-Host "      -> VRAM liberada exitosamente." -ForegroundColor Green
    } else {
        Write-Host "      -> La VRAM ya estaba limpia. Ningún modelo ocupando memoria." -ForegroundColor Green
    }
} catch {
    Write-Host "      -> Ollama no está corriendo. VRAM segura." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   APAGADO COMPLETO. SISTEMA LIMPIO.         " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
