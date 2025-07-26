# 🚀 README.ia.md - Análisis Ultra Profundo del Dominio `supplier`

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Gestión completa de proveedores en la plataforma Sellsi, incluyendo dashboard de productos, gestión de inventario, manejo de imágenes, tramos de precio, especificaciones técnicas y análisis de ventas

- **Responsabilidad principal:** Centralizar toda la funcionalidad de proveedores desde la creación de productos hasta el análisis de performance, manteniendo separación de responsabilidades con arquitectura modular

- **Posición en la arquitectura:** Dominio de negocio crítico que interactúa directamente con Supabase, Storage, y servicios de upload, actuando como intermediario entre UI de proveedor y persistencia de datos

- **Criticidad:** CRÍTICA - Es el corazón de la funcionalidad de proveedores, genera revenue directamente y maneja operaciones complejas de productos

- **Usuarios objetivo:** Proveedores registrados en Sellsi, administradores del sistema, desarrolladores que extienden funcionalidad de productos

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~23,000+ líneas distribuidas en múltiples archivos
- **Complejidad ciclomática:** CRÍTICA - Hooks extremadamente complejos con múltiples ramificaciones, manejo de estado async, operaciones CRUD complejas
- **Acoplamiento:** ALTO - Fuerte dependencia con Supabase, UploadService, múltiples tablas relacionadas (products, product_images, product_quantity_ranges, etc.)
- **Cohesión:** MEDIA-ALTA - Funcionalidades bien agrupadas pero algunos hooks violan Single Responsibility Principle
- **Deuda técnica estimada:** ALTA - Refactorización reciente mejoró estructura pero quedan hooks monolíticos que requieren división adicional

## 3. 🗂️ Inventario completo de archivos

### Hooks (Críticos)
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| useSupplierProducts.js | Hook Facade | ~250 | ALTA | Hook principal que combina CRUD y filtros | useSupplierProductsBase, useSupplierProductFilters |
| useSupplierProductsBase.js | Hook CRUD | ~961 | CRÍTICA | Store base con operaciones CRUD, gestión de imágenes, cleanup | zustand, supabase, uploadService |
| useSupplierProductFilters.js | Hook Filtros | ~340 | ALTA | Store especializado en filtros, búsqueda y ordenamiento | zustand |
| useProductForm.js | Hook Form | ~390 | ALTA | Gestión de formularios de productos | react |
| useLazyProducts.js | Hook UI | ~200 | MEDIA | Lazy loading y animaciones de productos | react |
| index.js | Barrel | ~57 | BAJA | Exportaciones centralizadas con arquitectura refactorizada | N/A |

### Páginas (Interfaces)
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| ProviderHome.jsx | Página | ~800 | ALTA | Dashboard principal del proveedor | @mui/material, hooks |
| MyProducts.jsx | Página | ~1200 | ALTA | Gestión completa de productos | @mui/material, hooks |
| AddProduct.jsx | Página | ~1500 | ALTA | Formulario de creación/edición de productos | @mui/material, hooks |
| SupplierProfile.jsx | Página | ~600 | MEDIA | Gestión de perfil del proveedor | @mui/material |
| MarketplaceSupplier.jsx | Página | ~400 | MEDIA | Vista del proveedor en marketplace | @mui/material |

### Componentes (Modulares)
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| ProductBasicInfo.jsx | Componente | ~300 | MEDIA | Información básica del producto | @mui/material |
| ProductImages.jsx | Componente | ~400 | ALTA | Gestión de imágenes con thumbnails | @mui/material, uploadService |
| ProductInventory.jsx | Componente | ~250 | MEDIA | Gestión de inventario y stock | @mui/material |
| ProductSpecs.jsx | Componente | ~350 | MEDIA | Especificaciones técnicas | @mui/material |
| ProductDocuments.jsx | Componente | ~200 | BAJA | Documentos adjuntos | @mui/material |
| ProductRegions.jsx | Componente | ~180 | BAJA | Regiones de despacho | @mui/material |
| DashboardSummary.jsx | Componente | ~500 | ALTA | Resumen de dashboard con métricas | @mui/material |

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **Facade Pattern**: `useSupplierProducts` actúa como facade principal
  - **Strategy Pattern**: Diferentes estrategias para CRUD, filtros, y procesamiento
  - **Composite Pattern**: Hooks compuestos que combinan múltiples funcionalidades
  - **Observer Pattern**: Zustand stores con suscripciones reactivas
  - **Repository Pattern**: Abstracción de acceso a datos via Supabase
  - **Command Pattern**: Operaciones CRUD encapsuladas en funciones específicas

