# Sprint 2 Fase 3: Display Components Migration

## 🎯 Objetivo Principal
Migrar componentes de **display/** del módulo `features/ui/` a `shared/components/display/` para continuar con la modularización del UI module que actualmente tiene **8,996 LOC**.

## 📋 Análisis de Componentes Display (~2,930 LOC)

### **🔍 Inventario de Componentes a Migrar:**

#### **1. Product Cards (product-card/)**
- `ProductCard.jsx` - Tarjeta principal de producto
- `ProductCardWishlist.jsx` - Versión optimizada para wishlist
- `ProductCardWishlistSkeleton.jsx` - Loading skeleton
- `ProductCardCheckout.jsx` - Versión checkout
- `ProductCardInvoice.jsx` - Versión para facturas
- **Estimación**: ~800 LOC

#### **2. Statistics Components**
- `StatsCards.jsx` - Conjunto de tarjetas estadísticas
- `StatCard.jsx` - Tarjeta individual de estadística
- **Estimación**: ~300 LOC

#### **3. Table Components (table/)**
- `Table.jsx` - Componente tabla principal
- `TableRow.jsx` - Componente fila de tabla
- `TableCell.jsx` - Componente celda de tabla
- **Estimación**: ~600 LOC

#### **4. Graph Components (graphs/)**
- `LineChart.jsx` - Gráfico de líneas
- `BarChart.jsx` - Gráfico de barras
- `PieChart.jsx` - Gráfico circular
- **Estimación**: ~700 LOC

#### **5. Banner Components (banner/)**
- `PromotionBanner.jsx` - Banner promocional
- `AnnouncementBanner.jsx` - Banner de anuncios
- **Estimación**: ~200 LOC

#### **6. Lists Components**
- `RequestList.jsx` - Lista de solicitudes
- `OrdersList.jsx` - Lista de pedidos
- **Estimación**: ~330 LOC

## 🚀 Estrategia de Migración

### **Fase 3.1: Product Cards Migration**
1. Crear estructura `shared/components/display/product-card/`
2. Migrar ProductCard y variantes
3. Extraer configuraciones a `productCardConfig.js`
4. Actualizar imports y validar

### **Fase 3.2: Statistics Migration**
1. Crear `shared/components/display/statistics/`
2. Migrar StatsCards y StatCard
3. Implementar barrel exports
4. Validar estadísticas admin

### **Fase 3.3: Tables Migration**
1. Crear `shared/components/display/tables/`
2. Migrar sistema completo de tablas
3. Preservar funcionalidades de ordenamiento
4. Actualizar componentes que usan tablas

### **Fase 3.4: Graphs Migration**
1. Crear `shared/components/display/graphs/`
2. Migrar componentes de gráficos
3. Preservar integraciones con Chart.js
4. Validar dashboard admin

### **Fase 3.5: Banners & Lists Migration**
1. Crear `shared/components/display/banners/` y `shared/components/display/lists/`
2. Migrar componentes restantes
3. Implementar barrel exports finales
4. Build validation completo

## 📦 Estructura Final Esperada

```
shared/components/display/
├── index.js (barrel exports)
├── product-card/
│   ├── index.js
│   ├── ProductCard.jsx
│   ├── ProductCardWishlist.jsx
│   ├── ProductCardWishlistSkeleton.jsx
│   ├── ProductCardCheckout.jsx
│   ├── ProductCardInvoice.jsx
│   └── productCardConfig.js
├── statistics/
│   ├── index.js
│   ├── StatsCards.jsx
│   └── StatCard.jsx
├── tables/
│   ├── index.js
│   ├── Table.jsx
│   ├── TableRow.jsx
│   └── TableCell.jsx
├── graphs/
│   ├── index.js
│   ├── LineChart.jsx
│   ├── BarChart.jsx
│   └── PieChart.jsx
├── banners/
│   ├── index.js
│   ├── PromotionBanner.jsx
│   └── AnnouncementBanner.jsx
└── lists/
    ├── index.js
    ├── RequestList.jsx
    └── OrdersList.jsx
```

## 🎯 Criterios de Éxito

### **Performance Targets**
- ✅ Mantener build time bajo 60s
- ✅ Preservar tree shaking
- ✅ 0 duplicaciones de código
- ✅ Bundle chunks optimizados

### **Code Quality Targets**
- ✅ Barrel exports consistentes
- ✅ Configuraciones externalizadas
- ✅ PropTypes preservados
- ✅ Documentación actualizada

### **Functionality Targets**
- ✅ Product cards funcionando en home/search
- ✅ Dashboard admin con estadísticas
- ✅ Tablas en admin panel
- ✅ Gráficos en analytics
- ✅ Banners en landing page

## 📈 Estimación de Esfuerzo
- **Tiempo estimado**: 8-10 horas
- **Complejidad**: Media-Alta (componentes complejos con muchas dependencias)
- **Riesgo**: Medio (ProductCard muy utilizado en toda la app)

---

## 🔄 Estado Actual
**Status**: ⏳ PENDIENTE  
**Prerequisitos**: ✅ Sprint 2 Fase 1 y Fase 2 completados  
**Siguiente**: Análisis detallado de ProductCard dependencies  

**Fecha inicio**: PENDIENTE  
**Fecha completado**: PENDIENTE
