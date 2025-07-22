import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Flag global para navegación por sección (solo para los botones de TopBar) Esto hace que cada vez que navegues a una ruta, te lleve al inicio de la página
let skipScrollToTop = false;
export function setSkipScrollToTopOnce() {
  skipScrollToTop = true;
}

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (skipScrollToTop) {
      skipScrollToTop = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
}
