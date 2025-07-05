# Buyer Module (`src/features/buyer`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

El módulo **Buyer** centraliza y orquesta la experiencia de compra para usuarios compradores en Sellsi. Permite navegar el marketplace, gestionar el carrito, consultar historial de pedidos, analizar rendimiento y editar el perfil. Resuelve la dispersión de lógica de usuario comprador, facilitando el desarrollo mantenible y escalable.

## 2. Listado de archivos principales

| Archivo                  | Tipo         | Descripción breve                                                      |
|------------------------- |-------------|-----------------------------------------------------------------------|
| BuyerCart.jsx            | Componente  | Carrito de compras avanzado, maneja productos, descuentos y envíos.   |
| BuyerOrders.jsx          | Componente  | Muestra el historial de pedidos del comprador.                        |
| BuyerPerformance.jsx     | Componente  | Estadísticas y métricas de compra del usuario.                        |
| BuyerProfile.jsx         | Componente  | Perfil del comprador, datos personales y de envío.                    |
| MarketplaceBuyer.jsx     | Componente  | Vista principal del marketplace para compradores.                     |
| index.js                 | Barrel      | Exporta todos los componentes y hooks del módulo.                     |

## 3. Relaciones internas del módulo

- `index.js` centraliza todas las exportaciones.
- `MarketplaceBuyer.jsx` importa hooks y secciones de marketplace.
- `BuyerCart.jsx` usa hooks propios (`useCartStore`) y componentes de `./cart`.
- `BuyerProfile.jsx` consume servicios de perfil y componentes de perfil global.
- `BuyerPerformance.jsx` y `BuyerOrders.jsx` usan componentes auxiliares y temas globales.

```
index.js
├── MarketplaceBuyer
├── BuyerCart (usa useCartStore, ./cart/*)
├── BuyerOrders
├── BuyerPerformance
└── BuyerProfile
```

## 4. Props de los componentes

### BuyerProfile
| Prop            | Tipo     | Requerido | Descripción                                 |
|-----------------|----------|-----------|---------------------------------------------|
| onProfileUpdated| función  | No        | Callback al actualizar el perfil            |

### BuyerCart, BuyerOrders, BuyerPerformance, MarketplaceBuyer
- No requieren props externas relevantes; gestionan su propio estado o consumen hooks/contexto.

## 5. Hooks personalizados

- **useCartStore**: Estado global del carrito, expone funciones para agregar, quitar, actualizar productos y limpiar el carrito. Permite suscripción reactiva a cambios del carrito.
  ```js
  const { items, addItem, removeItem, clearCart } = useCartStore();
  ```

## 6. Dependencias externas e internas

- **Externas:**
  - `@mui/material`, `@mui/icons-material`: UI y componentes visuales.
  - `react-hot-toast`, `framer-motion`, `lodash.debounce`, `react-intersection-observer`: UX avanzada y optimización.
  - `supabase-js`: Servicios de backend y autenticación.
- **Internas:**
  - `../marketplace/*`, `../profile/Profile`, `../../services/*`, `../../styles/dashboardThemeCore`.
  - Contextos globales: ThemeProvider, SideBarProvider.

## 7. Consideraciones técnicas y advertencias

- El carrito implementa lazy loading y memoización para alto rendimiento.
- Algunos datos (pedidos, performance) pueden estar mockeados; conectar a servicios reales según necesidad.
- El perfil de usuario mapea campos de backend a frontend, revisar cambios en la estructura de datos.
- Deuda técnica: modularización de hooks y componentes auxiliares del carrito.

## 8. Puntos de extensión o reutilización

- `useCartStore` y componentes de `./cart` pueden ser reutilizados en otros módulos.
- `BuyerProfile` puede adaptarse para otros roles de usuario.
- El layout y lógica de `MarketplaceBuyer` es fácilmente extensible.

## 9. Ejemplos de uso

### Importar y usar el carrito de compras
```jsx
import { BuyerCart } from './buyer';

function MiCarrito() {
  return <BuyerCart />;
}
```

### Usar el perfil de comprador con callback
```jsx
import { BuyerProfile } from './buyer';

<BuyerProfile onProfileUpdated={() => alert('Perfil actualizado!')} />
```

## 10. Rendimiento y optimización
- Lazy loading de componentes pesados.
- Memoización de configuraciones y estilos.
- Hooks desacoplados para evitar renders innecesarios.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
