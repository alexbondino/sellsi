import { useState } from 'react';

/**
 * Hook personalizado para manejar el estado de los modales de Términos y Condiciones
 * y Política de Privacidad en el proceso de registro.
 */
export const useTermsModal = () => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const openTermsModal = () => {
    setIsTermsModalOpen(true);
  };

  const closeTermsModal = () => {
    setIsTermsModalOpen(false);
  };

  const openPrivacyModal = () => {
    setIsPrivacyModalOpen(true);
  };

  const closePrivacyModal = () => {
    setIsPrivacyModalOpen(false);
  };

  return {
    isTermsModalOpen,
    openTermsModal,
    closeTermsModal,
    isPrivacyModalOpen,
    openPrivacyModal,
    closePrivacyModal,
  };
};

export default useTermsModal;
