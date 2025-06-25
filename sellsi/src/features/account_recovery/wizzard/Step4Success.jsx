import React from 'react';
import { Box, Typography } from '@mui/material';
import { PrimaryButton } from '../..';

const Step4Success = ({ onClose }) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography
        variant="h5"
        sx={{ mt: 2, fontWeight: 700, textAlign: 'center' }}
      >
        ¡Su contraseña ha sido cambiada con éxito!
      </Typography>

      <PrimaryButton
        onClick={onClose}
        sx={{
          fontSize: 20,
          px: 4,
          py: 1,
          width: 300,
          mb: 4,
          mt: 5,
        }}
      >
        Iniciar Sesión
      </PrimaryButton>
    </Box>
  );
};

export default Step4Success;
