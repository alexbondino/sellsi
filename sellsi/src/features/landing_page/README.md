# Landing Page Module

## 📋 Descripción

Módulo completo para la página de inicio (landing page) de Sellsi. Implementa una arquitectura modular, escalable y mantenible con separación clara entre UI y lógica de negocio.

## 🏗️ Arquitectura

### Principios de Diseño

- **Separación de responsabilidades**: UI pura vs lógica de negocio
- **Componentes reutilizables**: Memoización y optimización de rendimiento
- **Responsive Design**: Breakpoints optimizados para todos los dispositivos
- **Accesibilidad**: Estructura semántica y navegación accesible

### Patrones Implementados

- **Custom Hooks**: Lógica centralizada y reutilizable
- **Compound Components**: Componentes especializados y cohesivos
- **Barrel Exports**: API limpia y organizada
- **Configuration as Code**: Constantes centralizadas

## 📁 Estructura de Archivos

```
landing_page/
├── index.js                     # 📦 Barrel exports
├── README.md                    # 📖 Documentación del módulo
│
├── Home.jsx                     # 🏠 Componente principal
│
├── constants.jsx                # ⚙️  Configuración y datos estáticos
│
├── sections/                    # 📄 Componentes de secciones
│   ├── HeroSection.jsx         # Hero principal con carrusel
│   ├── AboutUsSection.jsx      # "Quiénes somos"
│   ├── ProvidersSection.jsx    # Grid de proveedores
│   └── ServicesSection.jsx     # Carrusel de servicios
│
├── ui/                         # 🧩 Componentes UI reutilizables
│   ├── StatisticCard.jsx       # Tarjetas de estadísticas
│   ├── ProviderLogo.jsx        # Logos de proveedores
│   ├── CarouselIndicator.jsx   # Indicadores de carrusel
│   └── CarouselNavigationButton.jsx # Botones de navegación
│
└── hooks/                      # 🪝 Custom hooks
    ├── index.js                # Barrel exports para hooks
    ├── useHomeLogic.jsx        # Hook principal de lógica
    ├── useCarousel.js          # Lógica de carruseles
    └── useCountUp.js           # Animaciones count-up
```

## 🧩 Componentes

### Componente Principal

#### `Home.jsx`

- **Responsabilidad**: Orquestador principal de la landing page
- **Props**: `{ scrollTargets }` - Referencias para navegación
- **Características**: Composición de secciones, estado centralizado

### Secciones Principales

#### `HeroSection.jsx`

- **Responsabilidad**: Carrusel promocional principal
- **Características**: Multi-tipo slides, estadísticas animadas, CTA
- **Layout**: Responsive de 1 a 2 columnas

#### `AboutUsSection.jsx`

- **Responsabilidad**: Información corporativa
- **Características**: Misión/visión, imágenes optimizadas
- **Layout**: Mobile-first, columnas dinámicas

#### `ProvidersSection.jsx`

- **Responsabilidad**: Showcas de proveedores destacados
- **Características**: Grid responsivo, CTA, estadísticas
- **Layout**: Grid adaptive con logos optimizados

#### `ServicesSection.jsx`

- **Responsabilidad**: Carrusel interactivo de servicios
- **Características**: Wizard navegable, timelines visuales
- **Layout**: Botones + timeline responsive

### Componentes UI Reutilizables

#### `StatisticCard.jsx`

- **Props**: `{ stat }` - Objeto con datos de estadística
- **Características**: Memoizado, números animados, hover effects

#### `ProviderLogo.jsx`

- **Props**: `{ provider }` - Objeto con información del proveedor
- **Características**: Cards Material UI, efectos glassmorphism

#### `CarouselIndicator.jsx`

- **Props**: `{ index, isActive, onClick }`
- **Características**: Estados visuales diferenciados, responsive

#### `CarouselNavigationButton.jsx`

- **Props**: `{ direction, onClick, position }`
- **Características**: Posicionamiento flotante, iconos direccionales

## 🪝 Custom Hooks

### `useHomeLogic.jsx`

- **Responsabilidad**: Lógica centralizada de la página Home
- **Retorna**: Estado completo, funciones, referencias
- **Incluye**: Carruseles, estadísticas, scroll, animaciones

### `useCarousel.js`

- **Responsabilidad**: Lógica genérica de carruseles
- **Parámetros**: `(totalSlides, autoAdvanceInterval)`
- **Incluye**: Navegación, auto-advance, estado del slide

### `useCountUp.js`

- **Responsabilidad**: Animaciones count-up para números
- **Parámetros**: `(targets, duration, delay)`
- **Incluye**: Animación suave, números incrementales

## ⚙️ Configuración

### `constants.jsx`

Archivo centralizado con todas las configuraciones estáticas:

- **PROMO_SLIDES**: Slides del carrusel principal
- **CAROUSEL_IMAGES**: Imágenes del carrusel secundario
- **SERVICES_DATA**: Datos de servicios con timelines
- **PROVIDERS_DATA**: Logos de proveedores destacados

## 🎨 Theming y Estilos

### Breakpoints Responsive

```javascript
breakpoints = {
  xs: 0, // Mobile portrait
  sm: 600, // Mobile landscape
  md: 900, // Tablet portrait
  lg: 1200, // Tablet landscape / Desktop
  xl: 1536, // Large desktop
}
```

### Sistema de Colores

- **Primary**: `#1565c0` (Azul Sellsi)
- **Secondary**: `#ffffff` (Blanco)
- **Background**: `#000000` (Negro para Hero)
- **Accent**: `#f8f9fa` (Gris claro)

## 🚀 Uso

### Import Básico

```javascript
import { Home } from '@/features/landing_page'
```

### Import Específico

```javascript
import {
  HeroSection,
  useHomeLogic,
  PROMO_SLIDES,
} from '@/features/landing_page'
```

### Ejemplo de Uso

```javascript
function App() {
  const scrollTargets = useRef({})

  return <Home scrollTargets={scrollTargets} />
}
```

## 🔧 Mantenimiento

### Agregar Nueva Sección

1. Crear componente en `/` o mover a `/sections/`
2. Agregar documentación JSDoc
3. Exportar en `index.js`
4. Integrar en `Home.jsx`
5. Actualizar este README

### Agregar Nuevo Hook

1. Crear archivo en `/hooks/`
2. Agregar documentación JSDoc
3. Exportar en `/hooks/index.js`
4. Agregar a `index.js` principal

### Modificar Configuración

1. Editar `constants.jsx`
2. Mantener estructura TypeScript-like
3. Documentar cambios en comentarios

## 📊 Performance

### Optimizaciones Implementadas

- **React.memo**: Componentes memoizados
- **Lazy Loading**: Imágenes optimizadas
- **Code Splitting**: Exports modulares
- **Custom Hooks**: Lógica reutilizable
- **Responsive Images**: WebP y optimización

### Métricas Target

- **FCP**: < 1.5s (First Contentful Paint)
- **LCP**: < 2.5s (Largest Contentful Paint)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **Bundle Size**: < 200KB (gzipped)

## 🧪 Testing

### Coverage Target

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Key user flows
- **Visual Regression**: Screenshots automáticos
- **Performance Tests**: Lighthouse CI

## 📝 TODO

- [ ] Implementar lazy loading para imágenes
- [ ] Agregar tests unitarios completos
- [ ] Optimizar bundle size
- [ ] Implementar PWA features
- [ ] Agregar analytics tracking
- [ ] Mejorar SEO meta tags