- **Estructura de carpetas:**
```
supplier/
├── index.js                          # Barrel exports
├── hooks/                            # Lógica de negocio
│   ├── index.js                      # Arquitectura refactorizada
│   ├── useSupplierProducts.js        # Facade principal ⭐
│   ├── useSupplierProductsBase.js    # CRUD base (CRÍTICO) ⚠️
│   ├── useSupplierProductFilters.js  # Filtros especializados
│   ├── useProductForm.js             # Formularios
│   └── useLazyProducts.js            # UI lazy loading
├── pages/                            # Interfaces principales
│   ├── home/ProviderHome.jsx         # Dashboard
│   ├── my-products/MyProducts.jsx    # Gestión productos
│   ├── my-products/AddProduct.jsx    # CRUD productos
│   └── SupplierProfile.jsx           # Perfil
└── components/                       # Componentes modulares
    └── dashboard-summary/
```

- **Flujo de datos principal:**
```
UI Components → useSupplierProducts (Facade) → {
  useSupplierProductsBase (CRUD) → Supabase
  useSupplierProductFilters (Filtros) → Local State
} → Reactive Updates → UI Re-render
```

- **Puntos de entrada:**
  - `useSupplierProducts`: Hook principal facade
  - `ProviderHome`: Dashboard principal
  - `MyProducts`: Gestión de productos
  - `AddProduct`: CRUD de productos

- **Puntos de salida:**
  - APIs consistentes por hook especializado
  - Componentes reutilizables modulares
  - Estados reactivos para UI

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| zustand | ^4.x | Estado global de productos | CRÍTICO - Core del state management | Redux Toolkit, Jotai |
| supabase-js | ^2.x | CRUD, Storage, Real-time | CRÍTICO - Toda la persistencia | Firebase, AWS Amplify |
| @mui/material | ^5.x | UI components complejos | ALTO - Toda la interfaz | Chakra UI, Ant Design |
| react | ^18.x | Hooks y lifecycle | CRÍTICO - Base del sistema | Ninguna viable |
| framer-motion | ^10.x | Animaciones de productos | MEDIO - UX mejorada | React Spring |
| lodash | ^4.x | Utilidades de datos | BAJO - Formateo y filtros | Native JS functions |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| services/supabase | Importa | Cliente base de datos | CRÍTICO |
| services/uploadService | Importa | Gestión de imágenes y archivos | ALTO |
| services/productSpecificationsService | Importa | Especificaciones técnicas | MEDIO |
| utils/productActiveStatus | Importa | Lógica de negocio productos | ALTO |
| styles/dashboardThemeCore | Importa | Temas y estilos | MEDIO |
| marketplace/utils/formatters | Importa | Formateo de datos | BAJO |

## 6. 🧩 API del módulo

