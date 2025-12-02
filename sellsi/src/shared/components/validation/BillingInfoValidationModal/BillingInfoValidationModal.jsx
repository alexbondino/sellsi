import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useBillingInfoValidation } from '../../../hooks/profile/useBillingInfoValidation';
import { useAuth } from '../../../../infrastructure/providers';

export const useBillingInfoModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isBuyer } = useAuth();
  const { isComplete, isLoading, missingFieldLabels } = useBillingInfoValidation();

  const openIfIncomplete = () => {
    if (!isLoading && !isComplete) {
      setIsOpen(true);
      return true; // se abrió modal
    }
    return false; // no se abrió
  };

  const handleGoToBilling = () => {
    setIsOpen(false);
    // Navegar al perfil con parámetros para resaltar campos de billing
    // Detectar rol para usar la ruta correcta
    const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
    navigate(`${profilePath}?section=billing&highlight=true`);
  };

  const handleClose = () => setIsOpen(false);

  return { isOpen, setIsOpen, isComplete, isLoading, missingFieldLabels, openIfIncomplete, handleGoToBilling, handleClose };
};

export const BillingInfoValidationModal = ({
  isOpen,
  onClose,
  onGoToBilling,
  loading = false,
  missingFieldLabels = []
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onGoToBilling}
      type={MODAL_TYPES.WARNING}
      title="¡Estás a sólo un paso!"
      submitButtonText="Completar Facturación"
      cancelButtonText="Aún No"
      showCancelButton={true}
      loading={loading}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Completa tus datos de facturación para emitir factura en esta compra
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

export default BillingInfoValidationModal;
