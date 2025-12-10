import { useEffect, useRef, useState, useMemo } from 'react';

/**
 * Hook personalizado para revelar elementos al hacer scroll
 * Usa Intersection Observer API para detectar cuando un elemento entra al viewport
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} [options.threshold=0.1] - Porcentaje del elemento que debe ser visible (0-1)
 * @param {string} [options.rootMargin='0px'] - Margen alrededor del viewport
 * @param {boolean} [options.once=true] - Si true, la animación solo ocurre una vez
 * @returns {Array} [elementRef, isVisible] - Ref para el elemento y estado de visibilidad
 */
export const useScrollReveal = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  // Memoizar opciones para evitar recrear el observer innecesariamente
  const { threshold = 0.1, rootMargin = '0px', once = true } = options;

  // Memoizar configuración del observer
  const observerOptions = useMemo(
    () => ({
      threshold,
      rootMargin,
    }),
    [threshold, rootMargin]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Verificar soporte del navegador
    if (typeof IntersectionObserver === 'undefined') {
      console.warn('IntersectionObserver no está soportado en este navegador');
      setIsVisible(true); // Fallback: mostrar elemento
      return;
    }

    // Cleanup del observer anterior si existe
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Callback del observer
    const handleIntersection = ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        
        // Si once=true, dejar de observar después de la primera aparición
        if (once && observerRef.current) {
          observerRef.current.unobserve(element);
        }
      } else if (!once) {
        // Si once=false, permitir que el elemento se oculte nuevamente
        setIsVisible(false);
      }
    };

    // Crear nuevo observer
    observerRef.current = new IntersectionObserver(
      handleIntersection,
      observerOptions
    );

    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [observerOptions, once]);

  return [elementRef, isVisible];
};
