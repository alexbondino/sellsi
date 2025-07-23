S C:\Users\klaus\OneDrive\Documentos\sellsi> Get-ChildItem -Recurse -Directory | Where-Object {$_.FullName -notlike "*node_modules*"} | Group-Object Name | Where-Object {$_.Count -gt 1} | ForEach-Object { Write-Host "Carpeta duplicada: $($_.Name) ($($_.Count) carpetas)"; $_.Group.FullName }
Carpeta duplicada: .vscode (2 carpetas)
Carpeta duplicada: supabase (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\supabase
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\services\supabase
Carpeta duplicada: ANALISIS (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\Documentacion\ANALISIS
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\Documentacion\ANALISIS
Carpeta duplicada: Checkout (4 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Checkout
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Checkout
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\constants\checkout
Carpeta duplicada: Landing Page (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Landing Page
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Landing Page
Carpeta duplicada: pdf (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\pdf
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\pdf
Carpeta duplicada: Nuestros Proveedores (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Landing Page\Nuestros Proveedores
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Landing Page\Nuestros Proveedores
Carpeta duplicada: Proveedor (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Landing Page\Proveedor
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Landing Page\Proveedor
Carpeta duplicada: PuntoDeVenta (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Landing Page\PuntoDeVenta
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Landing Page\PuntoDeVenta
Carpeta duplicada: Vendedor (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\dist\Landing Page\Vendedor
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\public\Landing Page\Vendedor
Carpeta duplicada: components (14 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\app\pages\landing\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\auth\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages\cart\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\FilterPanel\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\FilterPanel\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ProductPageView\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\profile\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\pages\my-products\components
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\components
Carpeta duplicada: domains (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains
C:\Users\klaus\OneDrive\Documentos\sellsi\src\domains
Carpeta duplicada: hooks (15 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\app\pages\landing\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\auth\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages\cart\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ProductPageView\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ProductPageView\pages\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\profile\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\pages\my-products\hooks
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\hooks
Carpeta duplicada: services (6 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\services
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\services
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\auth\services
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\services
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\services
C:\Users\klaus\OneDrive\Documentos\sellsi\src\domains\auth\services
Carpeta duplicada: styles (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\styles
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\styles
Carpeta duplicada: utils (6 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\utils
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\utils
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\utils
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ProductPageView\utils
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\pages\my-products\utils
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\utils
Carpeta duplicada: pages (9 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\app\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ban\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\ProductPageView\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\profile\pages
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\supplier\pages
Carpeta duplicada: auth (4 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\auth
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\services\auth
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\services\auth
C:\Users\klaus\OneDrive\Documentos\sellsi\src\domains\auth
Carpeta duplicada: marketplace (4 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\marketplace
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\marketplace
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\services\marketplace
Carpeta duplicada: config (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\config
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\config
Carpeta duplicada: modals (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\admin\modals
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\components\modals
Carpeta duplicada: wizard (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\auth\wizard
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\components\navigation\wizard
Carpeta duplicada: orders (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\hooks\orders
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\stores\orders
Carpeta duplicada: cart (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\buyer\pages\cart
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\stores\cart
Carpeta duplicada: constants (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\checkout\constants
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\constants
Carpeta duplicada: CategoryNavigation (4 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\CategoryNavigation
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\hooks\CategoryNavigation
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\CategoryNavigation
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\hooks\CategoryNavigation
Carpeta duplicada: FilterPanel (4 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\FilterPanel
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\hooks\FilterPanel
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\FilterPanel
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\hooks\FilterPanel
Carpeta duplicada: PriceDisplay (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\PriceDisplay
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\PriceDisplay
Carpeta duplicada: product (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\product
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\product
Carpeta duplicada: sections (3 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\sections
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\sections
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\profile\components\sections
Carpeta duplicada: StockIndicator (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\StockIndicator
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\StockIndicator
Carpeta duplicada: view_page (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\view_page
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\view_page
Carpeta duplicada: ProductCard (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\hooks\ProductCard
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\hooks\ProductCard
Carpeta duplicada: ProductGrid (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\hooks\ProductGrid
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\domains\marketplace\pages\hooks\ProductGrid
Carpeta duplicada: formatters (2 carpetas)
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\components\formatters
C:\Users\klaus\OneDrive\Documentos\sellsi\sellsi\src\shared\utils\formatters