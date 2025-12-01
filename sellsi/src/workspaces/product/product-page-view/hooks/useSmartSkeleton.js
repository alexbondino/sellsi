import { useEffect, useRef, useState } from 'react'

/**
 * useSmartSkeleton
 * Evita flicker mostrando skeleton solo si la carga supera `delay`, y 
 * garantiza un mínimo de visibilidad `minDuration` para continuidad visual.
 *
 * @param {boolean} loading estado de carga externo
 * @param {object} opts
 * @param {number} opts.delay ms antes de mostrar skeleton (default 120)
 * @param {number} opts.minDuration ms mínimo visible una vez mostrado (default 300)
 * @returns {boolean} showSkeleton
 */
export function useSmartSkeleton(loading, { delay = 120, minDuration = 300 } = {}) {
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (loading) {
      // Programar aparición diferida
      timeoutRef.current = setTimeout(() => {
        shownAtRef.current = performance.now()
        setVisible(true)
      }, delay)
    } else {
      // Cerrar aparición programada si no llegó a mostrarse
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      if (visible && shownAtRef.current) {
        const elapsed = performance.now() - shownAtRef.current
        if (elapsed < minDuration) {
          const remaining = minDuration - elapsed
          const hold = setTimeout(() => {
            setVisible(false)
            shownAtRef.current = null
          }, remaining)
          return () => clearTimeout(hold)
        }
      }
      setVisible(false)
      shownAtRef.current = null
    }
    return () => {
      clearTimeout(timeoutRef.current)
    }
  }, [loading, delay, minDuration, visible])

  return visible
}

export default useSmartSkeleton
