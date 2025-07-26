# Landing Page Hooks (`src/features/landing_page/hooks`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Esta carpeta contiene hooks personalizados que encapsulan la lógica avanzada de la landing page de Sellsi. Permiten gestionar carruseles, animaciones numéricas y lógica de la página principal de forma desacoplada y reutilizable.

- **Problema que resuelve:** Centraliza y desacopla la lógica de UI interactiva y animaciones de la landing page, facilitando componentes más simples y mantenibles.
- **Arquitectura:** Hooks independientes, cada uno especializado en una funcionalidad (carrusel, count-up, lógica de home).
- **Función principal:** Proveer lógica reutilizable para animaciones, carruseles y control de estado de la landing page.
- **Flujo de datos:**
  - Los hooks exponen estado y funciones para ser consumidos por componentes de la landing page.

## 2. Listado de archivos
| Archivo            | Tipo    | Descripción breve                                 | Responsabilidad principal                |
|--------------------|---------|--------------------------------------------------|------------------------------------------|
| useHomeLogic.jsx   | Hook    | Lógica principal de la home, scroll, animaciones  | Orquestar lógica y referencias de home   |
| useCountUp.js      | Hook    | Animación numérica tipo count-up                  | Animar números de estadísticas           |
| useCarousel.js     | Hook    | Lógica de carrusel con auto-avance                | Controlar slides y navegación            |
| index.js           | Barrel  | Re-exporta hooks de la carpeta                    | Organización y acceso centralizado       |

## 3. Relaciones internas del módulo
- `useHomeLogic` consume `useCarousel` y `useCountUp` para orquestar la lógica de la página principal.
- Los hooks pueden ser usados de forma independiente en otros componentes.

```
useHomeLogic
├── useCarousel
└── useCountUp
```

## 4. API y props principales de los hooks

### useHomeLogic(scrollTargets)
- **Propósito:** Orquestar referencias de scroll, carruseles y animaciones numéricas de la home.
- **Estados y efectos:**
  - Referencias de scroll (quienesSomosRef, serviciosRef, etc.)
  - Estado de slides y animaciones
- **API:**
  - currentSlide, nextSlide, prevSlide, goToSlide (carrusel principal)
  - currentPromoSlide, nextPromoSlide, ... (carrusel de promo)
  - animatedNumbers (estadísticas animadas)
  - formatNumber (formateo de números)

### useCountUp(targets, duration, delay)
- **Propósito:** Animar números de estadísticas de forma suave.
- **Estados:** Números animados actuales.
- **API:** Devuelve objeto con los valores animados.

### useCarousel(totalSlides, autoAdvanceInterval)
- **Propósito:** Gestionar slides y auto-avance de carruseles.
- **Estados:** currentSlide.
- **API:** nextSlide, prevSlide, goToSlide.

## 5. Hooks personalizados
Todos los archivos son hooks reutilizables, diseñados para ser usados en la landing page o en otros módulos de UI interactiva.

## 6. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `react`             | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/icons-material`| >=5    | Iconos para UI             | Visualización          |

## 7. Consideraciones técnicas
- Los hooks están desacoplados y pueden usarse en otros contextos.
- El hook de carrusel soporta auto-avance y reinicio de intervalos.
- El hook de count-up usa requestAnimationFrame para animaciones suaves.

## 8. Puntos de extensión
- Los hooks pueden adaptarse para otros módulos de animación o UI interactiva.
- El diseño permite agregar nuevas animaciones o lógica de slides fácilmente.

## 9. Ejemplos de uso

### Usar lógica de home
```jsx
import useHomeLogic from './hooks/useHomeLogic';
const { currentSlide, animatedNumbers } = useHomeLogic();
```

### Usar animación count-up
```js
import useCountUp from './hooks/useCountUp';
const numbers = useCountUp({ ventas: 1000 });
```

### Usar carrusel
```js
import useCarousel from './hooks/useCarousel';
const { currentSlide, nextSlide } = useCarousel(5, 5000);
```

## 10. Rendimiento y optimización
- Animaciones optimizadas con requestAnimationFrame.
- Carruseles con auto-avance desacoplado y reinicio inteligente.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
