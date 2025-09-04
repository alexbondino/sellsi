import React from 'react';
import { Box, Typography } from '@mui/material';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useNavigate } from 'react-router-dom';
import { useShippingInfoValidation } from '../../../hooks/profile/useShippingInfoValidation';

// Hook para controlar apertura del modal de shipping
export const useShippingInfoModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  // Reusamos unified shipping para saber si el usuario tiene región configurada
  const { isComplete, isLoading, missingFieldLabels } = useShippingInfoValidation();
  const navigate = useNavigate();

  const openIfIncomplete = () => {
    if (!isLoading && !isComplete) {
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

  return { isOpen, setIsOpen, openIfIncomplete, isComplete, isLoading, missingFieldLabels, handleConfigureShipping, handleClose };
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
          Configura tu dirección de despacho para poder ofertar este producto
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