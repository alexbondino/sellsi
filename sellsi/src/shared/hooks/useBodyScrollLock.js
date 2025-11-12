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
      
      // 🔧 FIX: En lugar de position: fixed en body, usamos overflow: hidden
      // Esto mantiene el comportamiento de elementos sticky y previene el salto visual
      
      // Aplicar estilos para bloquear scroll en documentElement
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      
      // Aplicar estilos para bloquear scroll en body
      // Usamos overflow: hidden en lugar de position: fixed para mantener sticky elements
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none'; // Prevenir scroll en mobile
      
      // Guardar posición para restaurar después (aunque no movemos el scroll)
      document.body.dataset.scrollY = scrollY.toString();
      
      return () => {
        // Restaurar scroll del body al cerrar el modal
        const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
        
        // Limpiar estilos de documentElement
        document.documentElement.style.overflow = '';
        document.documentElement.style.height = '';
        
        // Limpiar estilos de body
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        
        // Restaurar posición de scroll si se había movido
        // (En este enfoque mejorado, el scroll no debería haberse movido)
        if (window.scrollY !== savedScrollY) {
          window.scrollTo(0, savedScrollY);
        }
        
        // Limpiar dataset
        delete document.body.dataset.scrollY;
      };
    }
  }, [isOpen]);
};

export default useBodyScrollLock;
