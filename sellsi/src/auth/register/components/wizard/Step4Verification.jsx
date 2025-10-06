import React from 'react';
import { Box, Typography } from '@mui/material';
import { PrimaryButton } from '../../../../shared/components';

const Step4Verification = ({ email, onBack }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={300}
      textAlign="center"
      px={2}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          mt: 2,
          fontWeight: 700,
          fontSize: 24,
          color: '#2E7D32',
        }}
      >
        ¡Cuenta creada con éxito!
      </Typography>
      <Typography sx={{ fontSize: 16, mb: 2 }}>
        Te hemos enviado un enlace de verificación al correo:
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: 18, mb: 3, color: '#000' }}>
        {email}
      </Typography>
      <Typography sx={{ fontSize: 15, color: '#555', mb: 4 }}>
        Por favor revisa tu bandeja de entrada (o spam) y haz clic en el enlace
        para activar tu cuenta y comenzar a usar Sellsi.
      </Typography>{' '}
      <PrimaryButton
        onClick={onBack}
        variant="text"
        sx={{
          fontSize: 14,
          color: '#888',
          '&:hover': { color: '#1976d2', background: 'transparent' },
          height: { md: '32px' },
        }}
      >
        Volver
      </PrimaryButton>
    </Box>
  );
};

export default Step4Verification;
