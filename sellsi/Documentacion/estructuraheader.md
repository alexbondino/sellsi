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

## Propuesta de Responsividad Móvil - Análisis Profesional

### **Problemática Identificada**
El ProductPageView actual utiliza un paper blanco con bordes, sombras y padding que funciona bien en desktop pero crea problemas de UX en móvil:
- Desperdicio de espacio horizontal crítico
- Bordes y sombras innecesarios que no siguen patrones móviles nativos
- Layout flex que no aprovecha óptimamente el espacio vertical móvil
- Galería de imágenes constrained por el flex layout cuando debería ser full-width en móvil

### **Opción Recomendada: Responsive Condicional Híbrido**

#### **Arquitectura de Solución**
```jsx
// Hook para detección de breakpoint
const isMobile = useMediaQuery(theme.breakpoints.down('md'))

// Container principal con estilos condicionales
<Box sx={{
  backgroundColor: {
    xs: 'background.default', // Móvil: fondo nativo del tema
    md: 'white'              // Desktop: paper blanco actual
  },
  border: {
    xs: 'none',                    // Móvil: sin bordes
    md: '1.5px solid #e0e0e0'     // Desktop: mantener bordes
  },
  boxShadow: {
    xs: 'none',  // Móvil: sin sombras
    md: 6        // Desktop: mantener elevación
  },
  borderRadius: {
    xs: 0,   // Móvil: sin bordes redondeados
    md: 3    // Desktop: mantener radius
  },
  p: {
    xs: 0,   // Móvil: sin padding interno
    md: 3    // Desktop: mantener padding
  },
  mx: {
    xs: 0,      // Móvil: full width
    md: 'auto'  // Desktop: centrado
  }
}}>
```

#### **Layout Móvil Optimizado (xs, sm)**
```
Mobile Layout Stack (sin paper container):
│
├── Breadcrumbs Compactos
│   └── Padding horizontal mínimo (px: 2)
│
├── Galería Full-Width
│   ├── width: 100vw (rompe contenedor)
│   ├── marginX: -16px (compensar padding padre)
│   └── Aspect ratio optimizado para móvil
│
├── Información del Producto
│   ├── Padding horizontal: 16px
│   ├── Stack vertical completo
│   ├── Nombre del producto (Typography h5)
│   ├── Stock y Chips (stack vertical, no horizontal)
│   ├── Proveedor (compacto)
│   ├── Precios (centrados, typography más pequeña)
│   └── Purchase Actions (botón full-width)
│
└── Descripción del Producto
    └── Padding horizontal: 16px
```

#### **Layout Desktop Mantenido (md+)**
```
Desktop Layout (con paper container):
│
├── Paper Container Blanco
│   ├── Bordes, sombras y padding actuales
│   ├── Breadcrumbs actuales
│   ├── Flex Row Layout (galería | información)
│   └── Descripción centrada
```

### **Implementación Técnica Detallada**

#### **1. ProductPageView Principal**
```jsx
const ProductPageView = memo(({ ... }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box sx={{
        backgroundColor: 'background.default',
        pt: { xs: 1, md: 4 },    // Menos top padding móvil
        px: { xs: 0, md: 3 },    // Sin padding horizontal móvil
        pb: SPACING_BOTTOM_MAIN,
        width: '100%',
      }}>
        <Box sx={{
          // Estilos condicionales del container
          backgroundColor: { xs: 'transparent', md: 'white' },
          border: { xs: 'none', md: '1.5px solid #e0e0e0' },
          boxShadow: { xs: 'none', md: 6 },
          borderRadius: { xs: 0, md: 3 },
          p: { xs: 0, md: 3 },
          mb: { xs: 0, md: 6 },
          maxWidth: '1450px',
          mx: 'auto',
          width: '100%',
        }}>
          {/* Breadcrumbs responsivos */}
          <Box sx={{ 
            px: { xs: 2, md: 0 }, 
            mb: { xs: 1, md: 2 } 
          }}>
            <Breadcrumbs />
          </Box>
          
          {/* ProductHeader con props de responsividad */}
          <ProductHeader 
            isMobile={isMobile}
            {...otherProps}
          />
          
          {/* Descripción responsiva */}
          <Box sx={{ 
            px: { xs: 2, md: 0 }, 
            mt: { xs: 4, md: 6 } 
          }}>
            <DescriptionSection isMobile={isMobile} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
})
```

