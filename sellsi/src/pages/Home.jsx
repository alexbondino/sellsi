import React from 'react'
import { Box } from '@mui/material' // Importación de componentes y estilos de Material UI
import { Banner } from '../hooks/shared' // Componente de banner reutilizable
// Importación de la lógica de la página de inicio
import useHomeLogic from '../components/home/useHomeLogic.jsx' // Lógica de la página de inicio
import ContactSection from '../components/home/sections/ContactSection.jsx' //Sección de contacto (Añadir a BottomBar )
import HeroSection from '../components/home/sections/HeroSection.jsx' //Carrusel supererio (Somos Sellsi...)
import ProvidersSection from '../components/home/sections/ProvidersSection.jsx' //Seccion de conocenos a nuestros proveedores
import AboutUsSection from '../components/home/sections/AboutUsSection.jsx' //Sección ¿Quiénes somos?
import ServicesSection from '../components/home/sections/ServicesSection.jsx' //Sección Nuestros Servicios (Carrusel de servicios)

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
      />

      {/* Sección Conoce a nuestros proveedores */}
      <ProvidersSection />

      {/* Banner Component */}
      <Banner />

      {/* Sección ¿Quiénes somos? */}
      <AboutUsSection quienesSomosRef={quienesSomosRef} />

      {/* Sección Nuestros Servicios */}
      <ServicesSection serviciosRef={serviciosRef} services={services} />

      {/* Contáctanos */}
      <ContactSection contactanosRef={contactanosRef} />
    </Box>
  )
}

export default Home
