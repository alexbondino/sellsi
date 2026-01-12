/**
 * ============================================================================
 * FINANCING MODALS ORCHESTRATOR - Orquestador de Modales de Financiamiento
 * ============================================================================
 * 
 * Componente contenedor que orquesta el flujo completo de solicitud de
 * financiamiento entre los tres modales:
 * 1. Modal de selección de tipo
 * 2. Modal de solicitud extendida
 * 3. Modal de solicitud express
 * 
 * Uso:
 * ```jsx
 * import FinancingModals from './FinancingModals';
 * 
 * const MyComponent = () => {
 *   const [open, setOpen] = useState(false);
 * 
 *   const handleFinancingSubmit = async (data) => {
 *     console.log('Solicitud:', data);
 *     // Enviar a API
 *   };
 * 
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>
 *         Solicitar Financiamiento
 *       </Button>
 *       <FinancingModals
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         onSubmit={handleFinancingSubmit}
 *       />
 *     </>
 *   );
 * };
 * ```
 */

import React, { useState } from 'react';
import FinancingRequestModal from './FinancingRequestModal';
import ExtendedRequestModal from './ExtendedRequestModal';
import ExpressRequestModal from './ExpressRequestModal';

const FinancingModals = ({ open, onClose, onSubmit }) => {
  const [currentModal, setCurrentModal] = useState('selector'); // 'selector' | 'extended' | 'express'

  // Manejar selección de tipo en modal principal
  const handleSelectType = (type) => {
    if (type === 'extended') {
      setCurrentModal('extended');
    } else if (type === 'express') {
      setCurrentModal('express');
    }
  };

  // Volver al modal de selección
  const handleBack = () => {
    setCurrentModal('selector');
  };

  // Manejar cierre de cualquier modal
  const handleClose = () => {
    setCurrentModal('selector');
    onClose();
  };

  // Manejar envío de solicitud
  const handleSubmit = async (data) => {
    await onSubmit(data);
    handleClose();
  };

  return (
    <>
      {/* Modal de selección de tipo */}
      <FinancingRequestModal
        open={open && currentModal === 'selector'}
        onClose={handleClose}
        onSelectType={handleSelectType}
      />

      {/* Modal de solicitud extendida */}
      <ExtendedRequestModal
        open={open && currentModal === 'extended'}
        onClose={handleClose}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />

      {/* Modal de solicitud express */}
      <ExpressRequestModal
        open={open && currentModal === 'express'}
        onClose={handleClose}
        onBack={handleBack}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default FinancingModals;
