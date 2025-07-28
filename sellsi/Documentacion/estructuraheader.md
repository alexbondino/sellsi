# Estructura visual y j         ├── Box (Stock, Compra mínima y Chips de f         └── [Acciones de compra]
               ├── Si checkingOwnership: Box + CircularProgress
               ├── Si NO es supplier, marketplace, mis productos, ni propio: PurchaseActions (AddToCart centrado, sin fullWidth)
               └── Si es supplier/propio/etc: nullración)
         │     display: flex, justifyContent: space-between, alignItems: center, mb: 3
         │     width: 100% [xs], 90% [sm], 85% [md], maxWidth: 500, gap: 2
         │     ├── Box (lado izquierdo)
         │     │     display: flex, flexDirection: column, gap: 1, flex: 1
         │     │     ├── Typography (Stock - color negro)
         │     │     └── Typography (Compra mínima - color negro)
         │     └── Box (lado derecho - chips)
         │           display: flex, gap: 1, flexWrap: wrap, justifyContent: flex-end
         │           ├── Chip (Factura - color primary.main, letra blanca, no clickeable)
         │           ├── Chip (Boleta - color primary.main, letra blanca, no clickeable)
         │           └── Chip (Ninguno - color primary.main, letra blanca, no clickeable)e ProductHeader.jsx

## Descomposición de Boxes y Jerarquía

```
ProductHeader (Box: width 100%, maxWidth 100%)
│
├── Box (flex, flexDirection: column [xs], row [md], width 100%)
│   │
│   ├── Box (Galería de imágenes)
│   │     flex: 1, minWidth: 0, display: flex, justifyContent: center [xs], right [md]
│   │     └── ProductImageGallery
│   │           props: images, mainImage, selectedIndex, onImageSelect, productName
│   │
│   └── Box (Información del Producto)
│         flex: 1, minWidth: 0, flexDirection: column, alignItems: flex-start, textAlign: left, px, width, maxWidth, mx
│         │
│         ├── Box (Nombre del Producto)
│         │     display: flex, alignItems: center, justifyContent: flex-start, gap: 1, mb: 2, width: 100%
│         │     ├── Typography (variant h4, nombre)
│         │     ├── Tooltip + IconButton (copiar nombre)
│         │     └── Box (CheckCircleOutlineIcon feedback)
│         │
│         ├── Box (Stock, Compra mínima y Chips de facturación)
│         │     display: flex, justifyContent: space-between, alignItems: center, mb: 3, width: 100%
│         │     ├── Box (lado izquierdo)
│         │     │     display: flex, flexDirection: column, gap: 1
│         │     │     ├── Typography (Stock - color negro)
│         │     │     └── Typography (Compra mínima - color negro)
│         │     └── Box (lado derecho - chips)
│         │           display: flex, gap: 1, flexWrap: wrap
│         │           ├── Chip (Factura - color primary.main, letra blanca, no clickeable)
│         │           ├── Chip (Boleta - color primary.main, letra blanca, no clickeable)
│         │           └── Chip (Ninguno - color primary.main, letra blanca, no clickeable)
│         │
│         ├── Box (Nombre del Proveedor)
│         │     display: flex, alignItems: center, mb: 3
│         │     ├── Avatar (primer letra proveedor)
│         │     └── Chip (label proveedor, onClick navega a catálogo)
│         │
│         ├── priceContent (Precios y/o tramos - colores negros)
│         │     ├── Si loading: Box + CircularProgress
│         │     ├── Si error: Box + Typography + Tooltip
│         │     └── Si tramos:
│         │           Box (mb: 3)
│         │           ├── Box (header precios - color negro, tooltips, copiar todos)
│         │           ├── TableContainer (maxWidth: 400, mx: auto, mb: 2)
│         │           │     └── Table
│         │           │           └── TableBody
│         │           │                 └── [map tiers]
│         │           │                       Tooltip
│         │           │                         └── TableRow
│         │           │                               ├── TableCell (rango)
│         │           │                               └── TableCell (precio - color negro)
│         │           └── Box (Botón de Cotización)
│         │                 display: flex, justifyContent: center, mt: 2
│         │                 └── Typography + Button "Cotiza aquí" (color primary.main)
│         │     └── Si precio único: 
│         │           Box + PriceDisplay (color negro) + Tooltip + IconButton + CheckCircleOutlineIcon
│         │           └── Box (Botón de Cotización)
│         │                 display: flex, justifyContent: center, mt: 2
│         │                 └── Typography + Button "Cotiza aquí" (color primary.main)
│         │
│         └── [Acciones de compra]
│               ├── Si checkingOwnership: Box + CircularProgress
│               ├── Si NO es supplier, marketplace, mis productos, ni propio: PurchaseActions (solo botón Agregar al Carrito)
│               └── Si es supplier/propio/etc: null
```

## Notas
- Cada Box representa un contenedor visual con estilos responsivos.
- Los componentes hijos (ProductImageGallery, PurchaseActions, PriceDisplay, StockIndicator) encapsulan lógica y UI específica.
- La jerarquía está pensada para separar galería de imágenes y detalles del producto en columnas (row) o filas (column) según el tamaño de pantalla.
- Los tooltips e iconos de feedback mejoran la experiencia de usuario en acciones como copiar datos.
- Las condiciones de renderizado (stock, ownership, tramos) determinan qué se muestra en cada sección.
- **CAMBIOS RECIENTES:**
  - Stock y compra mínima se movieron arriba junto con chips de facturación (Factura, Boleta, Ninguno) no clickeables
  - Box de stock/compra mínima optimizada: ancho responsivo (85%-90%) con maxWidth 500px y gap reducido
  - Todos los precios ahora aparecen en color negro en lugar de primary.main
  - Se agregó botón "Cotiza aquí" al final de la sección de precios (reemplaza Solicitar Cotización)
  - Botón "Cotiza aquí" conectado a QuotationModal con cantidad mínima y precio correspondiente
  - PurchaseActions simplificado: eliminado quantity selector, solo botón "Agregar al Carrito" centrado
  - Botón conectado a AddToCartModal para manejo completo de lógica de cantidad y agregado
  - Botón mantiene ancho natural (sin fullWidth) para mejor proporción visual
