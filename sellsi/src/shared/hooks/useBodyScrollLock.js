import { useEffect } from 'react';

/**
 * Hook personalizado para bloquear el scroll del body cuando un modal está abierto
 * 
 * Este hook resuelve las limitaciones de disableScrollLock={true} de Material-UI
 * al aplicar estilos CSS directamente al body y documentElement.
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
      
      // Aplicar estilos para bloquear scroll en documentElement
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.top = `-${scrollY}px`;
      document.documentElement.style.left = '0';
      document.documentElement.style.right = '0';
      document.documentElement.style.overflow = 'hidden';
      
      // Aplicar estilos para bloquear scroll en body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevenir scroll en mobile
      
      // Guardar posición para restaurar después
      document.body.dataset.scrollY = scrollY.toString();
      
      return () => {
        // Restaurar scroll del body al cerrar el modal
        const savedScrollY = parseInt(document.body.dataset.scrollY || '0', 10);
        
        // Limpiar estilos de documentElement
        document.documentElement.style.position = '';
        document.documentElement.style.top = '';
        document.documentElement.style.left = '';
        document.documentElement.style.right = '';
        document.documentElement.style.overflow = '';
        
        // Limpiar estilos de body
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Restaurar posición de scroll
        window.scrollTo(0, savedScrollY);
        
        // Limpiar dataset
        delete document.body.dataset.scrollY;
      };
    }
  }, [isOpen]);
};

export default useBodyScrollLock;
