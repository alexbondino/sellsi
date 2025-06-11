/**
 * ============================================================================
 * LANDING PAGE - BARREL EXPORTS
 * ============================================================================
 *
 * Archivo de exportación centralizada para todos los componentes y hooks
 * de la página de inicio/landing page
 *
 * BENEFICIOS:
 * - Imports más limpios y organizados
 * - API consistente para el módulo landing_page
 * - Facilita el mantenimiento y refactoring
 * - Oculta la estructura interna del módulo
 */

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export { default as Home } from './Home.jsx'

// ============================================================================
// COMPONENTES DE SECCIONES
// ============================================================================
export { default as HeroSection } from './HeroSection.jsx'
export { default as AboutUsSection } from './AboutUsSection.jsx'
export { default as ProvidersSection } from './ProvidersSection.jsx'
export { default as ServicesSection } from './ServicesSection.jsx'

// ============================================================================
// COMPONENTES UI REUTILIZABLES
// ============================================================================
export { default as StatisticCard } from './StatisticCard.jsx'
export { default as ProviderLogo } from './ProviderLogo.jsx'
export { default as CarouselIndicator } from './CarouselIndicator.jsx'
export { default as CarouselNavigationButton } from './CarouselNavigationButton.jsx'

// ============================================================================
// HOOKS Y LÓGICA
// ============================================================================
export { default as useHomeLogic } from './hooks/useHomeLogic.jsx'
export { default as useCarousel } from './hooks/useCarousel.js'
export { default as useCountUp } from './hooks/useCountUp.js'

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================
export {
  PROMO_SLIDES,
  CAROUSEL_IMAGES,
  SERVICES_DATA,
  PROVIDERS_DATA,
} from './constants.jsx'
