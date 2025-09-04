import React, { useEffect } from 'react';
import { Box } from '@mui/material'; // Importación de componentes y estilos de Material UI
import { Banner } from '../../../shared/components/display/banners'; // Componente de banner reutilizable
// Importación de la lógica de la página de inicio
import useHomeLogic from './hooks/useHomeLogic.jsx'; // Lógica de la página de inicio
import HeroSection from './components/HeroSection.jsx'; //Carrusel supererio (Somos Sellsi...)
import AboutUsSection from './components/AboutUsSection.jsx'; //Sección ¿Quiénes somos?
import ServicesSection from './components/ServicesSection.jsx'; //Sección Nuestros Servicios (Carrusel de servicios
import ContactSection from './components/ContactSection.jsx';
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
import { useLocation } from 'react-router-dom';

const Home = ({ scrollTargets }) => {
  // ===== USAR CUSTOM HOOK PARA TODA LA LÓGICA =====

  const location = useLocation();
  const {
    // Referencias para scroll
    serviciosRef,
    quienesSomosRef,
    contactRef,

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
  } = useHomeLogic(scrollTargets);

  // Scroll automático al anchor si hay scrollTo en la URL
  // Ref para el top de la página
  const topRef = React.useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scrollTo = params.get('scrollTo');
    if (scrollTo) {
      // refMap entries can be either a direct ref (legacy) or an object { ref, offset }
      const refMap = {
        top: { ref: topRef, offset: 0 },
        quienesSomosRef: { ref: quienesSomosRef, offset: 0 },
        // Scroll a bit higher than the exact top so the section appears a few px above
        serviciosRef: { ref: serviciosRef, offset: 60 },
        contactModal: { ref: contactRef, offset: 0 },
        trabajaConNosotrosRef: { ref: serviciosRef, offset: 0 }, // fallback
      };

      const entry = refMap[scrollTo];
      const targetRef = entry?.ref || entry;
      const offset = entry?.offset || 0;

      if (targetRef && targetRef.current) {
        setTimeout(() => {
          // Compute exact scroll top with offset for precise positioning
          const topPos = targetRef.current.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, topPos), behavior: 'smooth' });
        }, 100); // small delay to ensure the DOM is rendered
      }
    }
    // Include refs in deps so effect re-runs when they change
  }, [location.search, quienesSomosRef, serviciosRef, contactRef]);

  return (
    <Box ref={topRef} sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Sección Hero con texto, botón, estadísticas y carrucel */}
      <HeroSection
        currentPromoSlide={currentPromoSlide}
        nextPromoSlide={nextPromoSlide}
        prevPromoSlide={prevPromoSlide}
        setCurrentPromoSlide={goToPromoSlide}
        promoSlides={PROMO_SLIDES}
        statistics={statistics}
        formatNumber={formatNumber}
      />
      {/* Fondo global para el resto de la landing excepto Hero y Services */}
      <Box
        sx={{
          width: '100%',
          background: `url('/Landing Page/BackgroundHome.svg') center top / cover no-repeat, linear-gradient(135deg, #f7f8fa 0%, #e3e6ec 100%)`,
          position: 'relative',
          zIndex: 0,
          overflow: 'hidden',
          px: {
            xs: 'max(25px, env(safe-area-inset-left))', // Telefonos Chicos
            sm: 'max(30px, env(safe-area-inset-left))', // Telefonos grandes
            mac: '180px', //  Mac M1
            lg: '250px', // 1080p
            xl: '250px', // 2K
          },
          py: '50px', // Padding lateral global para todas las secciones
        }}
      >
        {/* Sección Conoce a nuestros proveedores */}
        {/*
        <Box>
          <ProvidersSection statistics={statistics} />
        </Box>
        */}
        {/* Banner Component */}
        <Box>
          <Banner />
          {/* Sección Nuestros Servicios */}
          <ServicesSection serviciosRef={serviciosRef} services={services} />
        </Box>
      </Box>

      <Box>
        {/* Sección ¿Quiénes somos? */}
        <AboutUsSection quienesSomosRef={quienesSomosRef} />
      </Box>
      <Box>
        {/* Sección Contactanos */}
        <ContactSection contactRef={contactRef} />
      </Box>
    </Box>
  );
};

export default Home;
