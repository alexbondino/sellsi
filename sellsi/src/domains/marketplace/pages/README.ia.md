# 🚀 README.ia.md - Módulo Marketplace

## 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Centraliza la experiencia completa de descubrimiento, exploración y visualización detallada de productos en la plataforma Sellsi, integrando búsqueda avanzada, filtros dinámicos, navegación por categorías, fichas técnicas detalladas y lógica de negocio para un marketplace B2B robusto y escalable.
- **Responsabilidad principal:** Orquestar la experiencia de marketplace desde la vista general hasta la ficha técnica individual, manejando estado global, filtros, ordenamiento, navegación y acciones de compra.
- **Posición en la arquitectura:** Módulo frontend crítico que actúa como interfaz principal entre usuarios (compradores/proveedores) y el catálogo de productos, integrado con sistema de autenticación, carrito de compras y backend Supabase.
- **Criticidad:** ALTA - Es el corazón de la experiencia de usuario para descubrimiento y compra de productos en Sellsi.
- **Usuarios objetivo:** Compradores B2B buscando productos, Proveedores visualizando su catálogo, Administradores gestionando el marketplace.

## 2. 📊 Análisis de complejidad
- **Líneas de código:** ~4,200 líneas aproximadas (63 archivos total)
- **Complejidad ciclomática:** ALTA - Múltiples condicionales para filtros, estados de UI, routing dinámico, manejo de errores y diferentes vistas (proveedor/comprador)
- **Acoplamiento:** MEDIO - Dependencias específicas con sistema de autenticación, carrito, Supabase, y múltiples hooks personalizados
- **Cohesión:** ALTA - Todos los componentes están altamente relacionados con la funcionalidad de marketplace y visualización de productos
- **Deuda técnica estimada:** MEDIA - Código bien estructurado pero con algunas optimizaciones pendientes en performance de filtros y memoización

## 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| Marketplace.jsx | Componente | ~118 | MEDIA | Orquestador principal del marketplace con layout responsive | React, Material-UI, useMarketplaceLogic |
| useMarketplaceLogic.jsx | Hook | ~330 | ALTA | Lógica centralizada de estado, filtros, ordenamiento y navegación | React hooks, useMarketplaceState, useProductSorting |
| ProductPageWrapper.jsx | Componente | ~200 | MEDIA | Wrapper para carga de producto individual con routing dinámico | React Router, Supabase, useParams |
| ProductPageView.jsx | Componente | ~367 | ALTA | Ficha técnica completa con galería, specs y acciones de compra | Material-UI, React lazy loading, toast |
| hooks/useMarketplaceState.js | Hook | ~139 | ALTA | Estado global del marketplace con filtros complejos | useProducts, constants |
| hooks/useProducts.js | Hook | ~80 | MEDIA | Fetch y cache de productos desde Supabase | Supabase, React Query |
| hooks/useProductSorting.js | Hook | ~95 | MEDIA | Lógica de ordenamiento con múltiples criterios | useMemo, useCallback |
| sections/SearchSection.jsx | Componente | ~120 | MEDIA | Barra de búsqueda y navegación de categorías | SearchBar, CategoryNavigation |
| sections/FilterSection.jsx | Componente | ~150 | MEDIA | Panel de filtros responsive con modal móvil | FilterPanel, Material-UI Dialog |
| sections/ProductsSection.jsx | Componente | ~180 | MEDIA | Grid de productos con paginación y estados vacíos | ProductCard, Grid layout |
| ProductPageView/components/ProductHeader.jsx | Componente | ~200 | MEDIA | Header de ficha técnica con galería e info principal | Material-UI, ProductImageGallery |
| ProductPageView/components/PurchaseActions.jsx | Componente | ~150 | MEDIA | Acciones de compra con selector de cantidad y precios | React hooks, formatters |
| ProductPageView/components/ProductImageGallery.jsx | Componente | ~180 | MEDIA | Galería de imágenes con lazy loading y zoom | useLazyImage, Material-UI |
| utils/formatters.js | Utilidad | ~95 | BAJA | Formateo de precios, fechas y números | Intl API |
| marketplace/constants.js | Constantes | ~50 | BAJA | Constantes de secciones, filtros y ordenamiento | N/A |
| marketplace/productFilters.js | Utilidad | ~80 | MEDIA | Lógica de filtrado compleja por múltiples criterios | N/A |
| marketplace/productSorting.js | Utilidad | ~70 | MEDIA | Algoritmos de ordenamiento de productos | formatters |
| marketplace/productUrl.js | Utilidad | ~60 | BAJA | Generación y parsing de URLs de productos | N/A |

