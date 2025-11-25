import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { scrollManagerAntiRebote } from '../../../../shared/utils/scrollManagerAntiRebote'

/**
 * Hook optimizado para manejar solo la visibilidad de la SearchBar
 * ✅ MIGRADO: Usa ScrollManager unificado para eliminar conflictos
 * ✅ DESACOPLADO: No afecta al layout de otros componentes
 */
export const useScrollBehavior = () => {
  // Estados esenciales para la SearchBar únicamente
  const [showSearchBar, setShowSearchBar] = useState(true)
  const [isSearchBarSticky, setIsSearchBarSticky] = useState(false)
  const [showTopBarOnHover, setShowTopBarOnHover] = useState(false)
  
  // useRef para valores que no necesitan re-render
  const prevScrollY = useRef(0)
  const lastMouseY = useRef(0)
  const mouseThrottleRef = useRef(false)

  // Mouse handler para hover en desktop
  const handleMouseMove = useCallback((e) => {
    if (mouseThrottleRef.current) return
    if (window.innerWidth < 768) return // Solo desktop
    if (!isSearchBarSticky) return // Solo cuando sticky
    
    const currentY = e.clientY
    const lastY = lastMouseY.current
    
    // Solo procesar si hay cambio significativo
    if (Math.abs(currentY - lastY) < 20) return
    
    mouseThrottleRef.current = true
    setTimeout(() => {
      if (currentY < 170) {
        setShowTopBarOnHover(true)
      } else if (currentY > 185) {
        setShowTopBarOnHover(false)
      }
      lastMouseY.current = currentY
      mouseThrottleRef.current = false
    }, 200)
  }, [isSearchBarSticky])

  useEffect(() => {
    const listenerId = 'search-bar-behavior';
    
    // ✅ MIGRADO: Handler usando ScrollManager unificado
    const handleScrollBehavior = (scrollData) => {
      const currentScrollY = scrollData.scrollTop;
      const prevY = prevScrollY.current;

      // Lógica para móvil - solo afecta visibilidad de SearchBar
      if (window.innerWidth < 768) {
        if (currentScrollY > prevY && currentScrollY > 100) {
          setShowSearchBar(false);
        } else if (currentScrollY < prevY) {
          setShowSearchBar(true);
        }
      } else {
        // Lógica para desktop - solo afecta comportamiento sticky
        const shouldBeSticky = currentScrollY > 150;
        if (shouldBeSticky !== isSearchBarSticky) {
          setIsSearchBarSticky(shouldBeSticky);
          if (!shouldBeSticky) {
            setShowTopBarOnHover(false);
          }
        }
      }
      
      prevScrollY.current = currentScrollY;
    };

    // Registrar listener con ScrollManagerAntiRebote
    const cleanupScroll = scrollManagerAntiRebote.addListener(listenerId, handleScrollBehavior, {
      priority: 0, // Prioridad media para UI behavior
      throttle: 100 // Throttling moderado
    });

    // Mouse handler sigue siendo independiente
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      cleanupScroll();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isSearchBarSticky, handleMouseMove])

  // ✅ VALOR MEMOIZADO: Solo para la visibilidad de SearchBar
  const shouldShowSearchBar = useMemo(() => {
    if (window.innerWidth < 768) {
      return showSearchBar
    } else {
      return isSearchBarSticky ? showTopBarOnHover : true
    }
  }, [showSearchBar, isSearchBarSticky, showTopBarOnHover])

  return {
    shouldShowSearchBar, // Solo para SearchSection
    // ✅ DESACOPLADO: Otros componentes no dependen de este estado
  }
}
