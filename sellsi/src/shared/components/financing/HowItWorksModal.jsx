import React from 'react';
import { Typography } from '@mui/material';
import Modal from '../feedback/Modal/Modal';

const HowItWorksModal = ({ open, onClose }) => {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      type="info"
      title="¿Cómo funciona?"
      showCancelButton={true}
      submitButtonText={null}
      contentDividers={false}
    >
      <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line' }}>
        Aquí puedes incluir una explicación breve y clara sobre cómo funcionan los financiamientos en Sellsi. Puedes
        detallar pasos como: 1) El comprador solicita financiamiento; 2) Sellsi revisa y aprueba; 3) El proveedor cobra
        al presentar factura, etc. Para más detalles, agrega un enlace a la documentación interna o contacto de
        soporte.
      </Typography>
    </Modal>
  );
};

export default HowItWorksModal;