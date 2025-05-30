import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook para manejar animaciones count-up de números
 * @param {Object} targets - Objeto con los números objetivo {key: value}
 * @param {number} duration - Duración de la animación en ms (default: 1500)
 * @param {number} delay - Delay antes de iniciar la animación en ms (default: 500)
 * @returns {Object} Números animados actuales
 */
const useCountUp = (targets, duration = 1500, delay = 500) => {
  const [animatedNumbers, setAnimatedNumbers] = useState(() => {
    // Inicializar todos los valores en 0
    const initialState = {}
    Object.keys(targets).forEach((key) => {
      initialState[key] = 0
    })
    return initialState
  })

  // Función de animación count-up optimizada
  const animateCountUp = useCallback(
    (targetValue, key) => {
      const steps = 60 // Número de pasos para la animación
      const increment = targetValue / steps
      let current = 0
      let step = 0

      const timer = setInterval(() => {
        step++
        current = Math.min(Math.floor(increment * step), targetValue)

        setAnimatedNumbers((prev) => ({
          ...prev,
          [key]: current,
        }))

        if (step >= steps) {
          clearInterval(timer)
        }
      }, duration / steps)

      return timer
    },
    [duration]
  )

  // Efecto para iniciar las animaciones cuando cambian los targets
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.entries(targets).forEach(([key, value]) => {
        animateCountUp(value, key)
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [targets, animateCountUp, delay])

  return animatedNumbers
}

export default useCountUp
