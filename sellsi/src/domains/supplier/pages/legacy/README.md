# Supplier

## 1. Resumen funcional del módulo
El módulo `supplier` centraliza la experiencia y gestión de los proveedores en Sellsi. Permite administrar perfil, productos, pedidos, ventas y métricas clave desde un panel robusto y flexible. Integra operaciones CRUD, visualización de KPIs, solicitudes semanales y edición avanzada del perfil empresarial, todo sincronizado con el backend.

- **Problema que resuelve:** Proporciona a los proveedores un entorno integral para gestionar su operación en Sellsi.
- **Arquitectura:** Componentes principales (dashboard, perfil, productos, pedidos), hooks personalizados, stores Zustand y servicios de backend.
- **Patrones:** State management, optimistic UI, separación de lógica y presentación, barrel de exportaciones.
- **Flujo de datos:** Acciones UI → Hooks/Stores → Backend → Actualización de estado → Renderizado.

## 2. Listado de archivos principales
| Archivo                                 | Tipo        | Descripción                                                      |
|------------------------------------------|-------------|------------------------------------------------------------------|
| SupplierProfile.jsx                      | Componente  | Vista y edición del perfil del proveedor.                        |
| home/ProviderHome.jsx                    | Componente  | Dashboard principal del proveedor, métricas y acceso rápido.      |
| home/hooks/useSupplierDashboard.js       | Hook        | Lógica de carga de métricas, ventas, productos y solicitudes.     |
| home/hooks/useSupplierProductsStore.js   | Store/Hook  | Estado global de productos, CRUD y filtros.                      |
| home/dashboard-summary/DashboardSummary.jsx | Componente| Resumen visual de KPIs y solicitudes.                            |
| home/dashboard-summary/SummaryCards.jsx  | Componente  | Tarjetas de estadísticas clave.                                  |
| my-orders/ordersStore.js                 | Store/Hook  | Estado global y acciones de pedidos.                             |
| my-products/MyProducts.jsx               | Componente  | Listado y gestión principal de productos.                        |
| my-products/ProductForm.jsx              | Componente  | Formulario de alta/edición de producto.                          |
| hooks/useLazyProducts.js                 | Hook        | Lazy loading, paginación e infinite scroll de productos.          |
| index.js                                | Barrel      | Exporta componentes y hooks principales del módulo.               |

## 3. Relaciones internas del módulo
```
ProviderHome.jsx
├─ home/hooks/useSupplierDashboard.js
├─ home/dashboard-summary/DashboardSummary.jsx
│   ├─ SummaryCards.jsx
│   └─ RequestListWrapper.jsx
├─ ui/graphs/BarChart.jsx
└─ layout/SideBar.jsx
SupplierProfile.jsx
└─ profile/Profile.jsx
home/hooks/useSupplierProductsStore.js
my-orders/ordersStore.js
my-products/MyProducts.jsx
my-products/ProductForm.jsx
hooks/useLazyProducts.js
```
- Comunicación por props, hooks y stores.
- Renderizado reactivo y modular.

## 4. Props y API de los componentes principales
| Componente         | Prop              | Tipo     | Requerida | Descripción                                      |
|--------------------|-------------------|----------|-----------|--------------------------------------------------|
| SupplierProfile    | onProfileUpdated  | function | No        | Callback tras actualizar el perfil.               |
| ProviderHome       | -                 | -        | -         | No recibe props, usa hooks internos.              |
| DashboardSummary   | products          | array    | Sí        | Lista de productos del proveedor.                 |
|                    | totalSales        | number   | Sí        | Total de ventas del mes.                         |
|                    | outOfStock        | number   | Sí        | Cantidad de productos sin stock.                  |
|                    | weeklyRequests    | array    | Sí        | Solicitudes de la semana.                         |
| SummaryCards       | products, totalSales, outOfStock, weeklyRequests | varios | Sí | Datos para KPIs. |
| MyProducts         | -                 | -        | -         | No recibe props, gestiona productos internamente. |
| ProductForm        | product           | object   | No        | Producto a editar (si aplica).                    |
|                    | onSave            | function | Sí        | Callback para guardar cambios.                    |
|                    | onCancel          | function | Sí        | Callback para cancelar edición.                   |

## 5. Hooks personalizados y stores
### useSupplierDashboard.js
Carga productos, ventas, stock y solicitudes semanales del proveedor autenticado. Expone: `products`, `sales`, `productStocks`, `weeklyRequests`, `monthlyData`, `totalSales`, `loading`, `error`.

### useSupplierProductsStore.js
Store Zustand para gestión global de productos del proveedor. Permite cargar, agregar, editar, eliminar productos, manejar imágenes y tramos de precio, aplicar filtros y búsquedas. Expone: `products`, `filteredProducts`, `loadProducts`, `addProduct`, `updateProduct`, `deleteProduct`, `applyFilters`, estados de carga y error.

### ordersStore.js
Store Zustand para gestión de pedidos: carga, filtrado, búsqueda, actualización de estado y estadísticas. Expone: `orders`, `loading`, `fetchOrders`, `updateOrderStatus`, `getFilteredOrders`, etc.

### useLazyProducts.js
Hook para lazy loading, paginación e infinite scroll de productos. Expone: `displayedProducts`, `isLoadingMore`, `hasMore`, `loadMore`, `scrollToTop`, `progress`.


## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| zustand             | ^4.x      | Manejo de estado global          | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| supabase-js         | ^2.x      | Persistencia y autenticación     | Backend/Auth             |
| ...internas         | -         | Servicios, helpers, contextos    | Lógica y backend         |

## 7. Consideraciones técnicas y advertencias
- El módulo asume integración con Supabase para autenticación, storage y queries.
- Los stores están preparados para integración futura con sincronización y optimistic updates.
- La subida de imágenes y logo utiliza rutas únicas para evitar conflictos.
- Si se modifica la estructura de productos, pedidos o usuario, revisar los mapeos en hooks y servicios.
- El dashboard puede requerir ajustes si cambian los KPIs o la estructura de ventas/solicitudes.

## 8. Puntos de extensión o reutilización
- Los stores y hooks pueden ser reutilizados en otras vistas de gestión o reportes.
- Los componentes de dashboard y summary pueden extenderse para nuevos KPIs o widgets.
- El barrel permite importar hooks y componentes desde un solo punto.
- El componente de perfil puede integrarse en onboarding o edición avanzada.

## 9. Ejemplos de uso
### Usar el dashboard principal del proveedor
```jsx
import { ProviderHome } from 'src/features/supplier';

<ProviderHome />
```

### Usar el perfil del proveedor con callback
```jsx
import { SupplierProfile } from 'src/features/supplier';

<SupplierProfile onProfileUpdated={refrescarDatos} />
```

### Usar el store global de productos
```js
import { useSupplierProductsStore } from 'src/features/supplier/home/hooks/useSupplierProductsStore';

const { products, addProduct, updateProduct } = useSupplierProductsStore();
```

### Usar el store de pedidos
```js
import { useOrdersStore } from 'src/features/supplier/my-orders/ordersStore';

const orders = useOrdersStore(state => state.getFilteredOrders());
```

---

Este README documenta la estructura, relaciones y funcionamiento del módulo Supplier. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa los hooks y helpers, ya que son el corazón de la lógica de proveedor en Sellsi.

## 10. Rendimiento y optimización
- Lazy loading y paginación en productos para eficiencia.
- Stores Zustand para estado global reactivo y optimista.
- Áreas de mejora: sincronización en tiempo real, memoización avanzada y modularización de widgets.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
