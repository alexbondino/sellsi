# ============================================================================
# Script: Cambiar entre entornos (Staging/Production)
# ============================================================================
# Uso:
#   .\switch-env.ps1 production    # Cambia a producción
#   .\switch-env.ps1 staging       # Cambia a staging
#   .\switch-env.ps1               # Muestra entorno actual
# ============================================================================

param(
    [Parameter(Position=0)]
    [ValidateSet('staging', 'production', '')]
    [string]$Environment = ''
)

$EnvFile = ".env"
$StagingFile = ".env.staging"
$ProductionFile = ".env.production"

function Show-CurrentEnvironment {
    if (Test-Path $EnvFile) {
        $content = Get-Content $EnvFile -Raw
        if ($content -match "clbngnjetipglkikondm") {
            Write-Host "[STAGING] ENTORNO ACTUAL: STAGING" -ForegroundColor Cyan
        } elseif ($content -match "kaxjvxfddrfoixxmxgfc") {
            Write-Host "[PRODUCTION] ENTORNO ACTUAL: PRODUCTION" -ForegroundColor Red
        } else {
            Write-Host "[?] ENTORNO DESCONOCIDO" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[X] Archivo .env no encontrado" -ForegroundColor Red
    }
}

function Switch-Environment {
    param([string]$Target)
    
    $SourceFile = if ($Target -eq 'production') { $ProductionFile } else { $StagingFile }
    
    if (-not (Test-Path $SourceFile)) {
        Write-Host "❌ Error: Archivo $SourceFile no encontrado" -ForegroundColor Red
        exit 1
    }
    
    # Backup del .env actual
    $BackupFile = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    if (Test-Path $EnvFile) {
        Copy-Item $EnvFile $BackupFile
        Write-Host "[BACKUP] Backup creado: $BackupFile" -ForegroundColor Gray
    }
    
    # Copiar el archivo de entorno correspondiente
    Copy-Item $SourceFile $EnvFile -Force
    
    $Color = if ($Target -eq 'production') { 'Red' } else { 'Cyan' }
    $Prefix = if ($Target -eq 'production') { '[PROD]' } else { '[STAGE]' }
    $TargetUpper = $Target.ToUpper()
    
    Write-Host ""
    Write-Host "$Prefix ============================================" -ForegroundColor $Color
    Write-Host "$Prefix   ENTORNO CAMBIADO A: $TargetUpper" -ForegroundColor $Color
    Write-Host "$Prefix ============================================" -ForegroundColor $Color
    Write-Host ""
    Write-Host "[!] RECUERDA: Reinicia el servidor de desarrollo" -ForegroundColor Yellow
    Write-Host ""
}

# Main
if ($Environment -eq '') {
    Show-CurrentEnvironment
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor White
    Write-Host "  .\switch-env.ps1 staging      # Cambiar a staging" -ForegroundColor Gray
    Write-Host "  .\switch-env.ps1 production   # Cambiar a producción" -ForegroundColor Gray
} else {
    Switch-Environment -Target $Environment
}
