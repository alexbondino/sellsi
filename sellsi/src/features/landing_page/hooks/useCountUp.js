import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook para manejar animaciones count-up de números (ahora con requestAnimationFrame para mayor suavidad)
 * @param {Object} targets - Objeto con los números objetivo {key: value}
 * @param {number} duration - Duración de la animación en ms (default: 1500)
 * @param {number} delay - Delay antes de iniciar la animación en ms (default: 250)
 * @returns {Object} Números animados actuales
 */
const useCountUp = (targets, duration = 1500, delay = 250) => {
  const [animatedNumbers, setAnimatedNumbers] = useState(() => {
    // Inicializar todos los valores en 0
    const initialState = {}
    Object.keys(targets).forEach((key) => {
      initialState[key] = 0
    })
    return initialState
  })

  // Nueva función de animación usando requestAnimationFrame
  const animateCountUp = useCallback(
    (targetValue, key) => {
      let start = null
      let current = 0
      const step = (timestamp) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        current = Math.floor(progress * targetValue)
        setAnimatedNumbers((prev) => ({ ...prev, [key]: current }))
        if (progress < 1) {
          window.requestAnimationFrame(step)
        } else {
          setAnimatedNumbers((prev) => ({ ...prev, [key]: targetValue }))
        }
      }
      window.requestAnimationFrame(step)
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
