import { useEffect } from 'react';

/**
 * Hook personalizado para bloquear el scroll del body cuando un modal está abierto
 * 
 * Este hook resuelve las limitaciones de disableScrollLock={true} de Material-UI
 * al aplicar estilos CSS directamente al body y documentElement.
 * 
 * 🔧 FIX Bug #2: Mejorado para mantener el comportamiento de elementos sticky
 * durante el bloqueo del scroll, evitando que salten a posiciones incorrectas.
 * 
 * Inspirado en la implementación de ShippingRegionsModal.jsx
 * 
 * @param {boolean} isOpen - Indica si el modal está abierto
 * 
 * @example
 * const MyModal = ({ open, onClose }) => {
 *   useBodyScrollLock(open);
 *   
 *   return (
 *     <Dialog open={open} onClose={onClose}>
 *       ...
 *     </Dialog>
 *   );
 * };
 */
export const useBodyScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual antes de bloquearlo
      const scrollY = window.scrollY;
      
      // Aplicar estilos para bloquear scroll manteniendo la posición
      document.documentElement.style.overflow = 'hidden';
      
      // En body, usar position fixed con top negativo para mantener posición visual
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      // Guardar posición para restaurar después
      document.body.dataset.scrollY = scrollY.toString();
      
      return () => {
        // Restaurar scroll del body al cerrar el modal
        const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
        
        // Limpiar estilos
        document.documentElement.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Restaurar posición de scroll
        window.scrollTo(0, savedScrollY);
        
        // Limpiar dataset
        delete document.body.dataset.scrollY;
      };
    }
  }, [isOpen]);
};

export default useBodyScrollLock;
