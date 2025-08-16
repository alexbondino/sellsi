import { useEffect, useState, useRef } from 'react'

export function useInViewport(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setInView(true)
          if (!options.once) return
          observer.disconnect()
        } else if (!options.once) {
          setInView(false)
        }
      })
    }, {
      root: options.root || null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0.1
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options.root, options.rootMargin, options.threshold, options.once])

  return { ref, inView }
}
