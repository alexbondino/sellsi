import React from 'react';
import { Box, Typography } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { CustomButton } from '../shared';

const Step5Success = ({ onClose }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={300}
    >
      <Typography
        variant="h5"
        sx={{ mt: 6, fontWeight: 700, textAlign: 'center', fontSize: 22 }}
      >
        ¡Tu cuenta ha sido creada con éxito!
      </Typography>
      
      <Typography
        sx={{ mt: 2, textAlign: 'center', fontSize: 16, color: '#555' }}
      >
        Ahora puedes disfrutar de todos los beneficios de ser parte de SELLSI.
      </Typography>
      
      <CustomButton
        onClick={onClose}
        startIcon={<StorefrontIcon />}
        sx={{
          fontSize: 18,
          px: 3,
          py: 1.2,
          width: 260,
          mb: 8,
          mt: 6,
        }}
      >
        Ir a Marketplace
      </CustomButton>
    </Box>
  );
};

export default Step5Success;