# Supplier Home

## 1. Resumen funcional del módulo
El módulo `supplier/home` implementa el dashboard principal para proveedores en Sellsi. Permite visualizar métricas clave (productos, ventas, stock, solicitudes), acceder a gráficos de ventas mensuales y gestionar productos. Utiliza carga perezosa (lazy loading) para optimizar el rendimiento y ofrece una experiencia visual moderna y responsiva.

- **Problema que resuelve:** Centraliza la gestión y monitoreo de la actividad del proveedor en un solo panel.
- **Arquitectura:** Componente principal `ProviderHome`, subcomponentes de resumen y gráficos, hooks de datos y tema personalizado.
- **Patrones:** Lazy loading, fallback visual, separación de lógica y presentación, hooks personalizados.
- **Flujo de datos:** Hook de datos → Estado local → Renderizado condicional → UI.

## 2. Listado de archivos
| Archivo                        | Tipo        | Descripción                                 | Responsabilidad principal                |
|-------------------------------|-------------|---------------------------------------------|------------------------------------------|
| ProviderHome.jsx               | Componente  | Dashboard principal del proveedor           | Orquestar UI, métricas y gráficos        |
| hooks/useSupplierDashboard.js  | Hook        | Obtención y gestión de datos del dashboard  | Lógica de datos y estado                 |
| dashboard-summary/DashboardSummary.jsx | Componente | Resumen de métricas clave           | Mostrar KPIs y alertas                   |
| ../../ui/graphs/BarChart.jsx   | Componente  | Gráfico de ventas mensuales                 | Visualización de datos                   |
| ../../layout/SideBar.jsx       | Componente  | Barra lateral de navegación                 | Navegación y contexto visual             |
| ../../../styles/dashboardThemeCore.js | Estilo | Tema visual personalizado para dashboard    | Theming y estilos                        |

## 3. Relaciones internas del módulo
```
ProviderHome
├── useSupplierDashboard (hook)
├── DashboardSummary (lazy)
├── MonthlySalesChart (lazy)
├── SideBarProvider
└── dashboardThemeCore (theme)
```
- Comunicación por props y hooks.
- Renderizado condicional y fallback visual con Suspense/Skeleton.

## 4. Props de los componentes
### ProviderHome
No recibe props externas (es punto de entrada del dashboard proveedor).

### DashboardSummary
| Prop         | Tipo    | Requerido | Descripción                         |
|--------------|---------|-----------|-------------------------------------|
| products     | array   | Sí        | Lista de productos                  |
| totalSales   | number  | Sí        | Total de ventas                     |
| outOfStock   | number  | Sí        | Cantidad de productos sin stock     |
| weeklyRequests | array | Sí        | Solicitudes semanales               |

### MonthlySalesChart
| Prop | Tipo  | Requerido | Descripción                |
|------|-------|-----------|----------------------------|
| data | array | Sí        | Datos de ventas mensuales  |

**Notas:**
- Los fallbacks visuales usan Skeleton para mejorar la UX durante la carga.

## 5. Hooks personalizados
### `useSupplierDashboard()`
**Propósito:** Obtener y gestionar los datos del dashboard del proveedor (productos, ventas, stock, solicitudes, etc.).

**Estados y efectos principales:**
- `products`, `sales`, `productStocks`, `weeklyRequests`, `monthlyData`, `totalSales`, `loading`, `error`.
- Efectos: Fetch de datos al montar el componente.

**API que expone:**
- Ver tabla anterior.

**Ejemplo de uso básico:**
```jsx
const {
  products,
  sales,
  productStocks,
  weeklyRequests,
  monthlyData,
  totalSales,
  loading,
  error,
} = useSupplierDashboard();
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |
| @mui/material       | ^5.x      | Componentes UI                   | Experiencia visual       |
| @mui/icons-material | ^5.x      | Iconografía                      | UX                       |
| ...internas         | -         | Hooks y helpers de datos         | Lógica y seguridad       |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- El dashboard depende de la disponibilidad de datos y servicios backend.
- El botón "Nuevo Producto" no implementa acción por defecto (requiere integración).
- El lazy loading puede demorar la carga inicial en conexiones lentas.

### Deuda técnica relevante
- [MEDIA] Modularizar aún más los subcomponentes para testing.
- [MEDIA] Mejorar manejo de errores y feedback visual.

## 8. Puntos de extensión
- Integrar acciones directas (alta de producto, edición, etc.).
- Agregar más widgets o métricas personalizadas.
- Internacionalización de textos y métricas.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import ProviderHome from './ProviderHome';

function App() {
  return <ProviderHome />;
}
```

## 10. Rendimiento y optimización
- Lazy loading de componentes pesados para reducir el bundle inicial.
- Fallback visual con Skeleton y Suspense.
- Áreas de mejora: memoización de datos, code splitting avanzado.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
