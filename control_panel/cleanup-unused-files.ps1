# Script para eliminar archivos no utilizados del control_panel
# Fecha: 2025-12-10
# Verificado mediante análisis exhaustivo de imports

Write-Host "🧹 Iniciando limpieza de archivos no utilizados en control_panel..." -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot
$filesDeleted = 0
$directoriesDeleted = 0
$errors = @()

# Lista de archivos a eliminar
$filesToDelete = @(
    # Componentes
    "src\components\BanGuard.jsx",
    "src\components\CachePerformanceDashboard.jsx",
    "src\components\LazyPDFRenderer.jsx",
    "src\components\ProductImageWithFallback.jsx",
    
    # Hooks principales
    "src\hooks\useOfferTimer.js",
    "src\hooks\useOptimizedUserShippingRegion.js",
    "src\hooks\usePhase1DevMetrics.js",
    "src\hooks\usePrefetch.js",
    "src\hooks\usePrefetch.original.js",
    "src\hooks\usePrefetch.simplified.js",
    "src\hooks\useSafeProductImage.js",
    "src\hooks\useForceImageRefresh.js",
    "src\hooks\useEnhancedThumbnail.js",
    "src\hooks\useLazyImage.js",
    "src\hooks\useBanStatus.js",
    
    # Hooks de profile
    "src\hooks\profile\useBillingInfoValidation.js",
    "src\hooks\profile\useShippingInfoValidation.js",
    
    # Hooks de shipping
    "src\hooks\shipping\useUnifiedShippingValidation.js",
    
    # Utilidades
    "src\utils\businessDaysChile.js",
    "src\utils\cartEmergencyTools.js",
    "src\utils\imageCacheBuster.js",
    "src\utils\imageHelpers.js",
    "src\utils\ipTrackingTests.js",
    "src\utils\priceCalculation.js",
    "src\utils\productActiveStatus.js",
    "src\utils\profileDiagnostic.js",
    "src\utils\profileHelpers.js",
    "src\utils\quantityValidation.js",
    "src\utils\shippingCalculation.js",
    "src\utils\shippingRegionsUtils.js",
    "src\utils\toastHelpers.js",
    "src\utils\smartMetricCache.js",
    
    # Servicios
    "src\services\phase1ETAGThumbnailService.js",
    "src\services\security\banService.js",
    "src\services\user\profileService.js"
)

# Directorios a eliminar
$directoriesToDelete = @(
    "src\shared\thumbnail",
    "src\hooks\profile",
    "src\hooks\shipping",
    "src\services\user"
)

Write-Host "📋 Archivos a eliminar: $($filesToDelete.Count)" -ForegroundColor Yellow
Write-Host "📋 Directorios a eliminar: $($directoriesToDelete.Count)" -ForegroundColor Yellow
Write-Host ""

# Eliminar archivos
Write-Host "🗑️  Eliminando archivos..." -ForegroundColor Cyan
foreach ($file in $filesToDelete) {
    $fullPath = Join-Path $baseDir $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "  ✅ Eliminado: $file" -ForegroundColor Green
            $filesDeleted++
        }
        catch {
            $errorMsg = "  ❌ Error al eliminar: $file - $_"
            Write-Host $errorMsg -ForegroundColor Red
            $errors += $errorMsg
        }
    }
    else {
        Write-Host "  ⚠️  No encontrado: $file" -ForegroundColor Yellow
    }
}

Write-Host ""

# Eliminar directorios vacíos o completos
Write-Host "📁 Eliminando directorios..." -ForegroundColor Cyan
foreach ($dir in $directoriesToDelete) {
    $fullPath = Join-Path $baseDir $dir
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Recurse -Force
            Write-Host "  ✅ Eliminado: $dir" -ForegroundColor Green
            $directoriesDeleted++
        }
        catch {
            $errorMsg = "  ❌ Error al eliminar: $dir - $_"
            Write-Host $errorMsg -ForegroundColor Red
            $errors += $errorMsg
        }
    }
    else {
        Write-Host "  ⚠️  No encontrado: $dir" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMEN DE LIMPIEZA" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Archivos eliminados: $filesDeleted" -ForegroundColor Green
Write-Host "  Directorios eliminados: $directoriesDeleted" -ForegroundColor Green
if ($errors.Count -gt 0) {
    Write-Host "  Errores: $($errors.Count)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Detalles de errores:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host $error -ForegroundColor Red
    }
}
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Limpieza completada!" -ForegroundColor Green
Write-Host ""
