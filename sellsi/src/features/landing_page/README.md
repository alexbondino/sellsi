# Landing Page Module (`src/features/landing_page`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Este módulo implementa la landing page principal de Sellsi, orquestando la presentación, navegación y animaciones de la página de inicio. Centraliza la composición de secciones clave, lógica de UI interactiva y componentes visuales reutilizables.

- **Problema que resuelve:** Provee una experiencia de bienvenida atractiva, informativa y responsiva para nuevos usuarios y visitantes.
- **Arquitectura:** Basada en componentes presentacionales puros, hooks personalizados para lógica de UI, y un barrel para exportaciones limpias.
- **Función principal:** Mostrar la propuesta de valor, servicios, proveedores y estadísticas de Sellsi de forma visualmente atractiva y eficiente.
- **Flujo de datos:**
  - El componente `Home` orquesta la composición de secciones y consume hooks para lógica de navegación, animaciones y carruseles.

## 2. Listado de archivos
| Archivo                    | Tipo        | Descripción breve                                 | Responsabilidad principal                |
|----------------------------|-------------|--------------------------------------------------|------------------------------------------|
| Home.jsx                   | Componente  | Página principal, orquesta todas las secciones    | Composición y navegación principal       |
| HeroSection.jsx            | Componente  | Carrusel superior con CTAs y estadísticas         | Presentación inicial y animaciones       |
| ProvidersSection.jsx       | Componente  | Grid de proveedores destacados                   | Mostrar partners y logos                 |
| AboutUsSection.jsx         | Componente  | Sección "Quiénes somos"                          | Información corporativa                  |
| ServicesSection.jsx        | Componente  | Carrusel de servicios interactivo                | Mostrar servicios y beneficios           |
| StatisticCard.jsx          | Componente  | Tarjeta de estadística numérica                   | Visualización de métricas                |
| ProviderLogo.jsx           | Componente  | Logo de proveedor individual                      | Visualización de partners                |
| CarouselIndicator.jsx      | Componente  | Indicador visual de slides                        | Navegación de carruseles                 |
| CarouselNavigationButton.jsx| Componente | Botón de navegación para carruseles               | Control de slides                        |
| constants.jsx              | Constantes  | Datos y configuraciones de la landing page        | Centralización de datos                  |
| index.js                   | Barrel      | Exporta todos los componentes y hooks             | Organización y acceso centralizado       |

## 3. Relaciones internas del módulo
- `Home.jsx` importa y compone todas las secciones principales.
- Secciones como `HeroSection`, `ProvidersSection`, `AboutUsSection`, `ServicesSection` son componentes hijos directos de `Home`.
- `StatisticCard`, `ProviderLogo`, `CarouselIndicator`, `CarouselNavigationButton` son componentes UI reutilizables.
- Hooks de `./hooks` son consumidos por `Home` y secciones para lógica de UI.

```
Home
├── HeroSection
├── ProvidersSection
├── AboutUsSection
├── ServicesSection
├── StatisticCard
├── ProviderLogo
├── CarouselIndicator
├── CarouselNavigationButton
└── (usa hooks de ./hooks/*)
```

## 4. Props de los componentes
### Home
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| scrollTargets  | ref            | No        | Referencias para navegación por scroll       |

### AboutUsSection
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| quienesSomosRef| ref            | No        | Referencia para scroll navigation            |

### ServicesSection
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| serviciosRef   | ref            | No        | Referencia para scroll navigation            |

### StatisticCard
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| stat           | objeto         | Sí        | Objeto con datos de la estadística           |

### ProviderLogo
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| src            | string         | Sí        | Ruta de la imagen del logo                   |
| alt            | string         | Sí        | Texto alternativo para accesibilidad         |

### CarouselIndicator / CarouselNavigationButton
| Prop           | Tipo           | Requerido | Descripción                                 |
|----------------|----------------|-----------|---------------------------------------------|
| active         | boolean        | Sí        | Si el slide está activo                      |
| onClick        | función        | Sí        | Handler para cambiar de slide                |

## 5. Hooks personalizados
- Ver carpeta `./hooks` para lógica avanzada de carruseles, animaciones y home.

## 6. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `react`             | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`     | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5    | Iconos para UI             | Visualización          |

## 7. Consideraciones técnicas
- Arquitectura desacoplada: lógica en hooks, UI en componentes puros.
- Navegación y scroll gestionados por referencias y hooks.
- Carruseles y animaciones optimizados para rendimiento.

## 8. Puntos de extensión
- Componentes y hooks pueden ser reutilizados en otras páginas o módulos.
- Fácil de extender con nuevas secciones o animaciones.

## 9. Ejemplos de uso

### Usar la landing page principal
```jsx
import { Home } from './landing_page';
<Home />
```

### Usar una sección individual
```jsx
import { AboutUsSection } from './landing_page';
<AboutUsSection />
```

## 10. Rendimiento y optimización
- Memoización de componentes y hooks.
- Lazy loading de imágenes y secciones pesadas.
- Animaciones optimizadas con requestAnimationFrame.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
