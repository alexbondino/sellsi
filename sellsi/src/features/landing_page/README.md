# Landing Page Module (`src/features/landing_page`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Landing Page** centraliza la experiencia de bienvenida y presentación de Sellsi. Su objetivo es captar la atención de nuevos usuarios, comunicar la propuesta de valor, mostrar proveedores, servicios y estadísticas clave, y facilitar la navegación hacia el marketplace y otras áreas relevantes. Resuelve el problema de la dispersión de la comunicación inicial y la falta de un punto de entrada visualmente atractivo y funcional para la plataforma.

## Listado de archivos principales

| Archivo                      | Tipo         | Descripción breve                                                      |
|----------------------------- |-------------|-----------------------------------------------------------------------|
| Home.jsx                     | Componente  | Orquesta todas las secciones de la landing page.                      |
| HeroSection.jsx              | Componente  | Sección principal con carrusel, CTA y estadísticas animadas.          |
| ProvidersSection.jsx         | Componente  | Grid de proveedores destacados y métricas.                            |
| AboutUsSection.jsx           | Componente  | Sección informativa sobre la empresa (misión, visión, valores).       |
| ServicesSection.jsx          | Componente  | Carrusel interactivo de servicios ofrecidos.                          |
| StatisticCard.jsx            | Componente  | Tarjeta visual para mostrar estadísticas numéricas.                   |
| ProviderLogo.jsx             | Componente  | Muestra el logo de un proveedor en el grid.                           |
| CarouselIndicator.jsx        | Componente  | Indicador visual de posición en carruseles.                           |
| CarouselNavigationButton.jsx | Componente  | Botón de navegación para carruseles.                                  |
| constants.jsx                | Helper      | Contiene datos estáticos, slides, servicios y proveedores.            |
| index.js                     | Barrel      | Exporta todos los componentes y hooks del módulo.                     |

## Relaciones internas del módulo

- `Home.jsx` importa y orquesta todas las secciones principales.
- Cada sección (Hero, Providers, AboutUs, Services) es un componente independiente, importado en `Home.jsx`.
- `constants.jsx` centraliza los datos estáticos usados por varios componentes.
- Componentes UI reutilizables (`StatisticCard`, `ProviderLogo`, `CarouselIndicator`, `CarouselNavigationButton`) son usados por las secciones según necesidad.
- El barrel `index.js` exporta todo para facilitar imports externos.

Árbol de relaciones simplificado:

```
Home.jsx
├─ HeroSection.jsx
│   ├─ StatisticCard.jsx
│   ├─ CarouselIndicator.jsx
│   └─ CarouselNavigationButton.jsx
├─ ProvidersSection.jsx
│   ├─ ProviderLogo.jsx
│   └─ StatisticCard.jsx
├─ AboutUsSection.jsx
├─ ServicesSection.jsx
│   └─ Wizard (de ../ui/wizard)
├─ constants.jsx
```

## Props de los componentes principales

| Componente           | Prop                | Tipo         | Requerida | Descripción                                      |
|----------------------|---------------------|--------------|-----------|--------------------------------------------------|
| Home                 | scrollTargets       | object       | No        | Referencias para navegación por scroll.           |
| HeroSection          | currentPromoSlide   | number       | Sí        | Índice del slide actual del carrusel.             |
|                      | nextPromoSlide      | function     | Sí        | Avanza al siguiente slide.                        |
|                      | prevPromoSlide      | function     | Sí        | Retrocede al slide anterior.                      |
|                      | setCurrentPromoSlide| function     | Sí        | Cambia a un slide específico.                     |
|                      | promoSlides         | array        | Sí        | Slides promocionales a mostrar.                   |
|                      | statistics          | array        | Sí        | Estadísticas a mostrar.                           |
| ProvidersSection     | statistics          | array        | No        | Métricas para mostrar junto a proveedores.        |
| AboutUsSection       | quienesSomosRef     | ref          | No        | Referencia para navegación por scroll.            |
| ServicesSection      | serviciosRef        | ref          | No        | Referencia para navegación por scroll.            |
| StatisticCard        | stat                | object       | Sí        | Objeto con número, label, descripción e icono.    |
| ProviderLogo         | provider            | object       | Sí        | Objeto con src y alt del logo.                    |
| CarouselIndicator    | index               | number       | Sí        | Índice del indicador.                             |
|                      | isActive            | boolean      | Sí        | Si el indicador está activo.                      |
|                      | onClick             | function     | Sí        | Callback al hacer clic.                           |
| CarouselNavigationButton | direction        | string       | Sí        | 'prev' o 'next'.                                  |
|                      | onClick             | function     | Sí        | Callback al hacer clic.                           |
|                      | position            | object       | No        | Posición personalizada del botón.                 |

## Hooks personalizados

- **useHomeLogic**: Centraliza la lógica de navegación, scroll, estado de carruseles y estadísticas. Maneja referencias, callbacks y formateo de datos para la landing page. Expone funciones y estados para controlar la UI desde `Home.jsx`.

## Dependencias externas e internas

- **Externas**: React, Material-UI, React Router DOM (para navegación), íconos de Material-UI.
- **Internas**: Helpers y datos de `constants.jsx`, componentes de UI y wizard de `../ui/wizard`.
- **Contextos/Providers**: No utiliza contextos globales, pero puede recibir referencias externas para navegación.
- **Importaciones externas**: Utiliza helpers y componentes de fuera de la carpeta para imágenes y wizard.

## Consideraciones técnicas y advertencias

- El módulo asume integración con Material-UI y React Router DOM.
- Los datos de slides, servicios y proveedores están centralizados en `constants.jsx` para facilitar mantenimiento y escalabilidad.
- El layout es completamente responsivo, pero cualquier cambio en breakpoints puede requerir ajustes en los estilos.
- Algunos componentes (ej: Wizard) pueden depender de rutas relativas fuera de la carpeta.
- Si se agregan nuevas secciones, mantener la arquitectura de separación UI/lógica.

## Puntos de extensión o reutilización

- Los componentes de UI (`StatisticCard`, `ProviderLogo`, `CarouselIndicator`, `CarouselNavigationButton`) están diseñados para ser reutilizables en otras páginas.
- El hook `useHomeLogic` puede extenderse para manejar lógica adicional de la landing o integrarse con analytics.
- El barrel `index.js` permite importar cualquier componente o hook del módulo de forma centralizada.

## Ejemplos de uso

### Importar y usar la landing page principal

```jsx
import { Home } from 'src/features/landing_page';

<Home />
```

### Usar una sección específica

```jsx
import { HeroSection } from 'src/features/landing_page';

<HeroSection
  currentPromoSlide={0}
  nextPromoSlide={() => {}}
  prevPromoSlide={() => {}}
  setCurrentPromoSlide={() => {}}
  promoSlides={[]}
  statistics={[]}
/>
```

---

Este README documenta la estructura, relaciones y funcionamiento del módulo Landing Page. Consulta los comentarios en el código para detalles adicionales y mantén la coherencia en la arquitectura al extender el módulo.