## 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:** 
  - **Container/Presentational:** ProductPageWrapper (container) + ProductPageView (presentational)
  - **Custom Hooks:** Separación de lógica de estado y efectos
  - **Compound Components:** Secciones modulares (Search, Filter, Products)
  - **Observer:** Estado global con hooks y callbacks
  - **Strategy:** Diferentes estrategias de ordenamiento y filtrado
  - **Lazy Loading:** Carga diferida de componentes pesados

- **Estructura de carpetas:**
```
marketplace/
├── components/           # Componentes reutilizables específicos
├── hooks/               # Hooks personalizados para lógica de negocio
├── sections/            # Secciones principales del marketplace
├── ProductPageView/     # Módulo completo de ficha técnica
│   ├── components/      # Componentes específicos de producto
│   └── hooks/          # Hooks específicos de producto
├── marketplace/         # Utilidades y lógica de dominio
├── utils/              # Utilidades generales
└── view_page/          # Componentes de vista de página
```

- **Flujo de datos principal:**
```
Supabase DB → useProducts → useMarketplaceState → useMarketplaceLogic → Secciones UI
                                ↓
                    ProductPageWrapper → ProductPageView → Componentes específicos
                                ↓
                         Acciones usuario → Callbacks → Estado global → Re-render
```

- **Puntos de entrada:** `index.js` (barrel exports), `Marketplace.jsx` (componente principal)
- **Puntos de salida:** Eventos de carrito, navegación, notificaciones toast

## 5. 🔗 Matriz de dependencias
#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | >=5 | UI components, theming, responsive grid | ALTO - Toda la UI depende de esto | Ant Design, ChakraUI |
| react-router-dom | >=6 | Navegación, params, location state | ALTO - Routing complejo | Next.js router, Reach Router |
| @supabase/supabase-js | >=2 | Fetch de productos, autenticación | ALTO - Backend integration | Custom API, Firebase |
| react-hot-toast | >=2 | Notificaciones de feedback | BAJO - Solo UX feedback | react-toastify, notistack |
| react | >=17 | Hooks, suspense, lazy loading | CRÍTICO - Base del framework | N/A |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /features/buyer/hooks/cartStore | Importa | Gestión de carrito de compras | ALTO |
| /features/auth | Importa | Estado de autenticación | ALTO |
| /services/supabase | Importa | Cliente de base de datos | ALTO |
| /features/ui | Importa | Componentes UI reutilizables | MEDIO |
| /styles/dashboardThemeCore | Importa | Theming y estilos | MEDIO |
| /features/login | Importa | Modal de login | MEDIO |
| /utils | Importa | Utilidades generales | BAJO |

## 6. 🧩 API del módulo
#### Componentes exportados:
```jsx
// Uso del marketplace principal
import { Marketplace } from './features/marketplace';
<Marketplace />

// Uso de la ficha técnica independiente
import { ProductPageView } from './features/marketplace/ProductPageView';
<ProductPageView 
  product={productData}
  onClose={() => navigate(-1)}
  onAddToCart={(product) => addToCart(product)}
  isLoggedIn={user !== null}
  fromMyProducts={false}
  isSupplier={userRole === 'supplier'}
/>

// Uso de hooks especializados
import { useMarketplaceLogic } from './features/marketplace';
const { searchSectionProps, filterSectionProps, productsSectionProps } = useMarketplaceLogic();
```

#### Props detalladas:
**Marketplace**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| - | - | - | - | - | Sin props, auto-contenido | `<Marketplace />` |

**ProductPageView**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| product | object | ✅ | - | schema producto | Datos completos del producto | `{id, nombre, precio, ...}` |
| onClose | function | ❌ | undefined | - | Callback para cerrar vista | `() => navigate(-1)` |
| onAddToCart | function | ❌ | undefined | - | Callback para agregar al carrito | `(product) => addToCart(product)` |
| isLoggedIn | boolean | ❌ | false | - | Estado de autenticación | `true/false` |
| fromMyProducts | boolean | ❌ | false | - | Viene de vista de proveedor | `true/false` |
| isSupplier | boolean | ❌ | false | - | Usuario es proveedor | `true/false` |

