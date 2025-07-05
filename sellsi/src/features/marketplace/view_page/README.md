# Módulo: view_page

> **Creado:** 03/07/2025  
> **Última actualización:** 03/07/2025

---

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Implementa la ficha técnica y vista detallada de un producto, desacoplando la lógica de negocio (fetch, navegación, carrito) de la UI y permitiendo navegación inteligente según el contexto de origen.
- **Arquitectura de alto nivel:** Componente UI puro (`TechnicalSpecs.jsx`) y hook personalizado (`useTechnicalSpecs.js`) para lógica de negocio, navegación y manejo de estado. Uso de Material UI y React Router.
- **Función y casos de uso principales:** Mostrar la ficha técnica de un producto, gestionar navegación de retorno, agregar al carrito y mostrar feedback de carga o error.
- **Flujo de datos/información simplificado:**
  - El hook obtiene el producto desde la URL, Supabase o mocks.
  - El componente renderiza la UI según el estado (cargando, error, producto encontrado).
  - Callbacks gestionan navegación y acciones de compra.

---

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción                                 | Responsabilidad principal                  |
|------------------------|-----------|---------------------------------------------|--------------------------------------------|
| TechnicalSpecs.jsx     | Componente| Ficha técnica de producto                   | Renderizar UI y delegar lógica al hook     |
| hooks/useTechnicalSpecs.js | Hook  | Lógica de negocio, fetch, navegación        | Manejar estado, navegación y acciones      |

---

## 3. Relaciones internas del módulo
- **Diagrama de dependencias:**
```
TechnicalSpecs
└── useTechnicalSpecs (hook)
```
- **Patrones de comunicación:** props y callbacks, navegación con React Router, estado local y global (carrito).
- **Relaciones clave:** El componente es UI puro y toda la lógica está en el hook.

---

## 4. Props de los componentes
### TechnicalSpecs
| Prop        | Tipo     | Requerido | Descripción                                 |
|-------------|----------|-----------|---------------------------------------------|
| isLoggedIn  | boolean  | No        | Indica si el usuario está autenticado       |

**Notas importantes:**
- El resto de la información y callbacks provienen del hook.

---

## 5. Hooks personalizados
### `useTechnicalSpecs()`
- **Propósito:** Manejar la lógica de negocio de la ficha técnica: fetch de producto, navegación inteligente, agregar al carrito, feedback de carga y error.
- **Estados y efectos principales:**
  - `product`: Producto actual
  - `loading`: Estado de carga
  - `originRoute`, `fromMyProducts`, `isFromBuyer`: Contexto de navegación
- **API que expone:**
  - `handleClose()`, `handleGoHome()`, `handleGoToMarketplace()`, `handleAddToCart()`, `handleBuyNow()`
- **Ejemplo de uso básico:**
```js
const {
  product, loading, originRoute, fromMyProducts,
  handleClose, handleGoHome, handleGoToMarketplace, handleAddToCart, handleBuyNow
} = useTechnicalSpecs();
```

---

## 6. Dependencias principales
| Dependencia           | Versión | Propósito                  | Impacto                |
|----------------------|---------|----------------------------|------------------------|
| `react`              | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`      | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5     | Iconos para UI             | Visualización          |
| `react-router-dom`   | >=6     | Routing y navegación       | Navegación             |
| `supabase-js`        | >=2     | Backend y autenticación    | Datos remotos          |
| `react-hot-toast`    | >=2     | Feedback visual            | UX y notificaciones    |

---

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- El fetch de producto depende de la URL y puede fallar si el slug es inválido.
- El origen de navegación se determina por prioridad (state, localStorage, referrer, default).
- El hook usa mocks si no hay datos reales.

### Deuda técnica relevante:
- [MEDIA] Mejorar manejo de errores y feedback visual.
- [MEDIA] Unificar lógica de navegación y persistencia de origen.

---

## 8. Puntos de extensión
- El componente puede extenderse para mostrar más información o integrar nuevos servicios.
- El hook puede adaptarse para otros flujos de detalle de producto.

---

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import TechnicalSpecs from './view_page/TechnicalSpecs';

function FichaProducto() {
  return <TechnicalSpecs isLoggedIn={true} />;
}
```

---

## 10. Rendimiento y optimización
- Separación total de UI y lógica de negocio.
- Memoización de handlers y estados en el hook.
- Áreas de mejora: optimizar fetch y manejo de errores.

---

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
