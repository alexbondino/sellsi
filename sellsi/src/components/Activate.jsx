import React, { useState, memo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Fade,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { CustomButton, Timer, VerificationCodeInput } from '../hooks/shared';
import { useBanner } from '../contexts/BannerContext';
import { sendActivationCode, verifyActivationCode } from '../services/supabase'; // 🔥 NUEVA IMPORTACIÓN

// ✅ CONSTANTS (mismo que Login.jsx)
const CONSTANTS = {
  FORM_WIDTH: 400,
};

// ✅ LOGO COMPONENT (mismo que Login.jsx)
const Logo = memo(() => (
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <img
      src="/logo.svg"
      alt="SELLSI Logo"
      style={{ width: 160, marginBottom: 8 }}
    />
    <Typography
      variant="h6"
      sx={{
        color: '#222',
        fontWeight: 700,
        fontSize: 18,
        fontStyle: 'italic',
      }}
    >
      Conecta. Vende. Crece.
    </Typography>
  </Box>
));

// ✅ ACTIVATION FORM COMPONENT
const ActivationForm = memo(({ email, onSubmit, error }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      width: CONSTANTS.FORM_WIDTH,
      maxWidth: '90%',
      mt: 3,
      mb: 3,
      borderRadius: 2,
    }}
  >
    <form onSubmit={onSubmit}>
      <Box display="flex" flexDirection="column" gap={2}>
        {/* Título */}
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            fontWeight: 600,
            color: '#1976d2',
            mb: 1,
          }}
        >
          Activar Cuenta
        </Typography>

        {/* Descripción */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            mb: 2,
          }}
        >
          Tu cuenta necesita ser activada. Te enviaremos un codigo al correo de
          la cuenta, para que puedas activarla.
          <br />
          <strong>{email}</strong>
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Botón Enviar Código - Estilo Step1Email.jsx */}
        <CustomButton
          type="submit"
          sx={{
            backgroundColor: '#41B6E6',
            color: '#fff',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 16,
            width: '100%',
            height: 42,
            boxShadow: 'none',
            mb: 0.5,
            '&:hover': {
              backgroundColor: '#2fa4d6',
            },
          }}
        >
          Enviar Código
        </CustomButton>
      </Box>
    </form>
  </Paper>
));

// ✅ FOOTER COMPONENT
const ActivationFooter = memo(({ onCancel }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    mt={2}
    gap={1}
    width="100%"
  >
    <CustomButton
      variant="text"
      onClick={onCancel}
      sx={{
        fontSize: 14,
        fontWeight: 600,
        color: '#666',
        textTransform: 'none',
        width: '90%',
      }}
    >
      Cancelar
    </CustomButton>
  </Box>
));

// ✅ STEP 2 CODE ACTIVATION COMPONENT (Réplica de Step2Code.jsx)
const Step2CodeActivation = memo(
  ({
    email,
    codigo,
    setCodigo,
    timer,
    onVerify,
    onResendCode,
    onBack,
    showCodigoEnviado,
    fadeIn,
    error,
  }) => {
    const codigoCompleto = codigo.every(c => c.length === 1);

    return (
      <Paper
        elevation={3}
        sx={{
          p: 3,
          width: CONSTANTS.FORM_WIDTH,
          maxWidth: '90%',
          mt: 3,
          mb: 3,
          borderRadius: 2,
        }}
      >
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
            <strong>{email}</strong>.<br />
            Introduce el código en las casillas inferiores.
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <VerificationCodeInput
              codigo={codigo}
              setCodigo={setCodigo}
              length={5}
              size="large"
            />
          </Box>
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
          </Typography>
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
      </Paper>
    );
  }
);

