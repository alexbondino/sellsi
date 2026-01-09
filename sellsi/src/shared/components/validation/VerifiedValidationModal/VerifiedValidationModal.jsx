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
import { Box, Typography, Link, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useAuth } from '../../../../infrastructure/providers/UnifiedAuthProvider';

/**
 * Hook personalizado para manejar la lógica del modal de verificación
 */
export const useVerifiedModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { userProfile, loadingUserStatus } = useAuth();

  /**
   * Verifica si el usuario está verificado y es proveedor principal
   * @param {Function} callback - Función a ejecutar si cumple requisitos
   * @returns {boolean} - true si cumple requisitos, false si se mostró el modal
   */
  const checkAndProceed = (callback = null) => {
    if (loadingUserStatus) {
      return false; // No hacer nada mientras se carga
    }

    // Si no está verificado o no es proveedor principal, mostrar modal
    if (!userProfile?.verified || !userProfile?.main_supplier) {
      setIsOpen(true);
      return false;
    }

    // Si cumple ambos requisitos, ejecutar callback
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
    isMainSupplier: userProfile?.main_supplier || false,
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
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const isVerified = userProfile?.verified || false;
  const isMainSupplier = userProfile?.main_supplier || false;

  // Determinar el contenido según las combinaciones
  const getModalContent = () => {
    // Caso 1: No es proveedor principal y no está verificado
    if (!isMainSupplier && !isVerified) {
      return {
        title: "Verificación Requerida",
        message: "Necesitas estar verificado por Sellsi y tener como función principal Proveedor para publicar productos",
        showContactInfo: true,
        showProfileButton: false
      };
    }
    
    // Caso 2: Es proveedor principal pero no está verificado
    if (isMainSupplier && !isVerified) {
      return {
        title: "Verificación Requerida",
        message: "Necesitas estar verificado por Sellsi para publicar productos",
        showContactInfo: true,
        showProfileButton: false
      };
    }
    
    // Caso 3: Está verificado pero no es proveedor principal
    if (!isMainSupplier && isVerified) {
      return {
        title: "Cuenta Proveedor",
        message: "Necesitas tener tu función principal como Proveedor para poder publicar productos",
        showContactInfo: false,
        showProfileButton: true
      };
    }

    // Caso 4: Cumple ambos requisitos (no debería mostrarse el modal)
    return null;
  };

  const content = getModalContent();

  if (!content) {
    return null;
  }

  const handleGoToProfile = () => {
    navigate('/supplier/profile');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      type={MODAL_TYPES.WARNING}
      title={content.title}
      submitButtonText={content.showProfileButton ? "Ir a mi Perfil" : "Entendido"}
      showCancelButton={false}
      onSubmit={content.showProfileButton ? handleGoToProfile : onClose}
    >
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
          {content.message}
        </Typography>
        
        {content.showContactInfo && (
          <>
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
          </>
        )}

        {content.showProfileButton && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configura tu función principal en tu perfil
          </Typography>
        )}
      </Box>
    </Modal>
  );
};

export default VerifiedValidationModal;
