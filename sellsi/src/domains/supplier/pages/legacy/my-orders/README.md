# Supplier My Orders

## 1. Resumen funcional del módulo
El módulo `supplier/my-orders` gestiona el estado, filtrado, búsqueda y actualización de pedidos para proveedores en Sellsi. Utiliza Zustand para el manejo de estado global, integrando acciones asíncronas con el backend, filtros avanzados, sincronización y utilidades para la gestión profesional de órdenes.

- **Problema que resuelve:** Permite a proveedores visualizar, filtrar, buscar y actualizar pedidos de forma eficiente y sincronizada con el backend.
- **Arquitectura:** Store Zustand centralizado, integración con servicios, selectores y acciones optimistas.
- **Patrones:** State management, optimistic UI, separación de lógica y presentación, selectores reutilizables.
- **Flujo de datos:** Acciones UI → Store Zustand → Backend → Actualización de estado → Renderizado.

## 2. Listado de archivos
| Archivo         | Tipo    | Descripción                                 | Responsabilidad principal                |
|-----------------|---------|---------------------------------------------|------------------------------------------|
| ordersStore.js  | Store   | Estado global y acciones de pedidos         | Manejo de pedidos, filtros y sincronía   |
| ...componentes  | Componente | Visualización y edición de pedidos      | Renderizado y acciones de usuario        |
| ...servicios    | Servicio | orderService: comunicación backend         | Fetch y actualización de datos           |

## 3. Relaciones internas del módulo
```
ordersStore (Zustand)
├── orderService (servicio backend)
├── Selectores y acciones
└── Componentes de UI (consumen el store)
```
- Comunicación por hooks y acciones del store.
- Renderizado reactivo según estado global.

## 4. Props y API del store
### useOrdersStore
No recibe props externas, se accede vía hook Zustand.

**API expuesta:**
- Estado: `orders`, `loading`, `statusFilter`, `error`, `supplierId`, `stats`, `lastFetch`, `isRefreshing`
- Acciones: `initializeWithSupplier`, `fetchOrders`, `refreshOrders`, `fetchStats`, `updateOrderStatus`, `setStatusFilter`, `searchOrders`, `clearOrders`
- Selectores: `getFilteredOrders`, `getOrderById`, `getStatusSummary`, `hasRecentData`

**Notas:**
- Los componentes consumen el store vía hook para obtener datos y disparar acciones.

## 5. Hooks personalizados
No se exportan hooks personalizados adicionales, solo el store Zustand.

**Ejemplo de uso básico:**
```jsx
import { useOrdersStore } from './ordersStore';

function OrdersList() {
  const { orders, loading, fetchOrders, setStatusFilter } = useOrdersStore();

  useEffect(() => {
    fetchOrders();
  }, []);

  // ...renderizado de pedidos y filtros
}
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| zustand             | ^4.x      | Manejo de estado global          | Core                     |
| ...internas         | -         | orderService, helpers            | Lógica y backend         |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- El store depende de la correcta configuración del `supplierId`.
- Acciones optimistas pueden requerir rollback en caso de error.
- Filtros y mapeos de estado deben mantenerse sincronizados con el backend.

### Deuda técnica relevante
- [MEDIA] Mejorar feedback de errores y sincronización en tiempo real.
- [MEDIA] Modularizar selectores y acciones para testing.

## 8. Puntos de extensión
- Integrar notificaciones en tiempo real (websockets).
- Agregar filtros y búsquedas avanzadas (por fecha, monto, etc.).
- Exponer hooks personalizados para lógica de UI compleja.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import { useOrdersStore } from './ordersStore';

function MyOrders() {
  const orders = useOrdersStore(state => state.getFilteredOrders());
  const loading = useOrdersStore(state => state.loading);

  if (loading) return <div>Cargando...</div>;

  return (
    <ul>
      {orders.map(order => (
        <li key={order.order_id}>{order.status} - {order.deliveryAddress.street}</li>
      ))}
    </ul>
  );
}
```

## 10. Rendimiento y optimización
- Uso de acciones optimistas para feedback inmediato.
- Selectores eficientes para filtrado y búsqueda.
- Áreas de mejora: sincronización en tiempo real y memoización avanzada.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
