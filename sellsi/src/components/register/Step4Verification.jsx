import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { Timer, VerificationCodeInput, CustomButton } from '../shared';

const Step4Verification = ({ 
  email,
  codigo,
  setCodigo,
  timer,
  onVerify,
  onResendCode,
  onBack,
  showCodigoEnviado,
  fadeIn
}) => {
  const codigoCompleto = codigo.every(c => c.length === 1);

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
        sx={{
          mb: 2,
          mt: 2,
          fontWeight: 700,
          textAlign: 'center',
          fontSize: 20,
        }}
      >
        Hemos enviado un código de verificación al correo:
      </Typography>
      
      <Typography
        sx={{
          mb: 2,
          textAlign: 'center',
          fontSize: 18,
          fontWeight: 700,
          color: '#000',
        }}
      >
        <strong>{email}</strong>
      </Typography>
      
      <Typography sx={{ mb: 2, textAlign: 'center', fontSize: 14 }}>
        Ingresa el código de verificación que recibiste para activar tu cuenta.
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
        <Timer timer={timer} size="large" />
      </Box>

      <Box sx={{ mb: 1.5, mt: 2 }}>
        <VerificationCodeInput
          codigo={codigo}
          setCodigo={setCodigo}
          length={5}
          size="large"
        />
      </Box>

      <CustomButton
        variant="text"
        onClick={onResendCode}
        sx={{ mb: 2, fontSize: 14 }}
      >
        Reenviar Código
      </CustomButton>

      <CustomButton
        disabled={!codigoCompleto}
        onClick={onVerify}
        sx={{
          width: 220,
          height: 44,
          mb: 3,
          mt: 1,
        }}
      >
        Verificar Código
      </CustomButton>

      <CustomButton
        variant="text"
        onClick={onBack}
        sx={{
          color: '#888',
          fontSize: 14,
          '&:hover': { color: '#1976d2', background: 'transparent' },
        }}
      >
        Volver atrás
      </CustomButton>
      
      {showCodigoEnviado && (
        <Fade in={fadeIn} timeout={800} unmountOnExit>
          <Typography
            sx={{
              color: '#41B6E6',
              fontWeight: 500,
              mt: 1,
              fontSize: 14,
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

export default Step4Verification;