#### Hooks personalizados:
**useMarketplaceLogic(options)**
- **Propósito:** Centraliza toda la lógica de estado, filtros, ordenamiento y navegación del marketplace
- **Parámetros:** 
  - `options.hasSideBar` (boolean): Si tiene sidebar lateral
  - `options.searchBarMarginLeft` (object): Márgenes responsive
  - `options.categoryMarginLeft` (object): Márgenes de categorías
- **Retorno:** `{ searchSectionProps, filterSectionProps, productsSectionProps, theme }`
- **Estados internos:** productos filtrados, filtros activos, ordenamiento, búsqueda, categorías
- **Efectos:** Fetch de productos, persistencia de filtros, scroll behavior
- **Casos de uso:** Implementar marketplace completo con todas las funcionalidades
- **Limitaciones:** Requiere estructura específica de datos de productos

```jsx
// Ejemplo de uso del hook principal
const { 
  searchSectionProps,
  filterSectionProps, 
  productsSectionProps 
} = useMarketplaceLogic({
  hasSideBar: false,
  searchBarMarginLeft: { xs: 0, md: 2, lg: 5 }
});

// Props ya están optimizados y memoizados
<SearchSection {...searchSectionProps} />
<FilterSection {...filterSectionProps} />
<ProductsSection {...productsSectionProps} />
```

**useMarketplaceState()**
- **Propósito:** Maneja el estado global de productos, filtros y navegación
- **Parámetros:** Ninguno
- **Retorno:** Estado completo y setters para filtros, búsqueda, categorías
- **Estados internos:** productos, filtros, búsqueda, sección activa, loading
- **Efectos:** Fetch inicial de productos, filtrado en tiempo real
- **Casos de uso:** Cuando necesitas acceso directo al estado sin la capa de lógica
- **Limitaciones:** No incluye lógica de UI, solo estado puro

## 7. 🔍 Análisis de estado
- **Estado global usado:** 
  - `useCartStore` (Zustand): Estado del carrito de compras
  - Context de autenticación: Usuario logueado y rol
  - React Router: Location, params, navigation state
- **Estado local:** 
  - Productos filtrados y ordenados
  - Estados de UI (modales, filtros abiertos, índice de imagen seleccionada)
  - Configuración responsive (márgenes, breakpoints)
  - Estados de carga y error
- **Persistencia:** 
  - Filtros y ordenamiento en sessionStorage (implícito)
  - Estado de carrito en localStorage vía Zustand
  - Navegación history en browser history API
- **Sincronización:** 
  - Estado de productos sincronizado con Supabase
  - Estados de filtros sincronizados entre componentes via hooks
  - Estado de autenticación global propagado a componentes
- **Mutaciones:** 
  - Agregar/quitar filtros actualiza productos mostrados
  - Cambios de ordenamiento reordena lista
  - Acciones de carrito mutan estado global de carrito

## 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:**
  - Solo usuarios autenticados pueden agregar productos al carrito
  - Filtros por precio, stock, rating, negociabilidad y categorías
  - Diferentes vistas para proveedores (sus productos) vs compradores (todos los productos)
  - Productos inactivos no se muestran en marketplace público
  - Precios escalonados por cantidad de compra
  - Validación de stock mínimo y máximo por producto

- **Validaciones:**
  - Cantidad de compra entre 1 y stock disponible
  - Formato de precio y datos numéricos
  - Existencia de producto antes de mostrar ficha técnica
  - Permisos de usuario para acciones específicas

- **Transformaciones de datos:**
  - Formato de precios a CLP con separadores de miles
  - URLs de productos con slug SEO-friendly
  - Imágenes con lazy loading y thumbnails
  - Fechas en formato local chileno

- **Casos especiales:**
  - Productos sin imagen usan placeholder
  - Productos agotados muestran estado especial
  - Errores de carga muestran fallbacks apropiados
  - Vista de proveedor oculta sus propios productos del marketplace general

- **Integraciones:**
  - Supabase para datos de productos y autenticación
  - Sistema de carrito para acciones de compra
  - Sistema de notificaciones para feedback
  - React Router para navegación y URLs