#### Hook principal (useSupplierProducts):
```jsx
// Uso completo del hook facade
const {
  // Datos
  products,           // Array de productos raw
  filteredProducts,   // Productos filtrados
  uiProducts,         // Productos formateados para UI
  stats,              // Estadísticas calculadas
  
  // Estados
  loading,            // Estado de carga general
  error,              // Errores del sistema
  operationStates,    // Estados granulares { creating, updating, deleting }
  
  // Filtros
  searchTerm,         // Término de búsqueda
  categoryFilter,     // Filtro de categoría
  statusFilter,       // Filtro por estado
  stockFilter,        // Filtro por stock
  priceRange,         // Rango de precios
  dateRange,          // Rango de fechas
  sortBy,             // Campo de ordenamiento
  sortOrder,          // Dirección de ordenamiento
  activeFiltersCount, // Cantidad de filtros activos
  
  // Acciones CRUD
  loadProducts,       // (supplierId) => Promise
  createProduct,      // (productData) => Promise
  updateProduct,      // (productId, updates) => Promise
  deleteProduct,      // (productId) => Promise
  
  // Acciones de filtros
  setSearchTerm,      // (term) => void
  setCategoryFilter,  // (category) => void
  setStatusFilter,    // (status) => void
  setStockFilter,     // (stock) => void
  setPriceRange,      // ({ min, max }) => void
  setDateRange,       // ({ start, end }) => void
  setSorting,         // (field, order) => void
  clearFilters,       // () => void
  setPresetFilter,    // (preset) => void
  
  // Utilidades
  getProductById,     // (productId) => Product
  getFiltersSummary,  // () => Object
  clearError,         // () => void
  reset,              // () => void
} = useSupplierProducts();
```

#### Props detalladas de componentes principales:

**ProviderHome**
| Prop | Tipo | Requerido | Valor por defecto | Descripción | Ejemplo |
|------|------|-----------|------------------|-------------|---------|
| Ninguna | - | - | - | Componente autónomo con hooks internos | `<ProviderHome />` |

**MyProducts**  
| Prop | Tipo | Requerido | Valor por defecto | Descripción | Ejemplo |
|------|------|-----------|------------------|-------------|---------|
| Ninguna | - | - | - | Componente autónomo con gestión completa | `<MyProducts />` |

**AddProduct**
| Prop | Tipo | Requerido | Valor por defecto | Descripción | Ejemplo |
|------|------|-----------|------------------|-------------|---------|
| Ninguna | - | - | - | Detecta modo edición via URL params | `<AddProduct />` |

#### Estructura de datos principales:

**Product Object:**
```typescript
interface Product {
  productid: string;
  productnm: string;
  description: string;
  category: string;
  price: number;
  productqty: number;
  supplier_id: string;
  minimum_purchase: number;
  negotiable: boolean;
  product_type: string;
  is_active: boolean;
  createddt: string;
  updateddt: string;
  priceTiers: PriceTier[];
  images: ProductImage[];
  delivery_regions: DeliveryRegion[];
}

interface PriceTier {
  min_quantity: number;
  max_quantity?: number;
  price: number;
}

interface ProductImage {
  image_url: string;
  thumbnail_url?: string;
  is_primary: boolean;
  sort_order: number;
}
```

## 7. 🔍 Análisis de estado

- **Estado global usado:**
  - `useSupplierProductsBase`: Store principal de productos con Zustand
  - `useSupplierProductFilters`: Store de filtros y búsqueda
  - Supabase real-time subscriptions para sincronización
  - Upload progress states para imágenes

- **Estado local:**
  - Form states en `useProductForm`
  - UI states (modals, loading, errors) en componentes
  - Animation states en `useLazyProducts`
  - File upload progress y validation states

- **Persistencia:**
  - Supabase: Productos, imágenes, especificaciones, tramos de precio
  - Supabase Storage: Archivos de imágenes y thumbnails
  - LocalStorage: user_id para operaciones
  - No persiste filtros (se resetean en navegación)

- **Sincronización:**
  - Optimistic updates para mejor UX
  - Background processing para operaciones pesadas
  - Real-time updates via Supabase subscriptions
  - Cleanup automático de archivos huérfanos

- **Mutaciones:**
  - CRUD completo de productos
  - Gestión de imágenes con thumbnails automáticos
  - Operaciones batch para tramos de precio
  - Cleanup inteligente de archivos no utilizados

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - **Productos activos**: Stock >= compra mínima para ser considerado activo
  - **Límite de imágenes**: Máximo 5 imágenes por producto
  - **Tramos de precio**: Validación de rangos coherentes min/max cantidad
  - **Especificaciones**: Sistema clave-valor flexible por categoría
  - **Cleanup de archivos**: Eliminación automática de imágenes huérfanas
  - **Optimistic updates**: UI responde inmediatamente, sincroniza después

