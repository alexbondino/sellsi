import React from 'react';
import { Box, Container } from '@mui/material';
import BannedPageUI from '../ui/bannedpage';
import { useBanStatus } from '../../hooks/useBanStatus';

const BanPageView = () => {
  const { banStatus } = useBanStatus();

  const handleContactClick = () => {
    const subject = encodeURIComponent('Revisión de cuenta baneada');
    const body = encodeURIComponent(`Hola,

Mi cuenta ha sido suspendida en Sellsi y me gustaría obtener más información sobre esta decisión.

${banStatus?.reason ? `Motivo mostrado: ${banStatus.reason}` : ''}
${banStatus?.banType ? `Tipo de suspensión: ${banStatus.banType === 'user' ? 'Usuario' : 'Dirección IP'}` : ''}

Por favor, revisen mi caso y proporcionen más detalles sobre los pasos a seguir.

Gracias.`);
    
    window.location.href = `mailto:contacto@sellsi.cl?subject=${subject}&body=${body}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#1565c0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <BannedPageUI 
        onContactClick={handleContactClick} 
        banStatus={banStatus}
      />
    </Box>
  );
};

export default BanPageView;
