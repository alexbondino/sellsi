import { useState, useEffect } from 'react'

/**
 * Custom hook para manejar la lógica de carruseles
 * @param {number} totalSlides - Número total de slides
 * @param {number} autoAdvanceInterval - Intervalo en ms para auto-avance (0 para desactivar)
 * @returns {object} Estado y funciones del carrusel
 */
const useCarousel = (totalSlides, autoAdvanceInterval = 0) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-avance del carrusel
  useEffect(() => {
    if (autoAdvanceInterval <= 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, autoAdvanceInterval)

    return () => clearInterval(interval)
  }, [totalSlides, autoAdvanceInterval])

  // Función para ir al siguiente slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  // Función para ir al slide anterior
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  // Función para ir a un slide específico
  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    setCurrentSlide,
  }
}

export default useCarousel
