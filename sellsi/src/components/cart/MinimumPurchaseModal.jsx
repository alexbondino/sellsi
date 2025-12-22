import React from 'react';
import { Typography, Box } from '@mui/material';
import Modal from '../../shared/components/feedback/Modal/Modal';
import { MODAL_TYPES } from '../../shared/components/feedback/Modal/modalConfig';

/**
 * Modal bloqueante que muestra cuando no se cumple la compra mínima de proveedores
 * @param {boolean} open - Estado del modal
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Array} violations - Array de violaciones con estructura:
 *   [{ supplierName, minimumAmount, currentTotal, missing }]
 */
const MinimumPurchaseModal = ({ open, onClose, violations = [] }) => {
  // ⚠️ VALIDAR: Si no hay violations, no mostrar modal (safety check)
  if (!open || !violations || violations.length === 0) {
    return null;
  }

  // Construir el mensaje según la cantidad de proveedores
  const MAX_SUPPLIERS_TO_SHOW = 3;
  let supplierMessage;
  
  if (violations.length === 1) {
    supplierMessage = `el proveedor ${violations[0].supplierName}`;
  } else if (violations.length <= MAX_SUPPLIERS_TO_SHOW) {
    const names = violations.map(v => v.supplierName).join(', ');
    supplierMessage = `${violations.length} proveedores (${names})`;
  } else {
    const firstThree = violations.slice(0, MAX_SUPPLIERS_TO_SHOW).map(v => v.supplierName).join(', ');
    const remaining = violations.length - MAX_SUPPLIERS_TO_SHOW;
    supplierMessage = `${violations.length} proveedores (${firstThree}, +${remaining})`;
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      type={MODAL_TYPES.WARNING}
      title="No puedes continuar con el pago"
      submitButtonText="Entendido"
      showCancelButton={false}
      onSubmit={onClose}
    >
      <Box sx={{ py: 1 }}>
        <Typography variant="body1" color="text.primary" sx={{ mb: 2, lineHeight: 1.6 }}>
          Tu carrito no cumple con el monto mínimo de compra exigido por{' '}
          <strong>{supplierMessage}</strong>.
        </Typography>
        <Typography variant="body1" color="text.primary">
          Revisa el detalle en tu carrito y agrega más productos o aumenta las cantidades.
        </Typography>
      </Box>
    </Modal>
  );
};

export default MinimumPurchaseModal;
