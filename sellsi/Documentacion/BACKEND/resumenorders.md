# 1.- MyOrdersPage.jsx - Análisis Técnico

## Funcionalidad Principal
La página `MyOrdersPage` permite a los proveedores gestionar sus pedidos pendientes y completados. Funciona como un dashboard centralizado para todas las operaciones relacionadas con órdenes.

## Lógica del Componente

### Estado y Store (Zustand)
- **useOrdersStore**: Store global que maneja el estado de pedidos
  - `orders`: Array de pedidos del proveedor
  - `loading`: Estado de carga
  - `statusFilter`: Filtro activo por estado
  - `error`: Manejo de errores
  - `initializeWithSupplier()`: Inicializa con ID del proveedor
  - `updateOrderStatus()`: Actualiza estado de pedidos
  - `getFilteredOrders()`: Obtiene pedidos filtrados

### Flujo de Autenticación
```jsx
const supplierId = localStorage.getItem('user_id'); // TEMPORAL
// TODO: Migrar a useAuth hook cuando esté disponible
```

### Gestión de Modales
Estado local `modalState` controla 5 tipos de acciones:
- **accept**: Aceptar pedido
- **reject**: Rechazar con motivo
- **dispatch**: Despachar con fecha estimada
- **deliver**: Confirmar entrega con documentos
- **chat**: Abrir conversación (pendiente implementación)

## Datos SQL Utilizados

### Estructura de Pedidos
```sql
-- Tabla principal: orders
{
  order_id: string,
  supplier_id: string,
  status: 'Pendiente'|'Aceptado'|'Rechazado'|'En Ruta'|'Entregado',
  estimated_delivery_date: date,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Operaciones de Estado
```sql
-- updateOrderStatus() ejecuta:
UPDATE orders 
SET status = $1, 
    estimated_delivery_date = $2,
    message = $3,
    updated_at = NOW()
WHERE order_id = $4 AND supplier_id = $5;
```

### Filtros de Estado
- **Todos**: Sin filtro WHERE
- **Pendiente**: `WHERE status = 'Pendiente'`
- **Aceptado**: `WHERE status = 'Aceptado'`
- **En Ruta**: `WHERE status = 'En Ruta'`
- **Entregado**: `WHERE status = 'Entregado'`
- **Rechazado**: `WHERE status = 'Rechazado'`

## Flujo de Datos

### Inicialización
1. Obtener `supplierId` de localStorage
2. Llamar `initializeWithSupplier(supplierId)`
3. Store ejecuta consulta: `SELECT * FROM orders WHERE supplier_id = $1`
4. Actualizar estado global con datos recibidos

### Acciones de Pedido
1. Usuario hace clic en acción (aceptar/rechazar/etc.)
2. Abrir modal con formulario específico
3. Usuario completa datos y confirma
4. `handleModalSubmit()` procesa según tipo:
   - Validaciones client-side
   - Llamada a `updateOrderStatus()`
   - Backend ejecuta UPDATE SQL
   - Refrescar datos del store
   - Mostrar banner de confirmación

### Filtrado en Tiempo Real
- `getFilteredOrders()` aplica filtro local sin consultas adicionales
- Usa array de pedidos ya cargado en memoria
- Filtra por `statusFilter` seleccionado

## Manejo de Errores
- **Error de autenticación**: Banner de error + reload sugerido
- **Error de carga**: Componente de error con retry
- **Error de operación**: Banner específico + log en consola
- **Boundary Error**: SupplierErrorBoundary envuelve componente

## Características Técnicas
- **SSR Compatible**: ThemeProvider para Material-UI
- **Responsive**: Breakpoints xs/md/lg/xl
- **Performance**: Lazy loading con filtros locales
- **UX**: Estados de carga, banners informativos, validaciones
- **Escalabilidad**: Store centralizado, componentes reutilizables

## Dependencias Backend
- Tabla `orders` con relación a `suppliers`
- Endpoints para CRUD de pedidos
- Sistema de autenticación por supplier_id
- Posible integración con sistema de chat (futuro)

---

# 2.- BuyerOrders.jsx - Análisis Técnico

## Funcionalidad Principal
La página `BuyerOrders` permite a los compradores visualizar el historial completo de sus pedidos realizados. Muestra el estado de entrega calculado automáticamente basado en tiempos de entrega y acciones del proveedor.

## Lógica del Componente

### Hook Personalizado (useBuyerOrders)
- **useBuyerOrders(buyerId)**: Hook personalizado que encapsula la lógica de datos
  - `orders`: Array de pedidos del comprador
  - `loading`: Estado de carga
  - `error`: Manejo de errores
  - `getProductImage()`: Obtiene imagen del producto
  - `formatDate()`: Formatea fechas
  - `formatCurrency()`: Formatea moneda

### Cálculo Automático de Estados
```jsx
const getProductStatus = (item, orderDate, orderStatus) => {
  // Lógica de precedencia:
  // 1. Estado del supplier (delivered/rejected)
  // 2. Cálculo por delivery_days + fecha de compra
  // 3. Estado por defecto según orderStatus
}
```

### Sistema de Estados Visuales
- **3 Chips por producto**: Pendiente → En Tránsito → Entregado
- **Colores dinámicos**: warning/info/success según estado activo
- **Opacidad visual**: Estados inactivos con 50% opacidad

## Datos SQL Utilizados

### Estructura de Datos del Comprador
```sql
-- Consulta principal:
SELECT o.*, oi.*, p.*, s.name as supplier_name, p.delivery_regions
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
JOIN suppliers s ON p.supplier_id = s.supplier_id
WHERE o.buyer_id = $1
ORDER BY o.created_at DESC;
```

### Tablas Relacionadas
```sql
-- orders: Pedido principal
{
  order_id: string,
  buyer_id: string,
  total_amount: decimal,
  created_at: timestamp,
  status: string
}

