# Supplier Module (`src/features/supplier`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Supplier** centraliza la gestión de la experiencia del proveedor en Sellsi. Permite a los proveedores administrar su perfil, productos, ventas y solicitudes, así como visualizar métricas clave y acceder a herramientas de análisis. Resuelve la necesidad de un panel robusto y flexible para proveedores, integrando operaciones CRUD sobre productos, visualización de ventas, solicitudes semanales y edición avanzada del perfil empresarial.

## Listado de archivos principales

| Archivo                        | Tipo        | Descripción breve                                                      |
|------------------------------- |------------|-----------------------------------------------------------------------|
| SupplierProfile.jsx            | Componente | Vista y edición del perfil del proveedor, integración con Supabase.    |
| home/ProviderHome.jsx          | Componente | Dashboard principal del proveedor, métricas y acceso rápido.           |
| home/hooks/useSupplierDashboard.js | Hook   | Lógica de carga de métricas, ventas, productos y solicitudes.          |
| home/hooks/useSupplierProductsStore.js | Hook | Store global Zustand para productos, CRUD y filtros.                   |
| home/dashboard-summary/DashboardSummary.jsx | Componente | Resumen visual de KPIs y solicitudes.                                  |
| home/dashboard-summary/SummaryCards.jsx     | Componente | Tarjetas de estadísticas clave (productos, ventas, stock, solicitudes).|
| index.js                      | Barrel      | Exporta componentes y hooks principales del módulo.                    |

## Relaciones internas del módulo

- `ProviderHome.jsx` es el dashboard principal, orquesta la carga de datos con `useSupplierDashboard` y muestra KPIs con `DashboardSummary` y `SummaryCards`.
- `SupplierProfile.jsx` gestiona la edición y visualización del perfil, reutilizando el componente `Profile` y lógica de subida de logo.
- `useSupplierProductsStore.js` centraliza el estado y operaciones CRUD de productos, integrando subida de imágenes y tramos de precio.
- El barrel `index.js` permite importar componentes y hooks clave desde un solo punto.

Árbol de relaciones simplificado:

```
home/ProviderHome.jsx
├─ home/hooks/useSupplierDashboard.js
├─ home/dashboard-summary/DashboardSummary.jsx
│   ├─ SummaryCards.jsx
│   └─ RequestListWrapper.jsx
├─ ui/graphs/BarChart.jsx (ventas mensuales)
└─ layout/SideBar.jsx
SupplierProfile.jsx
└─ profile/Profile.jsx
home/hooks/useSupplierProductsStore.js
```

## Props de los componentes principales

| Componente         | Prop              | Tipo     | Requerida | Descripción                                      |
|--------------------|-------------------|----------|-----------|--------------------------------------------------|
| SupplierProfile    | onProfileUpdated  | function | No        | Callback tras actualizar el perfil.               |
| ProviderHome       | -                 | -        | -         | No recibe props, usa hooks internos.              |
| DashboardSummary   | products          | array    | Sí        | Lista de productos del proveedor.                 |
|                    | totalSales        | number   | Sí        | Total de ventas del mes.                         |
|                    | outOfStock        | number   | Sí        | Cantidad de productos sin stock.                  |
|                    | weeklyRequests    | array    | Sí        | Solicitudes de la semana.                         |
| SummaryCards       | products, totalSales, outOfStock, weeklyRequests | varios | Sí | Datos para KPIs. |

## Hooks personalizados

### useSupplierDashboard.js
Carga productos, ventas, stock y solicitudes semanales del proveedor autenticado. Expone: `products`, `sales`, `productStocks`, `weeklyRequests`, `monthlyData`, `totalSales`, `loading`, `error`.

### useSupplierProductsStore.js
Store Zustand para gestión global de productos del proveedor. Permite cargar, agregar, editar, eliminar productos, manejar imágenes y tramos de precio, aplicar filtros y búsquedas. Expone: `products`, `filteredProducts`, `loadProducts`, `addProduct`, `updateProduct`, `deleteProduct`, `applyFilters`, estados de carga y error.

## Dependencias externas e internas

- **Externas**: React, Zustand, Material-UI, Supabase, MUI X Charts.
- **Internas**: Servicios de `src/services/` (supabase, uploadService, productSpecificationsService), componentes de UI y layout, hooks personalizados.
- **Contextos/Providers**: Utiliza contextos para sidebar y temas de dashboard.

## Consideraciones técnicas y advertencias

- El módulo asume integración con Supabase para autenticación, storage y queries.
- El store de productos está preparado para integración futura con sincronización y optimistic updates.
- La subida de imágenes y logo utiliza rutas únicas para evitar conflictos.
- Si se modifica la estructura de productos o usuario, revisar los mapeos en hooks y servicios.
- El dashboard puede requerir ajustes si cambian los KPIs o la estructura de ventas/solicitudes.

## Puntos de extensión o reutilización

- El store de productos puede ser reutilizado en otras vistas de gestión o reportes.
- Los componentes de dashboard y summary pueden extenderse para nuevos KPIs o widgets.
- El barrel permite importar hooks y componentes desde un solo punto.
- El componente de perfil puede integrarse en onboarding o edición avanzada.

## Ejemplos de uso

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

---

Este README documenta la estructura, relaciones y funcionamiento del módulo Supplier. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa los hooks y helpers, ya que son el corazón de la lógica de proveedor en Sellsi.