// ✅ MAIN COMPONENT
export default function Activate({
  open,
  onClose,
  email = '',
  onActivationSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Send Code, 2: Verify Code (sin Step 3)
  const [codigo, setCodigo] = useState(['', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutos
  const [showCodigoEnviado, setShowCodigoEnviado] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  const { showBanner } = useBanner(); // Hook del banner

  // Reset al abrir/cerrar modal
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setCodigo(['', '', '', '', '']);
      setError('');
      setIsLoading(false);
      setTimer(300);
      setShowCodigoEnviado(false);
      setFadeIn(false);
    }
  }, [open]);

  // Timer countdown
  React.useEffect(() => {
    if (step === 2 && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);
  const handleSendCode = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Sending verification code to:', email);

      // 🔥 INTEGRACIÓN REAL: Enviar código de activación
      const result = await sendActivationCode(email);

      if (!result.success) {
        setError(
          result.error || 'Error al enviar el código. Intenta de nuevo.'
        );
        return;
      }

      console.log('Code sent successfully');

      // Mostrar código en desarrollo
      if (result.developmentCode) {
        console.log('🔧 Development code:', result.developmentCode);
      }

      setStep(2); // Pasar al paso de verificación
      setTimer(300); // Resetear timer
    } catch (error) {
      console.error('Error sending code:', error);
      setError('Error al enviar el código. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = codigo.join('');

    if (code.length !== 5) {
      setError('El código debe tener 5 dígitos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Verifying activation code:', code, 'for email:', email);

      // 🔥 INTEGRACIÓN REAL: Verificar código de activación
      const result = await verifyActivationCode(email, code);

      if (!result.success) {
        setError(
          result.error || 'Código incorrecto o expirado. Intenta de nuevo.'
        );
        return;
      }
      console.log('Account activated successfully');

      // 🔥 NUEVA LÓGICA: Refrescar datos del usuario y verificar activación
      let activationConfirmed = false;
      if (onActivationSuccess) {
        console.log(
          '🔄 Refrescando datos del usuario después de activación...'
        );
        activationConfirmed = await onActivationSuccess();
      }

      // Solo cerrar el modal si la activación fue confirmada
      if (activationConfirmed !== false) {
        // Cerrar el modal
        handleSuccess();

        // Mostrar banner de éxito después de cerrar
        showBanner({
          message:
            '¡Tu cuenta ha sido activada con éxito! Ya puedes iniciar sesión.',
          severity: 'success',
          duration: 6000,
        });
      } else {
        // Si la activación no se confirmó, mostrar error
        setError('Error al confirmar la activación. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Código incorrecto o expirado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setShowCodigoEnviado(false);

    try {
      console.log('Resending verification code to:', email);

      // 🔥 INTEGRACIÓN REAL: Reenviar código de activación
      const result = await sendActivationCode(email);

      if (!result.success) {
        setError(
          result.error || 'Error al reenviar el código. Intenta de nuevo.'
        );
        return;
      }

      // Mostrar código en desarrollo
      if (result.developmentCode) {
        console.log('🔧 Development code:', result.developmentCode);
      }

      setShowCodigoEnviado(true);
      setFadeIn(true);
      setTimer(300); // Resetear timer

      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setFadeIn(false);
        setTimeout(() => setShowCodigoEnviado(false), 400);
      }, 3000);
    } catch (error) {
      console.error('Error resending code:', error);
      setError('Error al reenviar el código. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setCodigo(['', '', '', '', '']);
    setError('');
  };

  const handleCancel = () => {
    setStep(1);
    setCodigo(['', '', '', '', '']);
    setError('');
    onClose();
  };

  const handleSuccess = () => {
    setStep(1);
    setCodigo(['', '', '', '', '']);
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={false}
      disableScrollLock={true}
      disableRestoreFocus={true}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'fixed',
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ p: 3 }}
        >
          <Logo />
          {step === 1 && (
            <>
              <ActivationForm
                email={email}
                onSubmit={handleSendCode}
                error={error}
              />
              <ActivationFooter onCancel={handleCancel} />
            </>
          )}{' '}
          {step === 2 && (
            <Step2CodeActivation
              email={email}
              codigo={codigo}
              setCodigo={setCodigo}
              timer={timer}
              onVerify={handleVerifyCode}
              onResendCode={handleResendCode}
              onBack={handleBack}
              showCodigoEnviado={showCodigoEnviado}
              fadeIn={fadeIn}
              error={error}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