- **Validações:**
  - Campos requeridos: nombre, descripción, categoría
  - Validación de rangos de precio y cantidad
  - Validación de archivos de imagen (tipo, tamaño)
  - Validación de stock vs compra mínima
  - Validación cruzada de tramos de precio

- **Transformaciones de datos:**
  - Normalización de datos de productos con joins
  - Generación automática de thumbnails para imágenes
  - Formateo de precios y cantidades para UI
  - Mapeo de datos raw a objetos UI optimizados
  - Cálculo dinámico de estadísticas y métricas

- **Casos especiales:**
  - Productos sin imágenes (placeholder automático)
  - Manejo de archivos corruptos o no accesibles
  - Productos con stock 0 pero pedidos pendientes
  - Operaciones simultáneas sobre el mismo producto
  - Recovery de operaciones fallidas

- **Integraciones:**
  - Supabase (products, product_images, product_quantity_ranges)
  - Supabase Storage (product-images, product-images-thumbnails)
  - UploadService para procesamiento de imágenes
  - ProductSpecificationsService para specs técnicas

## 9. 🔄 Flujos de usuario

**Flujo principal - Crear producto:**
1. Usuario completa formulario → Validación client-side → Guardar producto básico
2. Producto aparece inmediatamente en UI → Background: subir imágenes → Generar thumbnails
3. Procesar especificaciones → Guardar tramos de precio → Actualizar UI final
4. Si error → Rollback parcial → Notificar usuario → Permitir reintento

**Flujo principal - Gestionar imágenes:**
1. Usuario sube imágenes → Validación de archivos → Preview inmediato
2. Background: comprimir imagen → Subir a storage → Generar thumbnail
3. Actualizar base de datos → Limpiar archivos huérfanos → Confirmar éxito
4. Si error → Mantener estado anterior → Mostrar error específico

**Flujo principal - Filtros y búsqueda:**
1. Usuario aplica filtro → Actualización instantánea de UI → Calcular estadísticas
2. Combinación de múltiples filtros → Aplicación secuencial → Conteo de resultados
3. Cambio de ordenamiento → Re-aplicar filtros → Mantener posición de scroll

**Flujos de error:**
- Error de red → Retry automático con backoff exponencial
- Error de validación → Highlight campos específicos → Ayuda contextual
- Error de upload → Conservar archivos locales → Permitir reintento
- Error de base de datos → Rollback de UI → Notificación detallada

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - CRUD completo de productos con todos los campos
  - Upload y procesamiento de imágenes múltiples
  - Filtros y búsqueda con combinaciones complejas
  - Estados de error y recovery
  - Operaciones concurrentes sobre productos
  - Cleanup de archivos huérfanos
  - Performance con grandes cantidades de productos

- **Mocks necesarios:**
  - Supabase client completo (CRUD, Storage, Real-time)
  - UploadService con simulación de progreso
  - File objects para testing de uploads
  - LocalStorage para user_id
  - Timer functions para debounce y delays

- **Datos de prueba:**
  - Productos con diferentes estados (activo, inactivo, sin stock)
  - Imágenes válidas e inválidas (tamaño, formato)
  - Tramos de precio con casos edge (rangos solapados)
  - Especificaciones con caracteres especiales
  - Datos de proveedores con diferentes permisos

- **Escenarios de error:**
  - Network timeouts durante uploads
  - Storage limits exceeded
  - Concurrent modifications
  - Invalid file formats
  - Database constraint violations
  - Insufficient permissions

## 11. 🚨 Puntos críticos para refactor

- **Código legacy identificado:**
  - `useSupplierProductsBase.js` es extremadamente complejo (961 LOC)
  - Lógica de cleanup de imágenes podría ser un servicio separado
  - Algunos métodos violan Single Responsibility Principle

- **Antipatrones detectados:**
  - Hook monolítico con demasiadas responsabilidades
  - Lógica de UI mezclada con lógica de datos en algunos lugares
  - Dependencias circulares potenciales entre hooks
  - Error handling inconsistente entre diferentes operaciones

