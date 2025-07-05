import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook para manejar la lógica de carruseles
 * @param {number} totalSlides - Número total de slides
 * @param {number} autoAdvanceInterval - Intervalo en ms para auto-avance (0 para desactivar)
 * @returns {object} Estado y funciones del carrusel
 */
const useCarousel = (totalSlides, autoAdvanceInterval = 0) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const intervalRef = useRef(null)

  // Función para limpiar y reiniciar el timer
  const resetInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (autoAdvanceInterval > 0) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides)
      }, autoAdvanceInterval)
    }
  }, [autoAdvanceInterval, totalSlides])

  // Auto-avance del carrusel
  useEffect(() => {
    resetInterval()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [resetInterval])

  // Función para ir al siguiente slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = (prev + 1) % totalSlides
      resetInterval()
      return next
    })
  }, [totalSlides, resetInterval])

  // Función para ir al slide anterior
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const prevIdx = (prev - 1 + totalSlides) % totalSlides
      resetInterval()
      return prevIdx
    })
  }, [totalSlides, resetInterval])

  // Función para ir a un slide específico
  const goToSlide = useCallback(
    (index) => {
      setCurrentSlide(() => {
        resetInterval()
        return index
      })
    },
    [resetInterval]
  )

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    setCurrentSlide,
  }
}

export default useCarousel
