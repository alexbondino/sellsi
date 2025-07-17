# Services

## 1. Resumen funcional del módulo
El módulo `services` centraliza la lógica de acceso a datos y comunicación con el backend en Sellsi. Proporciona funciones y objetos para interactuar con Supabase, gestionar productos, pedidos, perfiles, uploads y lógica administrativa, desacoplando la UI de la capa de datos.

- **Problema que resuelve:** Abstrae la comunicación con APIs y bases de datos, facilitando el mantenimiento y la reutilización.
- **Arquitectura:** Servicios independientes, cada uno con responsabilidad única y API clara.
- **Patrones:** Service layer, separación de concerns, single responsibility.
- **Flujo de datos:** Componentes/hooks → Servicios → Backend/Supabase → Respuesta → Componentes/hooks.

## 2. Listado de archivos
| Archivo                        | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------------- |-----------|---------------------------------------------|------------------------------------------|
| adminPanelService.js           | Servicio  | Lógica de administración y panel de control | Acciones administrativas y métricas      |
| cartService.js                 | Servicio  | Gestión de carrito de compras               | CRUD de carrito y lógica de usuario      |
| orderService.js                | Servicio  | Gestión de pedidos y estados                | CRUD de pedidos, filtros y estadísticas  |
| productSpecificationsService.js| Servicio  | Gestión de especificaciones de productos    | CRUD de specs y validaciones             |
| profileService.js              | Servicio  | Gestión de datos de perfil de usuario       | CRUD de perfil y validaciones            |
| supabase.js                    | Servicio  | Cliente Supabase y helpers de conexión      | Acceso a base de datos y storage         |
| uploadService.js               | Servicio  | Lógica de subida de archivos e imágenes     | Upload y gestión de media                |
| thumbnailService.js            | Servicio  | Gestión de thumbnails automáticos           | Generación y gestión de thumbnails       |
| README.md                      | Doc       | Documentación de los servicios              | Explicar uso y API de cada servicio      |

## 3. Relaciones internas del módulo
```
Servicios independientes
├── supabase.js (base de datos y storage)
├── orderService.js (usa supabase.js)
├── cartService.js (usa supabase.js)
├── profileService.js (usa supabase.js)
├── uploadService.js (usa supabase.js)
└── adminPanelService.js, productSpecificationsService.js
```
- Comunicación por funciones y promesas.
- No hay dependencias circulares.

## 4. Props y API de los servicios principales
### adminPanelService
- Funciones: métricas, gestión de usuarios, reportes.

### cartService
- Funciones: `addToCart`, `removeFromCart`, `getCart`, `clearCart`, etc.

### orderService
- Funciones: `getOrdersForSupplier`, `updateOrderStatus`, `getOrderStats`, `searchOrders`, etc.

### productSpecificationsService
- Funciones: CRUD de especificaciones, validaciones.

### profileService
- Funciones: `getProfile`, `updateProfile`, validaciones.

### supabase.js
- Exporta el cliente Supabase y helpers de conexión.

### uploadService
- Funciones: `uploadImage`, `removeImage`, helpers de media.

**Notas:**
- Cada servicio expone una API clara y desacoplada de la UI.

## 5. Hooks personalizados
No se exportan hooks, solo funciones y objetos de servicio.

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| supabase-js         | ^2.x      | Acceso a base de datos y storage | Core                     |
| ...internas         | -         | Helpers y utilidades             | Lógica y seguridad       |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- Los servicios asumen configuración previa de Supabase.
- Manejo de errores y validaciones depende de cada función.
- No implementan cache global ni reintentos automáticos.

### Deuda técnica relevante
- [MEDIA] Mejorar manejo de errores y reporting.
- [MEDIA] Modularizar helpers y validaciones comunes.

## 8. Puntos de extensión
- Agregar servicios para nuevas entidades o integraciones externas.
- Exponer hooks para lógica reactiva avanzada.

## 9. Ejemplos de uso
### Ejemplo básico
```js
import { orderService } from './orderService';

const orders = await orderService.getOrdersForSupplier(supplierId);
```

## 10. Rendimiento y optimización
- Servicios optimizados para uso con promesas y async/await.
- Áreas de mejora: cache local, reintentos y logging avanzado.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
