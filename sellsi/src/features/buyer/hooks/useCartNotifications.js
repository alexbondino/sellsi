import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook para gestionar notificaciones relacionadas con problemas del carrito
 */
export const useCartNotifications = () => {
  const [hasShownCorruptionWarning, setHasShownCorruptionWarning] = useState(false);

  const notifyCartCleaned = useCallback((summary) => {
    if (!hasShownCorruptionWarning) {
      const message = summary.removed > 0 
        ? `Se encontraron ${summary.removed} productos con datos incorrectos que fueron removidos del carrito.`
        : `Se corrigieron ${summary.corrected} productos en tu carrito.`;
      
      toast.error(message, {
        icon: '🧹',
        duration: 6000,
        style: {
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffeeba'
        }
      });
      
      setHasShownCorruptionWarning(true);
    }
  }, [hasShownCorruptionWarning]);

  const notifyQuantityLimited = useCallback((productName, oldQuantity, newQuantity) => {
    toast.warning(
      `La cantidad de "${productName}" fue ajustada de ${oldQuantity} a ${newQuantity} unidades (máximo permitido).`,
      {
        icon: '⚠️',
        duration: 4000
      }
    );
  }, []);

  const notifyCartError = useCallback((error) => {
    const isQuantityError = error.message && (
      error.message.includes('out of range') ||
      error.message.includes('invalid quantity')
    );

    if (isQuantityError) {
      toast.error('Se detectó un problema con las cantidades en tu carrito. Se ha limpiado automáticamente.', {
        icon: '🚨',
        duration: 5000
      });
    } else {
      toast.error('Hubo un problema al cargar tu carrito. Por favor, intenta de nuevo.', {
        icon: '❌',
        duration: 4000
      });
    }
  }, []);

  const resetNotifications = useCallback(() => {
    setHasShownCorruptionWarning(false);
  }, []);

  return {
    notifyCartCleaned,
    notifyQuantityLimited,
    notifyCartError,
    resetNotifications
  };
};

export default useCartNotifications;
