# Script para calcular el tamaño total de cada ruta (página)
# Lee el manifest.json y suma todos los chunks que se cargan en cada ruta

$manifest = Get-Content "dist/.vite/manifest.json" | ConvertFrom-Json
$sizes = Get-Content "chunk-sizes.json" | ConvertFrom-Json

# Función para obtener el tamaño de un chunk por su hash
function Get-ChunkSize {
    param($importName)
    
    # Buscar el archivo correspondiente en el manifest
    $entry = $manifest.PSObject.Properties | Where-Object { $_.Value.file -like "*$importName*" } | Select-Object -First 1
    
    if ($entry) {
        $fileName = Split-Path $entry.Value.file -Leaf
        return $sizes.$fileName
    }
    
    # Si no se encuentra en manifest, buscar directamente por nombre
    $matchingFile = $sizes.PSObject.Properties | Where-Object { $_.Name -like "*$importName*" } | Select-Object -First 1
    if ($matchingFile) {
        return $matchingFile.Value
    }
    
    return 0
}

# Función para calcular tamaño total de una ruta
function Get-RouteSize {
    param($routeName)
    
    $route = $manifest.PSObject.Properties | Where-Object { $_.Name -eq $routeName } | Select-Object -First 1
    
    if (-not $route) {
        Write-Host "Ruta no encontrada: $routeName" -ForegroundColor Red
        return $null
    }
    
    $totalSize = 0
    $chunks = @()
    
    # Tamaño del chunk principal
    $mainFileName = Split-Path $route.Value.file -Leaf
    $mainSize = $sizes.$mainFileName
    $totalSize += $mainSize
    $chunks += [PSCustomObject]@{
        Name = $mainFileName
        Size = $mainSize
    }
    
    # Sumar todos los imports
    if ($route.Value.imports) {
        foreach ($import in $route.Value.imports) {
            if ($import -eq "index.html") { continue }
            
            $importEntry = $manifest.PSObject.Properties | Where-Object { $_.Name -like "*$import*" } | Select-Object -First 1
            if ($importEntry) {
                $fileName = Split-Path $importEntry.Value.file -Leaf
                $size = $sizes.$fileName
                if ($size -gt 0) {
                    $totalSize += $size
                    $chunks += [PSCustomObject]@{
                        Name = $fileName
                        Size = $size
                    }
                }
            }
        }
    }
    
    return [PSCustomObject]@{
        Route = $routeName
        TotalKB = [math]::Round($totalSize, 2)
        ChunkCount = $chunks.Count
        Chunks = $chunks | Sort-Object Size -Descending
    }
}

Write-Host "`n=== BUYER ROUTES ===" -ForegroundColor Cyan

# Marketplace
$marketplace = Get-RouteSize "src/workspaces/marketplace/index.js"
Write-Host "`nMarketplace: $($marketplace.TotalKB) KB ($($marketplace.ChunkCount) chunks)" -ForegroundColor Green

# BuyerOrders
$buyerOrders = Get-RouteSize "src/workspaces/buyer/my-orders/index.js"
Write-Host "BuyerOrders: $($buyerOrders.TotalKB) KB ($($buyerOrders.ChunkCount) chunks)" -ForegroundColor Green

# BuyerOffers
$buyerOffers = Get-RouteSize "src/workspaces/buyer/my-offers/index.js"
Write-Host "BuyerOffers: $($buyerOffers.TotalKB) KB ($($buyerOffers.ChunkCount) chunks)" -ForegroundColor Green

Write-Host "`n=== SUPPLIER ROUTES ===" -ForegroundColor Yellow

# ProviderHome
$providerHome = Get-RouteSize "src/workspaces/supplier/home/components/Home.jsx"
Write-Host "`nProviderHome: $($providerHome.TotalKB) KB ($($providerHome.ChunkCount) chunks)" -ForegroundColor Green

# MyProducts
$myProducts = Get-RouteSize "src/workspaces/supplier/my-products/components/MyProducts.jsx"
Write-Host "MyProducts: $($myProducts.TotalKB) KB ($($myProducts.ChunkCount) chunks)" -ForegroundColor Green

# AddProduct
$addProduct = Get-RouteSize "src/workspaces/supplier/create-product/components/AddProduct.jsx"
Write-Host "AddProduct: $($addProduct.TotalKB) KB ($($addProduct.ChunkCount) chunks)" -ForegroundColor Green

# MyOrdersPage
$myOrdersPage = Get-RouteSize "src/workspaces/supplier/my-requests/components/MyOrdersPage.jsx"
Write-Host "MyOrdersPage: $($myOrdersPage.TotalKB) KB ($($myOrdersPage.ChunkCount) chunks)" -ForegroundColor Green

# SupplierOffers
$supplierOffers = Get-RouteSize "src/workspaces/supplier/my-offers/components/SupplierOffers.jsx"
Write-Host "SupplierOffers: $($supplierOffers.TotalKB) KB ($($supplierOffers.ChunkCount) chunks)" -ForegroundColor Green

Write-Host "`n=== RESUMEN ===" -ForegroundColor Magenta
Write-Host "`nBUYER TOTAL (promedio):" -ForegroundColor Cyan
$buyerAvg = [math]::Round(($marketplace.TotalKB + $buyerOrders.TotalKB + $buyerOffers.TotalKB) / 3, 2)
Write-Host "  $buyerAvg KB por página"

Write-Host "`nSUPPLIER TOTAL (promedio):" -ForegroundColor Yellow
$supplierAvg = [math]::Round(($providerHome.TotalKB + $myProducts.TotalKB + $addProduct.TotalKB + $myOrdersPage.TotalKB + $supplierOffers.TotalKB) / 5, 2)
Write-Host "  $supplierAvg KB por página"

# Guardar resultados detallados
$results = [PSCustomObject]@{
    Buyer = [PSCustomObject]@{
        Marketplace = $marketplace
        MyOrders = $buyerOrders
        MyOffers = $buyerOffers
        Average = $buyerAvg
    }
    Supplier = [PSCustomObject]@{
        Home = $providerHome
        MyProducts = $myProducts
        AddProduct = $addProduct
        MyOrdersPage = $myOrdersPage
        MyOffers = $supplierOffers
        Average = $supplierAvg
    }
}

$results | ConvertTo-Json -Depth 10 | Out-File -FilePath "route-sizes-analysis.json" -Encoding UTF8
Write-Host "`nResultados guardados en route-sizes-analysis.json" -ForegroundColor Green