- **Oportunidades de mejora prioritarias:**
  1. **Dividir useSupplierProductsBase** en hooks especializados:
     - `useProductCRUD` (operaciones básicas)
     - `useProductImages` (gestión de imágenes)
     - `useProductCleanup` (limpieza de archivos)
  
  2. **Implementar TypeScript** para mejor type safety y DX
  
  3. **Extraer lógica de negocio** a servicios pures sin dependencias de React
  
  4. **Standardizar error handling** con error boundaries y estrategias consistentes

- **Riesgos identificados:**
  - Dependencia crítica de Supabase sin abstraction layer
  - Lógica de cleanup compleja puede causar pérdida de datos
  - Performance issues con grandes volúmenes de productos
  - State management complejo puede causar bugs sutiles

- **Orden de refactor recomendado:**
  1. Extraer lógica de imágenes a hook separado (ALTO IMPACTO)
  2. Implementar abstraction layer para Supabase (MEDIO IMPACTO)  
  3. Migrar a TypeScript gradualmente (BAJO IMPACTO)
  4. Optimizar performance con virtualization (ALTO IMPACTO)

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance**: Hook base es computacionalmente pesado con muchos productos
- **Memoria**: Posibles memory leaks en subscriptions y timers
- **Escalabilidad**: No implementa paginación server-side
- **Compatibilidad**: Dependencia fuerte de features modernas de React
- **Concurrencia**: Manejo básico de operaciones simultáneas

#### Configuración requerida:
- **Variables de entorno:**
  - `VITE_SUPABASE_URL`: URL de la instancia Supabase
  - `VITE_SUPABASE_ANON_KEY`: Clave pública de Supabase
  - Storage buckets configurados: `product-images`, `product-images-thumbnails`

- **Inicialización requerida:**
  - Supabase client configurado
  - RLS policies configuradas para productos
  - Storage policies para upload de imágenes
  - Triggers de base de datos para updateddt

- **Permisos necesarios:**
  - Proveedor debe tener user_id en localStorage
  - RLS permite solo acceso a productos propios
  - Storage permite upload solo en carpetas del proveedor

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles manejados:**
  - Información de productos y precios
  - Imágenes y documentos del proveedor
  - Datos de inventario y stock
  - Especificaciones técnicas

- **Validaciones de seguridad implementadas:**
  - RLS en todas las tablas relacionadas
  - Validación de ownership en operaciones CRUD
  - Sanitización de uploads de archivos
  - Rate limiting implícito via UI debouncing

- **Permisos y roles:**
  - Solo el proveedor propietario puede modificar sus productos
  - Admins pueden ver pero require permisos especiales para modificar
  - Buyers solo lectura via API pública

- **Auditoría implementada:**
  - Timestamps automáticos (createddt, updateddt)
  - Logs implícitos via Supabase audit
  - Tracking de cambios en imágenes
  - Error logging para debugging

## 14. 📚 Referencias y documentación

