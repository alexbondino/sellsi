import { useState, useEffect } from 'react'

export const useScrollBehavior = () => {
  const [scrollY, setScrollY] = useState(0)
  const [prevScrollY, setPrevScrollY] = useState(0)
  const [showSearchBar, setShowSearchBar] = useState(true)
  const [isSearchBarSticky, setIsSearchBarSticky] = useState(false)
  const [showTopBarOnHover, setShowTopBarOnHover] = useState(false)

  useEffect(() => {
    let ticking = false
    let mouseThrottle = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          setScrollY(currentScrollY)

          // Lógica para móvil
          if (window.innerWidth < 768) {
            if (currentScrollY > prevScrollY && currentScrollY > 100) {
              setShowSearchBar(false)
            } else if (currentScrollY < prevScrollY) {
              setShowSearchBar(true)
            }
          } else {
            // Lógica para desktop
            if (currentScrollY > 150) {
              setIsSearchBarSticky(true)
            } else {
              setIsSearchBarSticky(false)
              setShowTopBarOnHover(false)
            }
          }
          setPrevScrollY(currentScrollY)
          ticking = false
        })
        ticking = true
      }
    }

    const handleMouseMove = (e) => {
      if (!mouseThrottle) {
        setTimeout(() => {
          if (window.innerWidth >= 768 && isSearchBarSticky) {
            if (e.clientY < 170) {
              // ✅ ACTIVACIÓN: Mouse arriba de 200px
              setShowTopBarOnHover(true)
            } else if (e.clientY > 185) {
              // ✅ DESACTIVACIÓN: Mouse abajo de 500px (mucho más abajo)
              setShowTopBarOnHover(false)
            }
            // ✅ ZONA NEUTRA: 200px - 500px (300px de espacio para interactuar)
          }
          mouseThrottle = false
        }, 16)
        mouseThrottle = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [prevScrollY, isSearchBarSticky])

  // ✅ Determinar si mostrar barra de búsqueda
  const shouldShowSearchBar =
    window.innerWidth < 768
      ? showSearchBar
      : isSearchBarSticky
      ? showTopBarOnHover
      : true

  return {
    shouldShowSearchBar,
    scrollY,
    isSearchBarSticky,
    showTopBarOnHover,
  }
}