## 9. 🔄 Flujos de usuario
**Flujo principal (Comprador):**
1. Usuario accede al marketplace → Se cargan productos filtrados por defecto
2. Usuario aplica filtros/búsqueda → Sistema refiltra y reordena productos
3. Usuario selecciona producto → Navega a ficha técnica con datos completos
4. Usuario ajusta cantidad y agrega al carrito → Se valida stock y autenticación
5. Si no está logueado → Se muestra modal de login
6. Si éxito → Se agrega al carrito y se muestra confirmación

**Flujo proveedor (Ver sus productos):**
1. Proveedor accede desde "Mis Productos" → Ve solo sus productos
2. Selecciona producto → Ve ficha técnica sin opciones de compra
3. Puede navegar de vuelta a su catálogo

**Flujos alternativos:**
- **Error de carga:** Skeleton → Mensaje de error → Botón de reintento
- **Producto no encontrado:** Redirección a marketplace con mensaje
- **Sin productos:** Estado vacío con sugerencias de filtros
- **Error de red:** Fallback con productos en cache

## 10. 🧪 Puntos de testing
- **Casos de prueba críticos:**
  - Filtrado y ordenamiento de productos
  - Navegación entre vistas (marketplace ↔ ficha técnica)
  - Agregar productos al carrito con diferentes estados de usuario
  - Responsive behavior en diferentes breakpoints
  - Lazy loading de imágenes y componentes
  - Manejo de estados de error y carga

- **Mocks necesarios:**
  - Supabase client con datos de productos simulados
  - React Router con navegación simulada
  - Zustand store del carrito
  - Context de autenticación con diferentes roles

- **Datos de prueba:**
  - Productos con diferentes categorías, precios y stocks
  - Usuarios autenticados y no autenticados
  - Diferentes roles (comprador, proveedor)
  - Datos con y sin imágenes

- **Escenarios de error:**
  - Error de conexión a Supabase
  - Productos sin datos requeridos
  - Imágenes que fallan al cargar
  - Stock insuficiente

- **Performance:**
  - Tiempo de carga inicial < 2s
  - Filtrado en tiempo real < 100ms
  - Lazy loading de imágenes
  - Memoización efectiva de componentes

## 11. 🚨 Puntos críticos para refactor
- **Código legacy:**
  - Algunos componentes no usan Suspense correctamente
  - Manejo de errores podría ser más granular
  - Props drilling en algunos componentes anidados

- **Antipatrones:**
  - Uso de `window.currentAppRole` para detectar tipo de usuario
  - Eventos globales con `window.dispatchEvent` para login
  - Algunos efectos podrían optimizarse mejor

- **Oportunidades de mejora:**
  - Implementar React Query para cache más sofisticado
  - Extraer constantes mágicas a configuración
  - Mejorar TypeScript adoption
  - Implementar Error Boundaries
  - Optimizar bundle splitting

- **Riesgos:**
  - Cambios en estructura de datos de Supabase romperían filtros
  - Modificaciones en Material-UI podrían afectar layout responsive
  - Cambios en routing podrían romper navegación de breadcrumbs

- **Orden de refactor:**
  1. Migrar a TypeScript para mejor type safety
  2. Implementar Error Boundaries
  3. Optimizar performance con React Query
  4. Refactorizar comunicación global (context vs window events)
  5. Mejorar testing coverage

## 12. 🔧 Consideraciones técnicas
#### Limitaciones actuales:
- **Performance:** Filtrado sincrónico puede ser lento con muchos productos (>1000)
- **Memoria:** Componentes no siempre se desmmontan correctamente
- **Escalabilidad:** Paginación no implementada, carga todos los productos
- **Compatibilidad:** Requiere navegadores modernos con ES2020+ support

#### Configuración requerida:
- **Variables de entorno:** 
  - `VITE_SUPABASE_URL`: URL de la instancia Supabase
  - `VITE_SUPABASE_ANON_KEY`: Clave pública de Supabase
- **Inicialización:** 
  - Cliente Supabase configurado
  - Material-UI ThemeProvider
  - React Router configurado
  - Zustand store inicializado
- **Permisos:** 
  - RLS policies en Supabase para productos
  - Acceso a storage de imágenes
  - Políticas de autenticación

## 13. 🛡️ Seguridad y compliance
- **Datos sensibles:** 
  - Precios y stock de productos
  - Información de proveedores
  - Datos de sesión de usuario
- **Validaciones de seguridad:** 
  - Sanitización de inputs de búsqueda
  - Validación de tipos en props
  - Verificación de autenticación antes de acciones
