import React from 'react';
import { Box, Typography, Fade, Button } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {
  Timer,
  VerificationCodeInput,
  CustomButton,
} from '../../landing_page/hooks';

const Step2Code = ({
  correo,
  codigo,
  setCodigo,
  timer,
  onVerify,
  onResendCode,
  onBack,
  showCodigoEnviado,
  fadeIn,
}) => {
  const codigoCompleto = codigo.every(c => c.length === 1);

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 90,
          height: 90,
          borderRadius: '50%',
          bgcolor: '#f0f8ff',
          border: '2px solid #e3f2fd',
          mb: 2,
        }}
      >
        <LockOutlinedIcon
          sx={{
            fontSize: 50,
            color: '#1976d2',
          }}
        />
      </Box>
      <Typography align="center" sx={{ mb: 2, mt: 1 }}>
        Hemos enviado un código de verificación al correo:{' '}
        <strong>{correo}</strong>.<br />
        Introduce el código en las casillas inferiores.
      </Typography>
      <Box sx={{ mb: 2 }}>
        <VerificationCodeInput
          codigo={codigo}
          setCodigo={setCodigo}
          length={5}
          size="large"
        />
      </Box>{' '}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Timer timer={timer} size="large" />
      </Box>
      <CustomButton
        disabled={!codigoCompleto}
        onClick={onVerify}
        sx={{
          width: 220,
          height: { xs: '32px', sm: '32px', md: '44px', lg: '44px' },
          mb: 3,
          mt: 1,
        }}
      >
        Verificar Código
      </CustomButton>
      <Typography variant="body2" sx={{ mb: 1 }}>
        ¿No has recibido el código?
      </Typography>{' '}
      <CustomButton
        variant="text"
        onClick={onResendCode}
        sx={{ fontWeight: 700, mb: 2, fontSize: 16 }}
      >
        Reenviar Código
      </CustomButton>
      <Button
        variant="text"
        onClick={onBack}
        sx={{
          color: '#1976d2',
          fontWeight: 700,
          fontSize: 14,
          width: '100%',
          mt: 0.5,
        }}
      >
        Volver atrás
      </Button>
      {showCodigoEnviado && (
        <Fade in={fadeIn} timeout={800} unmountOnExit>
          <Typography
            sx={{
              color: '#41B6E6',
              fontWeight: 500,
              mb: 2,
              mt: 2,
              transition: 'opacity 0.8s',
              opacity: fadeIn ? 1 : 0,
            }}
          >
            El código ha sido reenviado a tu correo.
          </Typography>
        </Fade>
      )}
    </Box>
  );
};

export default Step2Code;
