/**
 * ============================================================================
 * TRANSFER INFO VALIDATION MODAL - COMPONENTE MODULAR
 * ============================================================================
 * 
 * Modal reutilizable para validar información bancaria antes de permitir
 * acciones como agregar/editar productos.
 * 
 * Características:
 * - Usa el hook de validación centralizado
 * - Modal reutilizable del sistema de design
 * - Navegación inteligente con highlighting
 * - Manejo de estados de loading
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useTransferInfoValidation } from '../../../hooks/profile/useTransferInfoValidation';
import { useAuth } from '../../../../infrastructure/providers';

/**
 * Hook personalizado para manejar la lógica del modal
 */
export const useTransferInfoModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { isBuyer } = useAuth();
  
  const { isComplete, isLoading, missingFieldLabels } = useTransferInfoValidation();

  /**
   * Verifica si la información está completa y muestra modal si no
   * @param {string} redirectPath - Ruta a la que dirigir si está completa
   * @param {Function} callback - Función a ejecutar si está completa
   * @returns {boolean} - true si está completa, false si se mostró el modal
   */
  const checkAndProceed = (redirectPath = null, callback = null) => {
    if (isLoading) {
      return false; // No hacer nada mientras se carga
    }

    if (!isComplete) {
      setIsOpen(true);
      return false;
    }

    // Si está completa, ejecutar callback o navegar
    if (callback) {
      callback();
    } else if (redirectPath) {
      navigate(redirectPath);
    }
    
    return true;
  };

  const handleRegisterAccount = () => {
    setIsOpen(false);
    // Navegar con parámetros para resaltar campos
    // Detectar rol para usar la ruta correcta
    const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
    navigate(`${profilePath}?section=transfer&highlight=true`);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    loading,
    missingFieldLabels,
    checkAndProceed,
    handleRegisterAccount,
    handleClose,
    isTransferInfoComplete: isComplete,
    isLoadingTransferInfo: isLoading
  };
};

/**
 * Componente Modal para validación de información bancaria
 */
export const TransferInfoValidationModal = ({
  isOpen,
  onClose,
  onRegisterAccount,
  loading = false,
  missingFieldLabels = []
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onRegisterAccount}
      type={MODAL_TYPES.WARNING}
      title="¡Estás a sólo un paso!"
      submitButtonText="Registrar Cuenta"
      cancelButtonText="Aún No"
      showCancelButton={true}
      loading={loading}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Registra tu cuenta bancaria para recibir los ingresos de esta venta
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

export default TransferInfoValidationModal;
