import { useRef, useState, useMemo, useCallback } from 'react';
import React from 'react';
import { Handshake, Business, BarChart } from '@mui/icons-material';
import useCarousel from './useCarousel.js';
import useCountUp from './useCountUp.js';
import {
  PROMO_SLIDES,
  CAROUSEL_IMAGES,
  SERVICES_DATA,
} from '../constants/constants.jsx';

/**
 * Custom hook que maneja toda la lógica de estado y efectos de la página Home
 * Incluye: referencias de scroll, carruseles, animaciones count-up, números aleatorios
 * y memoización de estadísticas
 */
const useHomeLogic = scrollTargets => {
  // ===== REFERENCIAS PARA SCROLL =====
  const quienesSomosRef = useRef(null);
  const serviciosRef = useRef(null);
  const estadisticasRef = useRef(null);
  const contactRef = useRef(null);

  // Configurar las referencias para scroll si se proporcionan
  if (scrollTargets) {
    scrollTargets.current = {
      quienesSomosRef,
      serviciosRef,
      estadisticasRef,
      contactRef,
    };
  } // ===== CARRUSELES =====
  // Carrusel de promoción usando custom hook con autoplay cada 10 segundos
  const {
    currentSlide: currentPromoSlide,
    nextSlide: nextPromoSlide,
    prevSlide: prevPromoSlide,
    goToSlide: goToPromoSlide,
  } = useCarousel(PROMO_SLIDES.length, 10000); // ✅ Cambiado a 10 segundos

  // Carrusel principal usando custom hook
  const { currentSlide, nextSlide, prevSlide, goToSlide } = useCarousel(
    CAROUSEL_IMAGES.length,
    10000
  );

  // ===== GENERACIÓN DE NÚMEROS ALEATORIOS =====
  // Función para generar números aleatorios
  const generateRandomNumbers = () => ({
    transacciones: Math.floor(Math.random() * 3001) + 2000, // 2000-5000
    empresas: Math.floor(Math.random() * 221) + 200, // 200-420
    ventas: Math.floor(Math.random() * 3001) + 2000, // 2000-5000
  });

  // Estado para los números finales (se regeneran en cada carga)
  const [finalNumbers] = useState(generateRandomNumbers());

  // ===== ANIMACIONES COUNT-UP =====
  // Animaciones count-up usando custom hook
  const animatedNumbers = useCountUp(finalNumbers);

  // ===== FUNCIÓN FORMATEAR NÚMEROS =====
  // Función memoizada para formatear números con punto como separador de miles
  const formatNumber = useCallback(num => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, []);

  // ===== MEMOIZACIÓN DE ESTADÍSTICAS =====
  // Memoizar el array de estadísticas para evitar recreación en cada render
  const statistics = useMemo(
    () => [
      {
        number: formatNumber(animatedNumbers.transacciones),
        label: 'Transacciones',
        description: 'Completadas exitosamente',
        icon: <Handshake sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
      },
      {
        number: formatNumber(animatedNumbers.empresas),
        label: 'Empresas',
        description: 'Confiando en nuestra plataforma',
        icon: <Business sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
      },
      {
        number: formatNumber(animatedNumbers.ventas),
        label: 'Ventas',
        description: 'En crecimiento exponencial',
        icon: <BarChart sx={{ fontSize: { xs: 40, md: 50 }, mb: 1 }} />,
      },
    ],
    [animatedNumbers, formatNumber]
  );

  // ===== DATOS DE SERVICIOS =====
  // Usar los datos de servicios constantes
  const services = SERVICES_DATA;
  // ===== RETORNO DEL HOOK =====
  return {
    // Referencias para scroll
    quienesSomosRef,
    serviciosRef,
    estadisticasRef,
    contactRef,

    // Carrusel promocional
    currentPromoSlide,
    nextPromoSlide,
    prevPromoSlide,
    goToPromoSlide,

    // Carrusel principal
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,

    // Estadísticas y números
    animatedNumbers,
    formatNumber,
    statistics,

    // Datos de servicios
    services,

    // Constantes
    PROMO_SLIDES,
    CAROUSEL_IMAGES,
  };
};

export default useHomeLogic;
