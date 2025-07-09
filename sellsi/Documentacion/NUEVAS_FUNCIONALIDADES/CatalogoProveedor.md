# Catálogo del Proveedor - Documentación

## Resumen

Se ha implementado la funcionalidad del catálogo del proveedor que permite a los usuarios navegar desde una tarjeta de proveedor en el marketplace hacia una vista detallada de todos los productos de dicho proveedor.

## Archivos Modificados/Creados

### 1. Nuevo Componente: `ProviderCatalog.jsx`
- **Ubicación**: `src/features/marketplace/ProviderCatalog.jsx`
- **Propósito**: Componente principal que muestra el catálogo de productos de un proveedor específico
- **Funcionalidades**:
  - Muestra información del proveedor (logo, nombre, descripción)
  - Lista todos los productos del proveedor
  - Botón de "Volver atrás" que regresa al marketplace con el switch activado
  - Breadcrumbs para navegación
  - Manejo de estados de carga y error

### 2. Modificación: `ProductCardProviderContext.jsx`
- **Cambio**: Implementación de navegación al catálogo del proveedor
- **Funcionalidad**: El botón "REVISAR CATÁLOGO" ahora navega correctamente a la nueva ruta

### 3. Modificación: `App.jsx`
- **Cambios**:
  - Agregado lazy loading para `ProviderCatalog`
  - Nueva ruta protegida: `/catalog/:userNm/:userId`
  - Actualización de rutas de dashboard para incluir `/catalog`

### 4. Modificación: `useMarketplaceLogic.jsx`
- **Cambios**:
  - Detección automática del estado `providerSwitchActive` desde navegación
  - Activación automática del switch de proveedores cuando se regresa del catálogo

## Estructura de Rutas

### Nueva Ruta
```
/catalog/:userNm/:userId
```

**Parámetros**:
- `userNm`: Nombre del usuario/proveedor (slug-format)
- `userId`: ID único del proveedor

**Ejemplo**:
```
/catalog/juan-perez/12345
```

## Flujo de Navegación

1. **Desde Marketplace**: Usuario está en `/buyer/marketplace` o `/supplier/marketplace`
2. **Click en "REVISAR CATÁLOGO"**: Se navega a `/catalog/user-name/user-id`
3. **En el Catálogo**: Se muestra información del proveedor y sus productos
4. **Botón "Volver atrás"**: Regresa al marketplace con el switch activado para ver proveedores

## Estados de Navegación

Se utiliza el `state` de React Router para mantener la información de navegación:

```javascript
navigate('/catalog/user-name/user-id', {
  state: { from: '/buyer/marketplace' }
});

// Al volver:
navigate('/buyer/marketplace', {
  state: { providerSwitchActive: true }
});
```

## Funcionalidades Implementadas

### 1. Información del Proveedor
- Logo del proveedor
- Nombre del proveedor
- Descripción mock: "Venta mayorista de alimentos saludables..."
- Contador de productos: "Este proveedor tiene X productos publicados"

### 2. Lista de Productos
- Muestra todos los productos activos del proveedor
- Utiliza `ProductCard` con tipo "buyer"
- Funcionalidad de agregar al carrito

### 3. Navegación Inteligente
- Breadcrumbs dinámicos
- Botón de volver que conserva el contexto
- Activación automática del switch de proveedores

### 4. Manejo de Errores
- Estados de carga
- Manejo de errores de red
- Fallbacks para proveedores no encontrados

## Integración con el Sistema Existente

### Base de Datos
- Utiliza la tabla `users` para información del proveedor
- Utiliza la tabla `products` para obtener productos del proveedor
- Utiliza la tabla `product_quantity_ranges` para los rangos de precios por cantidad
- Mapea correctamente los campos de la base de datos:
  - `productid` → `id`
  - `productnm` → `nombre`
  - `productqty` → `stock`
  - `createddt` → para ordenamiento por fecha

### Compatibilidad
- Conserva TopBar, SideBar y BottomBar
- Utiliza el sistema de autenticación existente
- Compatible con el sistema de carrito existente

### Responsividad
- Diseño responsivo para móvil y desktop
- Utiliza Material-UI para consistencia visual

## Próximas Mejoras

1. **Filtros en el Catálogo**: Permitir filtrar productos dentro del catálogo
2. **Ordenamiento**: Opciones de ordenamiento específicas para el catálogo
3. **Información Adicional**: Más detalles del proveedor (contacto, ubicación, etc.)
4. **Estadísticas**: Métricas del proveedor (valoraciones, tiempo de respuesta, etc.)

## Correcciones Realizadas

### Problema de Relación de Base de Datos
- **Error inicial**: Intentaba hacer JOIN con tabla `product_price_tiers` que no existe
- **Solución**: Usar tabla `product_quantity_ranges` y consultas separadas
- **Mapeo correcto**: Ajustado para usar los nombres de campos correctos según schema de Supabase

### Campos Mapeados
```javascript
// Mapeo de campos de Supabase a formato esperado por componentes
{
  id: product.productid,
  nombre: product.productnm,
  imagen: product.product_images?.[0]?.image_url, // Primera imagen
  precio: product.price,
  stock: product.productqty,
  priceTiers: convertedQuantityRanges,
  supplier_id: product.supplier_id, // Para getProductImageUrl
  productid: product.productid, // Para getProductImageUrl
}
```

### Consultas de Base de Datos
- **Productos con imágenes**: `products` con JOIN a `product_images`
- **Rangos de precios**: `product_quantity_ranges` consultada por separado
- **Información del proveedor**: `users` tabla principal

### Diseño y Layout
- **Ancho máximo**: 1450px (igual que ProductPageView)
- **Centrado**: Contenedor centrado automáticamente
- **Responsive**: Adaptado para diferentes tamaños de pantalla
- **Bordes y sombras**: Consistente con el resto de la aplicación

## Notas Técnicas

- El componente está optimizado con memoización de React
- Utiliza lazy loading para mejorar el rendimiento
- Maneja correctamente los estados de carga y error
- Integrado con el sistema de toast para notificaciones

## Testing

Para probar la funcionalidad:

1. Navegar al marketplace (buyer o supplier)
2. Activar el switch de proveedores
3. Hacer clic en "REVISAR CATÁLOGO" en cualquier tarjeta de proveedor
4. Verificar que se muestra la información del proveedor y sus productos
5. Usar el botón "Volver atrás" para regresar al marketplace
6. Verificar que el switch de proveedores permanece activo
