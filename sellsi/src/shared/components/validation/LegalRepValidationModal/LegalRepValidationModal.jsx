/**
 * ============================================================================
 * LEGAL REPRESENTATIVE VALIDATION MODAL - COMPONENTE MODULAR
 * ============================================================================
 * 
 * Modal reutilizable para validar información de representante legal antes 
 * de permitir firmar documentos de financiamiento.
 * 
 * Características:
 * - Valida presencia de RUT y Nombre de Representante Legal
 * - Modal reutilizable del sistema de design
 * - Navegación inteligente a la pestaña de Facturación en Profile
 * - Manejo de estados de loading
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useAuth } from '../../../../infrastructure/providers';

/**
 * Hook personalizado para manejar la lógica del modal
 */
export const useLegalRepModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const { isBuyer, userProfile, loadingUserStatus } = useAuth();
  
  // Verificar si el representante legal está completo
  const isComplete = React.useMemo(() => {
    if (!userProfile) return false;
    
    // Validar campos supplier_legal_representative_name y supplier_legal_representative_rut
    return !!(
      userProfile.supplier_legal_representative_rut && 
      userProfile.supplier_legal_representative_name
    );
  }, [userProfile]);
  
  const missingFieldLabels = React.useMemo(() => {
    if (!userProfile) return [];
    
    const missing = [];
    
    if (!userProfile.supplier_legal_representative_rut) missing.push('RUT Representante Legal');
    if (!userProfile.supplier_legal_representative_name) missing.push('Nombre Representante Legal');
    
    return missing;
  }, [userProfile]);

  /**
   * Verifica si la información está completa y muestra modal si no
   * @param {Function} callback - Función a ejecutar si está completa
   * @returns {boolean} - true si está completa, false si se mostró el modal
   */
  const checkAndProceed = (callback = null) => {
    if (loadingUserStatus) {
      return false; // No hacer nada mientras se carga el perfil
    }

    if (!isComplete) {
      setIsOpen(true);
      return false;
    }

    // Si está completa, ejecutar callback
    if (callback) {
      callback();
    }
    
    return true;
  };

  const handleGoToLegal = () => {
    setIsOpen(false);
    // Navegar al perfil con parámetros para mostrar pestaña Legal
    const profilePath = isBuyer ? '/buyer/profile' : '/supplier/profile';
    navigate(`${profilePath}?section=legal&highlight=true`);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    loading: loadingUserStatus,
    missingFieldLabels,
    checkAndProceed,
    handleGoToLegal,
    handleClose,
    isLegalRepComplete: isComplete,
    isLoadingLegalRep: loadingUserStatus
  };
};

/**
 * Componente Modal para validación de representante legal
 */
export const LegalRepValidationModal = ({
  isOpen,
  onClose,
  onGoToLegal,
  loading = false,
  missingFieldLabels = []
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onGoToLegal}
      type={MODAL_TYPES.WARNING}
      title="¡Información Incompleta!"
      submitButtonText="Configurar Datos"
      cancelButtonText="Cancelar"
      showCancelButton={true}
      loading={loading}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          Para firmar el documento necesitas completar la información del representante legal
        </Typography>
        {missingFieldLabels.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            Campos faltantes: {missingFieldLabels.join(', ')}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Serás redirigido a tu perfil en la sección Legal
        </Typography>
      </Box>
    </Modal>
  );
};

export default LegalRepValidationModal;
