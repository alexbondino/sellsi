# Módulo: view_page

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Implementa la vista detallada de especificaciones técnicas de productos en Sellsi, proporcionando una interfaz especializada para mostrar información técnica complementaria a la ficha principal del producto.
- **Arquitectura de alto nivel:** Arquitectura Clean con separación clara entre presentación (TechnicalSpecs.jsx) y lógica de negocio (useTechnicalSpecs.js), siguiendo principios de responsabilidad única y desacoplamiento.
- **Función y casos de uso principales:** Renderizar especificaciones técnicas detalladas, manejar estados de carga y error, proporcionar navegación contextual y integrar con sistema de autenticación.
- **Flujo de datos/información simplificado:**
  ```
  URL params → useTechnicalSpecs → Supabase fetch → Estado local → TechnicalSpecs UI
       ↓                ↓                ↓              ↓
  Navigation ← Callbacks ← User Actions ← Component Events
  ```

---

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| TechnicalSpecs.jsx | Componente | Vista de especificaciones técnicas con layout responsive | Presentación de datos técnicos y manejo de eventos UI |
| hooks/useTechnicalSpecs.js | Hook | Lógica de negocio para fetch de datos y navegación | Gestión de estado, efectos y callbacks de navegación |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
TechnicalSpecs.jsx (Presentational)
└── useTechnicalSpecs.js (Container Logic)
    ├── React Router (navegación)
    ├── Supabase (datos)
    └── React hooks (estado)
```

**Patrones de comunicación:**
- **Container/Presentational**: Hook maneja lógica, componente maneja UI
- **Custom hooks**: Encapsulación de efectos y estado complejo
- **Callback patterns**: Comunicación ascendente via props
- **URL-driven state**: Estado derivado de parámetros de ruta

---

## 4. Props de los componentes
### TechnicalSpecs
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `isLoggedIn` | `boolean` | No | Estado de autenticación del usuario para mostrar acciones disponibles |

**Notas importantes:** El componente es casi auto-contenido, toda la lógica se maneja via hook interno.

## 5. Hooks personalizados
### `useTechnicalSpecs()`

**Propósito:** Centraliza la lógica de negocio para la vista de especificaciones técnicas, incluyendo fetch de datos, navegación contextual y manejo de estados.

**Estados y efectos principales:**
- Gestiona carga de producto desde URL params y Supabase
- Maneja contexto de navegación (origen de la vista)
- Controla estados de loading, error y datos cargados
- Efectos para fetch inicial y cleanup de navegación

**API que expone:**
- `product`: Datos del producto cargado
- `loading`: Estado de carga actual
- `originRoute`: Ruta de origen detectada
- `handleClose()`: Navegar de vuelta al origen
- `handleAddToCart(product)`: Agregar producto al carrito
- `handleBuyNow(product)`: Acción de compra rápida

**Ejemplo de uso básico:**
```jsx
const {
  product, 
  loading, 
  originRoute,
  handleClose, 
  handleAddToCart
} = useTechnicalSpecs();
```

---

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@mui/material` | >=5 | Componentes UI y layout | Alto - Interfaz visual completa |
| `react-router-dom` | >=6 | Navegación y parámetros URL | Alto - Funcionalidad de routing crítica |
| `@supabase/supabase-js` | >=2 | Fetch de datos de productos | Alto - Fuente de datos principal |
| `react-hot-toast` | >=2 | Notificaciones de acciones | Medio - Feedback de usuario |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Dependencia de URL**: Funcionalidad depende de parámetros válidos en la ruta
- **Navegación contextual**: Lógica compleja para detectar origen de navegación
- **Fallback a mocks**: Puede mostrar datos simulados si Supabase falla

### Deuda técnica relevante:
- **[MEDIA]** Mejorar detección de contexto de navegación
- **[BAJA]** Unificar manejo de estados de error
- **[BAJA]** Optimizar re-renders innecesarios

## 8. Puntos de extensión
- **Componente extensible**: Fácil agregar nuevas secciones de especificaciones
- **Hook reutilizable**: Lógica adaptable para otros tipos de vistas detalladas
- **Sistema de callbacks**: Permite customizar acciones sin modificar el core

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import TechnicalSpecs from 'src/features/marketplace/view_page/TechnicalSpecs';

function ProductSpecsPage() {
  return <TechnicalSpecs isLoggedIn={user !== null} />;
}
```

### Ejemplo más completo:
```jsx
import { TechnicalSpecs } from 'src/features/marketplace/view_page';
import { useAuth } from 'src/context/AuthContext';

function ProductDetailRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <TechnicalSpecs 
      isLoggedIn={!!user}
    />
  );
}
```

## 10. Rendimiento y optimización
- **Separación de responsabilidades**: UI pura separada de lógica de negocio
- **Memoización de callbacks**: Previene re-renders innecesarios
- **Lazy loading**: Carga diferida de datos de producto
- **Optimizaciones pendientes**: Cache de productos visitados, mejores skeleton loaders

## 11. Actualización
- **Última actualización:** 18/07/2025
- Última actualización: `03/07/2025`