- **Documentación técnica relacionada:**
  - [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
  - [Zustand State Management](https://github.com/pmndrs/zustand)
  - [MUI Components Library](https://mui.com/)

- **Decisiones de arquitectura:**
  - Facade pattern elegido para simplificar API del hook principal
  - Zustand sobre Redux por simplicidad y mejor performance
  - Optimistic updates para mejor UX en operaciones CRUD
  - Background processing para no bloquear UI

- **Recursos externos:**
  - Supabase Storage para escalabilidad de imágenes
  - CDN automático via Supabase para mejor performance
  - Thumbnail generation en el cliente para reducir costos

## 15. 🎨 Ejemplos de uso avanzados

### Ejemplo 1: Uso básico completo
```jsx
import { useSupplierProducts } from '@/domains/supplier';

function ProductsManager() {
  const {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    setSearchTerm,
    setCategoryFilter
  } = useSupplierProducts();

  const handleCreateProduct = async (productData) => {
    const result = await createProduct({
      productnm: 'Producto Nuevo',
      description: 'Descripción detallada',
      category: 'Tabaquería',
      price: 1000,
      productqty: 50,
      minimum_purchase: 1,
      imagenes: [file1, file2], // File objects
      priceTiers: [
        { cantidad: 1, precio: 1000 },
        { cantidad: 10, precio: 900 }
      ]
    });
    
    if (result.success) {
      console.log('Producto creado:', result.product);
    }
  };

  return (
    <div>
      <SearchInput onChange={setSearchTerm} />
      <CategoryFilter onChange={setCategoryFilter} />
      {loading && <ProductsSkeleton />}
      {error && <ErrorAlert error={error} />}
      <ProductsList products={products} />
    </div>
  );
}
```

### Ejemplo 2: Gestión avanzada de imágenes
```jsx
import { useSupplierProducts } from '@/domains/supplier';

function ProductImageManager({ productId }) {
  const { updateProduct, operationStates } = useSupplierProducts();
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleImageUpload = async (files) => {
    // Validación client-side
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size < 5 * 1024 * 1024
    );

    const result = await updateProduct(productId, {
      imagenes: [
        ...existingImageUrls, // Mantener existentes
        ...validFiles        // Agregar nuevas
      ]
    });

    if (result.success) {
      console.log('Imágenes actualizadas');
    }
  };

  const isUpdating = operationStates.updating[productId];

  return (
    <ImageUploader
      onUpload={handleImageUpload}
      loading={isUpdating}
      maxFiles={5}
      acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
    />
  );
}
```

### Ejemplo 3: Filtros y búsqueda avanzada
```jsx
import { useSupplierProducts } from '@/domains/supplier';

function AdvancedProductFilters() {
  const {
    searchTerm,
    categoryFilter,
    statusFilter,
    priceRange,
    activeFiltersCount,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setPriceRange,
    setPresetFilter,
    clearFilters,
    getFiltersSummary
  } = useSupplierProducts();

  const filtersSummary = getFiltersSummary();

  return (
    <Box>
      {/* Búsqueda por texto */}
      <SearchField
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar por nombre, descripción..."
      />

      {/* Filtros preestablecidos */}
      <ButtonGroup>
        <Button onClick={() => setPresetFilter('recent')}>
          Productos Recientes
        </Button>
        <Button onClick={() => setPresetFilter('low-stock')}>
          Stock Bajo
        </Button>
        <Button onClick={() => setPresetFilter('high-price')}>
          Precio Alto
        </Button>
      </ButtonGroup>

      {/* Filtros personalizados */}
      <FilterGroup>
        <CategorySelect
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
        <StatusSelect
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <PriceRangeSlider
          value={priceRange}
          onChange={setPriceRange}
        />
      </FilterGroup>

      {/* Resumen de filtros */}
      <Chip
        label={`${activeFiltersCount} filtros activos`}
        onDelete={activeFiltersCount > 0 ? clearFilters : undefined}
      />
      
      <FiltersSummary summary={filtersSummary} />
    </Box>
  );
}
```

### Ejemplo 4: Manejo de errores y loading states
```jsx
import { useSupplierProducts } from '@/domains/supplier';

function ProductsWithErrorHandling() {
  const {
    products,
    loading,
    error,
    operationStates,
    loadProducts,
    clearError
  } = useSupplierProducts();

  const supplierId = localStorage.getItem('user_id');

  // Manejo de errores específicos
  useEffect(() => {
    if (error) {
      const errorHandlers = {
        'Network Error': () => {
          toast.error('Error de conexión. Reintentando...');
          setTimeout(() => loadProducts(supplierId), 3000);
        },
        'Unauthorized': () => {
          toast.error('Sesión expirada');
          navigate('/login');
        },
        'Validation Error': () => {
          toast.error('Datos inválidos');
        }
      };

      const handler = errorHandlers[error] || (() => {
        toast.error(`Error: ${error}`);
      });

      handler();
    }
  }, [error]);

  // Renderizado condicional basado en estados
  if (loading && products.length === 0) {
    return <ProductsSkeletonLoader />;
  }

  if (error && products.length === 0) {
    return (
      <ErrorState
        error={error}
        onRetry={() => loadProducts(supplierId)}
        onClearError={clearError}
      />
    );
  }

  return (
    <ProductsList
      products={products}
      operationStates={operationStates}
      showLoadingOverlay={loading}
    />
  );
}
```

## 16. 🔄 Guía de migración

- **Desde versión anterior:**
  - Actualizar imports de hooks individuales a hook facade
  - Migrar de `useSupplierProductsStore` a `useSupplierProducts`
  - Actualizar manejo de estados de operaciones
  - Revisar lógica de filtros que cambió estructura

- **Breaking changes identificados:**
  - API del hook principal cambió completamente
  - Estados de operaciones ahora están anidados en `operationStates`
  - Filtros se aplicaron automáticamente (no requiere llamada manual)
  - Estructura de datos de productos incluye campos adicionales

- **Checklist de migración:**
  - [ ] Actualizar imports a `useSupplierProducts`
  - [ ] Refactorizar componentes que usan hooks viejos
  - [ ] Actualizar tests para nueva API
  - [ ] Verificar funcionalidad de filtros
  - [ ] Testear flujos de CRUD completos
  - [ ] Validar manejo de imágenes y cleanup

- **Rollback plan:**
  - Mantener hooks legacy en paralelo durante transición
  - Feature flags para alternar entre versiones
  - Monitoring de errores aumentado durante migración
  - Plan de rollback automático si errores > 5%

## 17. 📋 Metadatos del documento

- **Creado:** 23/07/2025
- **Última actualización:** 23/07/2025
- **Versión del código:** Sprint-3.0 branch (post-refactor)
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 30/07/2025
- **Cobertura del análisis:** 100% de archivos del dominio supplier

---

## 🎯 Conclusiones del análisis ultra profundo - Dominio Supplier

### ✅ Fortalezas identificadas:
1. **Refactorización exitosa**: Nueva arquitectura con facade pattern mejora significativamente la API
2. **Separación de responsabilidades**: Hooks especializados para CRUD, filtros, y formularios
3. **Optimistic updates**: Excelente UX con actualizaciones inmediatas
4. **Gestión robusta de imágenes**: Sistema completo con thumbnails y cleanup automático
5. **Filtros avanzados**: Sistema flexible y potente de filtros combinables

### ⚠️ Áreas críticas que requieren atención inmediata:
1. **useSupplierProductsBase.js**: 961 LOC - Requiere división urgente en hooks especializados
2. **Gestión de memoria**: Posibles leaks en subscriptions y timers
3. **Performance**: No escala bien con grandes volúmenes de productos
4. **Error handling**: Inconsistente entre diferentes operaciones
5. **Testing coverage**: Falta cobertura comprehensiva de casos edge

### 🔥 Hotspots críticos identificados:
1. **Líneas 400-600 useSupplierProductsBase.js**: Lógica de imágenes extremadamente compleja
2. **Líneas 700-900 useSupplierProductsBase.js**: Cleanup de archivos con múltiples paths de error
3. **Hook useSupplierProducts**: Podría beneficiarse de memoización adicional
4. **Operaciones concurrentes**: Manejo básico puede causar race conditions

### 🚀 Recomendaciones de refactor prioritarias:

#### Prioridad CRÍTICA (Sprint actual):
1. **Extraer useProductImages**: Separar toda la lógica de imágenes (~300 LOC)
2. **Extraer useProductCleanup**: Separar lógica de limpieza de archivos (~200 LOC)
3. **Implementar error boundaries**: Manejo consistente de errores
4. **Añadir memoización**: Optimizar re-renders innecesarios

#### Prioridad ALTA (Próximo sprint):
1. **Migrar a TypeScript**: Empezar por interfaces de datos
2. **Implementar paginación**: Server-side pagination para escalabilidad
3. **Añadir tests comprehensivos**: Coverage >80% de casos críticos
4. **Abstraer Supabase**: Layer de abstracción para reducir acoplamiento

#### Prioridad MEDIA (Próximas 2-3 sprints):
1. **Virtualization**: Para listas grandes de productos
2. **Service Workers**: Para operaciones offline
3. **Real-time updates**: Mejorar sincronización multi-usuario
4. **Performance monitoring**: Métricas y alertas de performance

El dominio supplier, aunque recién refactorizado, muestra una arquitectura sólida pero requiere división adicional del hook base para mantener la complejidad bajo control y asegurar escalabilidad a largo plazo.
