import React from 'react'
import { Box } from '@mui/material' // Importación de componentes y estilos de Material UI
import { Banner } from './hooks/index.js' // Componente de banner reutilizable
// Importación de la lógica de la página de inicio
import useHomeLogic from './hooks/useHomeLogic.jsx' // Lógica de la página de inicio
import HeroSection from './HeroSection.jsx' //Carrusel supererio (Somos Sellsi...)
import ProvidersSection from './ProvidersSection.jsx' //Seccion de conocenos a nuestros proveedores
import AboutUsSection from './AboutUsSection.jsx' //Sección ¿Quiénes somos?
import ServicesSection from './ServicesSection.jsx' //Sección Nuestros Servicios (Carrusel de servicios)

/**
 * ============================================================================
 * HOME - PÁGINA PRINCIPAL/LANDING PAGE
 * ============================================================================
 *
 * Componente principal de la landing page que orquesta todas las secciones
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {React.RefObject} props.scrollTargets - Referencias para navegación por scroll
 *
 * CARACTERÍSTICAS:
 * - Arquitectura basada en custom hooks para separar lógica de UI
 * - Composición de múltiples secciones especializadas
 * - Estado centralizado con useHomeLogic hook
 * - Navegación suave entre secciones
 * - Carruseles interactivos y estadísticas animadas
 * - Layout completamente responsivo
 *
 * SECCIONES INCLUIDAS:
 * 1. HeroSection: Carrusel principal con CTAs y estadísticas
 * 2. ProvidersSection: Grid de proveedores destacados
 * 3. Banner: Componente de notificaciones
 * 4. AboutUsSection: Información corporativa (misión/visión)
 * 5. ServicesSection: Carrusel de servicios interactivo
 *
 * ARQUITECTURA:
 * - UI Components: Componentes presentacionales puros
 * - Business Logic: Centralizada en useHomeLogic hook
 * - State Management: Local state con hooks especializados
 * - Performance: Memoización y lazy loading donde corresponde
 */
const Home = ({ scrollTargets }) => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====
  const {
    // Referencias para scroll
    quienesSomosRef,
    serviciosRef,
    contactanosRef,

    // Carrusel promocional
    currentPromoSlide,
    nextPromoSlide,
    prevPromoSlide,
    goToPromoSlide,

    // Estadísticas y números
    statistics,
    formatNumber,

    // Datos de servicios
    services,

    // Constantes
    PROMO_SLIDES,
  } = useHomeLogic(scrollTargets)

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Sección Hero con texto, botón, estadísticas y carrusel */}
      <HeroSection
        currentPromoSlide={currentPromoSlide}
        nextPromoSlide={nextPromoSlide}
        prevPromoSlide={prevPromoSlide}
        setCurrentPromoSlide={goToPromoSlide}
        promoSlides={PROMO_SLIDES}
        statistics={statistics}
        formatNumber={formatNumber}
      />{' '}
      {/* Sección Conoce a nuestros proveedores */}
      <ProvidersSection statistics={statistics} />
      {/* Banner Component */}
      <Banner /> {/* Sección ¿Quiénes somos? */}{' '}
      <AboutUsSection quienesSomosRef={quienesSomosRef} />
      {/* Sección Nuestros Servicios */}
      <ServicesSection serviciosRef={serviciosRef} services={services} />
    </Box>
  )
}

export default Home