- **Permisos:** 
  - Usuarios autenticados para agregar al carrito
  - Proveedores solo ven sus productos en contexto apropiado
  - RLS de Supabase para acceso a datos
- **Auditoría:** 
  - Logs de acciones de carrito
  - Tracking de búsquedas y filtros
  - Monitoreo de errores con toast notifications

## 14. 📚 Referencias y documentación
- **Documentación técnica:** 
  - [Material-UI Documentation](https://mui.com/material-ui/)
  - [React Router v6 Guide](https://reactrouter.com/en/main)
  - [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- **Decisiones de arquitectura:** 
  - Hooks pattern elegido por separación de concerns y testabilidad
  - Material-UI por consistency con design system de Sellsi
  - Lazy loading implementado para optimizar inicial bundle size
- **Recursos externos:** 
  - Zustand para state management global simple
  - React Hot Toast para UX consistency
  - Intl API para formateo localizado
- **Historial de cambios:** 
  - v1.0: Implementación inicial básica
  - v2.0: Refactor con hooks personalizados
  - v3.0: Implementación de ficha técnica completa
  - v4.0: Optimizaciones de performance y responsive design

## 15. 🎨 Ejemplos de uso avanzados
```jsx
// Ejemplo 1: Uso básico del marketplace
import { Marketplace } from 'src/features/marketplace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/marketplace" element={<Marketplace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Ejemplo 2: Integración con sistema de autenticación
import { useAuth } from 'src/context/AuthContext';
import { ProductPageView } from 'src/features/marketplace/ProductPageView';

function ProductPage() {
  const { user, isSupplier } = useAuth();
  const { id } = useParams();
  
  return (
    <ProductPageView
      productId={id}
      isLoggedIn={!!user}
      isSupplier={isSupplier}
      onAddToCart={(product) => {
        // Lógica personalizada de carrito
        addToCart(product);
        analytics.track('Product Added', { productId: product.id });
      }}
    />
  );
}

// Ejemplo 3: Uso de hooks independientes para dashboard personalizado
import { useMarketplaceState, useProductSorting } from 'src/features/marketplace/hooks';

function CustomDashboard() {
  const { productosFiltrados, setBusqueda } = useMarketplaceState();
  const { productosOrdenados, setOrdenamiento } = useProductSorting(productosFiltrados);
  
  return (
    <div>
      <input onChange={(e) => setBusqueda(e.target.value)} />
      <select onChange={(e) => setOrdenamiento(e.target.value)}>
        <option value="precio-asc">Menor precio</option>
        <option value="precio-desc">Mayor precio</option>
      </select>
      {productosOrdenados.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Ejemplo 4: Manejo avanzado de errores con Error Boundary
import { ErrorBoundary } from 'react-error-boundary';

function MarketplaceWithErrorHandling() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div>
          <h2>Error en el marketplace: {error.message}</h2>
          <button onClick={resetErrorBoundary}>Reintentar</button>
        </div>
      )}
      onError={(error) => {
        console.error('Marketplace error:', error);
        // Enviar a servicio de logging
      }}
    >
      <Marketplace />
    </ErrorBoundary>
  );
}
```

## 16. 🔄 Guía de migración
- **Desde versión anterior:** 
  - v3.x → v4.x: Actualizar imports de hooks, verificar props de ProductPageView
  - Verificar que Material-UI esté en v5+
  - Actualizar configuración de responsive breakpoints
- **Breaking changes:** 
  - Cambio en API de useMarketplaceLogic (options object)
  - Nuevas props requeridas en ProductPageView para navegación
  - Estructura de datos de producto actualizada
- **Checklist de migración:** 
  - [ ] Actualizar imports de componentes
  - [ ] Verificar configuración de routing
  - [ ] Actualizar tests con nuevas APIs
  - [ ] Revisar configuración de Supabase RLS
  - [ ] Validar responsive behavior
- **Rollback:** 
  - Mantener versión anterior en branch separado
  - Rollback de database migrations si necesario
  - Restaurar configuración de routing anterior

## 17. 📋 Metadatos del documento
- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch (commit hash pendiente)
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 18/08/2025

---

*Documento generado automáticamente por Pipeline ReadmeV4 para análisis técnico y planificación de refactor del módulo marketplace de Sellsi.*