-- order_items: Items individuales del pedido
{
  cart_items_id: string,
  order_id: string,
  product_id: string,
  quantity: integer,
  price_at_addition: decimal
}

-- products: Información del producto
{
  product_id: string,
  name: string,
  images: json[],
  delivery_regions: json[] -- [{ region: string, delivery_days: number }]
}
```

## Lógica de Entrega Automática

### Cálculo de Fechas
1. **Obtener delivery_days**: De `product.delivery_regions` por región del comprador
2. **Fecha estimada**: `created_at + delivery_days`
3. **Comparación**: Si `Date.now() >= fechaEstimada` → Estado "Entregado"

### Precedencia de Estados
```jsx
// Orden de precedencia:
1. supplier_status === 'delivered' → ENTREGADO (prevalece)
2. supplier_status === 'rejected' → RECHAZADO (prevalece)
3. now >= estimatedDeliveryDate → ENTREGADO (automático)
4. supplier_status === 'in_transit'|'accepted' → EN_TRANSITO
5. default → PENDIENTE
```

### Manejo de Regiones
- **Default**: 7 días si no se encuentra región específica
- **TODO**: Obtener región real del comprador (actualmente hardcodeado)
- **Flexibilidad**: Cada producto puede tener diferentes tiempos por región

## Características de UX

### Visualización Jerárquica
- **Orden principal**: Header con número y total
- **Sub-productos**: Cards anidadas con detalles individuales
- **Estados independientes**: Cada producto tiene su propio tracking

### Interactividad
- **Hover effects**: Elevación de tarjetas (translateY + shadow)
- **Responsive**: Breakpoints xs/md/lg/xl
- **Estados vacíos**: Mensaje motivacional para primera compra

## Diferencias con MyOrdersPage

### Enfoque
- **MyOrdersPage**: Gestión activa (supplier)
- **BuyerOrders**: Visualización pasiva (buyer)

### Estados
- **Supplier**: Manual (accept/reject/dispatch/deliver)
- **Buyer**: Automático por fechas + acciones supplier

### Interacciones
- **Supplier**: Modales, formularios, acciones
- **Buyer**: Solo lectura, tracking visual

## Performance y Escalabilidad
- **Hook personalizado**: Encapsula lógica compleja
- **Cálculos client-side**: Estados computados localmente
- **Imágenes lazy**: Avatar con fallback
- **Memo potencial**: Para cálculos de estado repetitivos



