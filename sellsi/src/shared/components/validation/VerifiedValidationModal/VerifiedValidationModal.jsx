/**
 * ============================================================================
 * VERIFIED VALIDATION MODAL - COMPONENTE MODULAR
 * ============================================================================
 * 
 * Modal reutilizable para validar que el usuario esté verificado por Sellsi
 * antes de permitir acciones como agregar/editar productos o carga masiva.
 * 
 * Características:
 * - Usa el sistema de validación centralizado
 * - Modal reutilizable del sistema de design
 * - Muestra mensaje de contacto para iniciar verificación
 * - Manejo de estados de loading
 */

import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useAuth } from '../../../../infrastructure/providers';

/**
 * Hook personalizado para manejar la lógica del modal de verificación
 */
export const useVerifiedModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { userProfile, loadingUserStatus } = useAuth();

  /**
   * Verifica si el usuario está verificado y muestra modal si no lo está
   * @param {Function} callback - Función a ejecutar si está verificado
   * @returns {boolean} - true si está verificado, false si se mostró el modal
   */
  const checkAndProceed = (callback = null) => {
    if (loadingUserStatus) {
      return false; // No hacer nada mientras se carga
    }

    // Si no está verificado, mostrar modal
    if (!userProfile?.verified) {
      setIsOpen(true);
      return false;
    }

    // Si está verificado, ejecutar callback
    if (callback) {
      callback();
    }
    
    return true;
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    checkAndProceed,
    handleClose,
    isVerified: userProfile?.verified || false,
    isLoadingVerification: loadingUserStatus
  };
};

/**
 * Componente Modal para validación de verificación
 */
export const VerifiedValidationModal = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type={MODAL_TYPES.WARNING}
      title="Verificación Requerida"
      submitButtonText="Entendido"
      showCancelButton={false}
      onSubmit={onClose}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          Necesitas estar verificado por Sellsi para publicar productos
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Para iniciar el proceso de verificación, contáctanos:
        </Typography>

        <Box sx={{ 
          bgcolor: 'grey.50', 
          p: 2, 
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          mb: 2
        }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            📞 Teléfono/WhatsApp:{' '}
            <Link 
              href="https://wa.me/56963109664" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              +56 9 6310 9664
            </Link>
          </Typography>
          
          <Typography variant="body2">
            ✉️ Email:{' '}
            <Link 
              href="mailto:contacto@sellsi.cl"
              sx={{ fontWeight: 600, color: 'primary.main' }}
            >
              contacto@sellsi.cl
            </Link>
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Nuestro equipo procesará tu solicitud a la brevedad
        </Typography>
      </Box>
    </Modal>
  );
};

export default VerifiedValidationModal;
