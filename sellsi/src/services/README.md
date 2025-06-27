# Servicios (`src/services`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

La carpeta **services** centraliza los servicios de acceso a datos, lógica de negocio y utilidades de integración con Supabase en Sellsi. Incluye servicios para carrito, pedidos, especificaciones de producto, uploads y conexión con la base de datos. Estos servicios abstraen la comunicación con el backend, optimizan la gestión de recursos y estandarizan la lógica de negocio para features y hooks.

## Listado de archivos principales

| Archivo                        | Tipo      | Descripción breve                                                      |
|------------------------------- |----------|-----------------------------------------------------------------------|
| cartService.js                 | Servicio | Operaciones de carrito: CRUD, migración, sincronización y checkout.    |
| orderService.js                | Servicio | Gestión de pedidos: consulta, actualización de estado, estadísticas.   |
| productSpecificationsService.js| Servicio | Manejo de especificaciones técnicas de productos.                      |
| supabase.js                    | Utilidad  | Cliente y helpers para conexión y autenticación con Supabase.          |
| uploadService.js               | Servicio | Subida y gestión de archivos e imágenes en Supabase Storage.           |

## Relaciones internas del módulo

- Todos los servicios utilizan el cliente `supabase` para queries y storage.
- `cartService` y `orderService` gestionan el ciclo completo de compra y pedidos.
- `productSpecificationsService` abstrae la lógica de ficha técnica y especificaciones.
- `uploadService` centraliza la subida y gestión de archivos (PDF, imágenes).

Árbol de relaciones simplificado:

```
cartService.js
└─ supabase.js
orderService.js
└─ supabase.js
productSpecificationsService.js
└─ supabase.js
uploadService.js
└─ supabase.js
```

## API y métodos principales

### cartService
- `getOrCreateActiveCart(userId)`
- `getCartItems(cartId)`
- `addItemToCart(cartId, product, quantity)`
- `updateItemQuantity(cartId, productId, newQuantity)`
- `removeItemFromCart(cartId, productId)`
- `clearCart(cartId)`
- `checkout(cartId, checkoutData)`
- `migrateLocalCart(userId, localCartItems)`

### orderService
- `getOrdersForSupplier(supplierId, filters)`
- `updateOrderStatus(orderId, newStatus, additionalData)`
- `getOrderStats(supplierId, period)`
- `searchOrders(supplierId, searchText)`

### productSpecificationsService
- `getProductSpecifications(productId)`
- `updateProductSpecifications(productId, specifications)`
- `insertProductSpecifications(productId, specifications, category)`
- `deleteProductSpecifications(productId)`

### uploadService
- `uploadPDF(file, productId, supplierId)`
- `uploadMultiplePDFs(files, productId, supplierId)`
- `deletePDF(filePath)`
- `uploadImage(file, productId, supplierId)`
- `initializeBuckets()`

### supabase.js
- `supabase` (cliente)
- `testAuth()`
- `testConnection()`

## Dependencias externas e internas

- **Externas:** supabase-js, utilidades de entorno (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
- **Internas:** Utilidades de validación y helpers de `src/utils`.

## Consideraciones técnicas y advertencias

- Todos los servicios asumen una estructura de tablas y buckets específica en Supabase.
- Los métodos de upload validan tamaño, tipo y nombre de archivos para evitar errores y conflictos.
- El servicio de especificaciones está limitado a una especificación por producto (ver comentarios en el código).
- Los servicios están preparados para ser usados como singletons y no deben duplicarse.

## Puntos de extensión o reutilización

- Los servicios pueden ser extendidos para nuevas entidades, endpoints o buckets.
- Pueden integrarse en hooks, features o flujos de onboarding para centralizar la lógica de negocio.

## Ejemplos de uso

### Obtener o crear carrito activo

```js
import { cartService } from 'src/services/cartService';

const cart = await cartService.getOrCreateActiveCart(userId);
```

### Subir imagen de producto

```js
import UploadService from 'src/services/uploadService';

const result = await UploadService.uploadImage(file, productId, supplierId);
```

---

Este README documenta la estructura, relaciones y funcionamiento de los servicios de Sellsi. Consulta los comentarios en el código para detalles adicionales y advertencias sobre integración con Supabase.
