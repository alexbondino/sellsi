import React from 'react';
import { Box, Typography } from '@mui/material';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useNavigate } from 'react-router-dom';
import { useShippingInfoValidation } from '../../../hooks/profile/useShippingInfoValidation';

// Hook para controlar apertura del modal de shipping
export const useShippingInfoModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  // Reusamos unified shipping para saber si el usuario tiene región configurada
  const { isComplete, isLoading, missingFieldLabels, refresh } = useShippingInfoValidation();
  const navigate = useNavigate();

  // Refs reactivas para leer estado actual dentro de timers
  const isLoadingRef = React.useRef(isLoading);
  const isCompleteRef = React.useRef(isComplete);
  React.useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  React.useEffect(() => { isCompleteRef.current = isComplete; }, [isComplete]);

  const openIfIncomplete = () => {
    const loading = isLoadingRef.current;
    const complete = isCompleteRef.current;
    
    
    // Si está cargando, esperar a que termine
    if (loading) {
      // Esperar hasta que termine de cargar y luego verificar
      const checkAfterLoad = () => {
        if (!isLoadingRef.current && !isCompleteRef.current) {
          setIsOpen(true);
        }
      };
      
      // Usar un pequeño delay para permitir que el estado se actualice
      setTimeout(checkAfterLoad, 100);
      return false; // No abrir inmediatamente
    }
    
    if (!complete) {
      setIsOpen(true);
      return true;
    }
    return false;
  };

  const handleConfigureShipping = () => {
    setIsOpen(false);
    navigate('/supplier/profile?section=shipping&highlight=true');
  };

  const handleClose = () => setIsOpen(false);
  
  // Espera activa a que termine la validación (con timeout) y retorna el estado final
  const awaitValidation = async (timeoutMs = 4000, stepMs = 120) => {
    const startedAt = Date.now();
    if (!isLoadingRef.current) return { complete: isCompleteRef.current };
    return new Promise(resolve => {
      const tick = () => {
        if (!isLoadingRef.current) {
          resolve({ complete: isCompleteRef.current });
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          resolve({ complete: isCompleteRef.current });
          return;
        }
        setTimeout(tick, stepMs);
      };
      setTimeout(tick, stepMs);
    });
  };

  return { isOpen, setIsOpen, openIfIncomplete, isComplete, isLoading, missingFieldLabels, handleConfigureShipping, handleClose, refresh, awaitValidation };
};

/**
 * Modal para solicitar que el usuario configure su dirección de despacho
 */
export const ShippingInfoValidationModal = ({
  isOpen,
  onClose,
  onGoToShipping,
  loading = false,
  missingFieldLabels = []
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onGoToShipping}
      type={MODAL_TYPES.WARNING}
      title="¡Estás a sólo un paso!"
      submitButtonText="Configurar Despacho"
      cancelButtonText="Aún No"
      showCancelButton={true}
      loading={loading}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Configura tu dirección de despacho para poder comprar este producto
        </Typography>
        {missingFieldLabels.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Campos faltantes: {missingFieldLabels.join(', ')}
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default ShippingInfoValidationModal;