#### **2. ProductHeader Responsivo**
```jsx
const ProductHeader = memo(({ isMobile, ...props }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        width: '100%',
        gap: { xs: 3, md: 0 }
      }}>
        {/* Galería - Full width en móvil */}
        <Box sx={{
          flex: { xs: 'none', md: 1 },
          width: { xs: '100%', md: 'auto' },
          minWidth: 0,
          // En móvil: romper contenedor para full width
          ...(isMobile && {
            marginX: -2, // Compensar padding del padre
            width: 'calc(100% + 32px)'
          })
        }}>
          <ProductImageGallery 
            isMobile={isMobile}
            {...galleryProps}
          />
        </Box>
        
        {/* Información - Padding en móvil */}
        <Box sx={{
          flex: { xs: 'none', md: 1 },
          px: { xs: 2, md: 0 },
          display: 'flex',
          flexDirection: 'column'
        }}>
          <ProductInfo isMobile={isMobile} {...infoProps} />
        </Box>
      </Box>
    </Box>
  )
})
```

#### **3. Componentes Hijo Optimizados**

**ProductImageGallery Móvil:**
```jsx
// Aspect ratio móvil: 4:3 o 16:10
// Thumbnails: horizontal scroll
// Main image: full container width
```

**ProductInfo Móvil:**
```jsx
// Typography scales: h4 → h5, body1 → body2
// Stock/Chips: vertical stack
// Buttons: full width con padding vertical mayor
// Price: centrado con typography menor
```

### **Ventajas de Esta Solución**

#### **Técnicas:**
- **Una sola versión del componente**: Mantiene DRY principle
- **Performance optimizada**: useMediaQuery con theme breakpoints
- **Mantenibilidad**: Lógica centralizada en estilos sx
- **Escalabilidad**: Fácil ajuste de nuevos breakpoints

#### **UX/UI:**
- **Experiencia nativa móvil**: Sin elementos desktop innecesarios
- **Aprovechamiento de espacio**: Galería full-width, contenido sin desperdicios
- **Consistencia**: Mantiene patrones establecidos por breakpoint
- **Accesibilidad**: Touch targets apropiados, texto legible

#### **Negocio:**
- **Menor bounce rate móvil**: UX optimizada reduce abandono
- **Mayor conversión**: Purchase actions más prominentes en móvil
- **Desarrollo eficiente**: Una implementación para todos los dispositivos

### **Implementación por Fases**

#### **Fase 1: Container Principal**
- Modificar ProductPageView con estilos condicionales
- Implementar useMediaQuery hook
- Ajustar padding y margins base

#### **Fase 2: Layout Responsivo**
- Modificar ProductHeader flex layout
- Implementar galería full-width móvil
- Ajustar información del producto

#### **Fase 3: Componentes Específicos**
- Optimizar ProductImageGallery para móvil
- Ajustar ProductInfo typography y spacing
- Optimizar PurchaseActions para touch

#### **Fase 4: Testing y Refinamiento**
- Testing en dispositivos reales
- Ajustes de spacing y typography
- Optimización de performance

### **Métricas de Éxito**
- **Reducción de scroll horizontal**: 0% en móvil
- **Mejora en tiempo de carga**: Target <3s en 3G
- **Aumento de engagement**: +25% tiempo en página móvil
- **Conversión móvil**: Equiparar con desktop (actualmente menor)

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
  - Botón "Cotiza aquí" movido a Box independiente para centrado consistente en ambos casos de precio
  - PurchaseActions simplificado: eliminado quantity selector, solo botón "Agregar al Carrito" centrado
  - Botón conectado a AddToCartModal para manejo completo de lógica de cantidad y agregado
  - Botón mantiene ancho natural (sin fullWidth) para mejor proporción visual
