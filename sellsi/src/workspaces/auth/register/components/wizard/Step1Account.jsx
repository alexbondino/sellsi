import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  PasswordRequirements,
  PrimaryButton,
} from '../../../../../shared/components';
import { supabase } from '../../../../../services/supabase';
// Importa useBanner para mostrar mensajes de error/éxito si es necesario
import { useBanner } from '../../../../../shared/components/display/banners/BannerContext';
import {
  TermsAndConditionsModal,
  PrivacyPolicyModal,
} from '../../../../../shared/components/modals';
import { useTermsModal } from '../../../../../domains/auth/hooks/useTermsModal';

const Step1Account = ({
  formData,
  onFieldChange,
  onNext,
  onCancel,
  showPassword,
  showRepeatPassword,
  onTogglePasswordVisibility,
  onToggleRepeatPasswordVisibility,
}) => {
  const theme = useTheme();
  const { showBanner } = useBanner(); // Hook para mostrar banners
  const {
    isTermsModalOpen,
    openTermsModal,
    closeTermsModal,
    isPrivacyModalOpen,
    openPrivacyModal,
    closePrivacyModal,
  } = useTermsModal();
  const {
    correo,
    contrasena,
    confirmarContrasena,
    aceptaTerminos,
    aceptaComunicaciones,
  } = formData;

  const [emailEnUso, setEmailEnUso] = useState(false);
  // Eliminamos checkingEmail y usamos 'loading' para abarcar ambos estados de espera.
  const [loading, setLoading] = useState(false);

  const correoValido = /^[^@]+@[^@]+\.[^@]+$/.test(correo);
  const contrasenasCoinciden =
    contrasena === confirmarContrasena && confirmarContrasena.length > 0;

  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: contrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(contrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(contrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(contrasena) },
  ];
  const cumpleMinimos = requisitos.filter(r => r.valid).length >= 4;

  const canSubmit =
    cumpleMinimos && aceptaTerminos && correoValido && contrasenasCoinciden;

  const handleSubmit = async e => {
    e.preventDefault();
    // Bloquear si no es válido o ya está cargando
    if (!canSubmit || loading) return;

    setLoading(true); // Iniciar estado de carga
    setEmailEnUso(false); // Reiniciar el mensaje de error de correo en uso

    try {
      // Paso 1: Verificar si el correo ya existe en tu tabla 'users' personalizada (opcional pero útil)
      // Esto proporciona un mensaje más específico si el correo ya está en uso en tu base de datos.
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', correo);

      if (checkError) {
        console.error(
          'Error al verificar el correo en la DB:',
          checkError.message
        );
        showBanner({
          message:
            'Error al verificar el correo. Por favor, inténtalo de nuevo.',
          severity: 'error',
        });
        setLoading(false);
        return;
      }

      if (existingUsers.length > 0) {
        setEmailEnUso(true);
        setLoading(false);
        return;
      }

      // Paso 2: Crear la cuenta de usuario en Supabase Auth
      // Esta es la llamada que activa el envío del correo de verificación.
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: correo,
          password: contrasena,
          options: {
            // Importante: Asegúrate de que esta URL esté en la lista blanca en Supabase
            // (Authentication -> URL Configuration -> Redirect URLs)
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            // NOTA: No pasamos 'data' aquí para full_name, phone, etc.,
            // ya que esos campos se llenarán en pasos posteriores si el flujo lo requiere.
          },
        });

      if (signUpError) {
        console.error('❌ Error al crear cuenta Auth:', signUpError.message);
        if (signUpError.message.includes('User already registered')) {
          setEmailEnUso(true); // Específico para este error de Supabase Auth
        } else {
          // Mostrar un banner para otros errores de registro
          showBanner({
            message: `Error de registro: ${signUpError.message}.`,
            severity: 'error',
          });
        }
        setLoading(false);
        return;
      }

      // Si signUpData.user es null, significa que el correo fue enviado y el usuario está pendiente de confirmación.
      // Este es el comportamiento esperado para los flujos de verificación de correo.
      if (!signUpData.user) {
        showBanner({
          message: `¡Gracias por registrarte! Hemos enviado un correo de verificación a ${correo}. Por favor, revisa tu bandeja de entrada (y spam).`,
          severity: 'success',
          duration: 8000,
        });
        setLoading(false);
        onNext(); // Mover al siguiente paso (Step4Verification)
        return;
      }

      // Si signUpData.user NO es null, significa que la auto-confirmación está habilitada en Supabase (menos común para email verification)
      showBanner({
        message: '¡Registro completado! Bienvenido a Sellsi.',
        severity: 'success',
        duration: 6000,
      });
      setLoading(false);
      onNext(); // Mover al siguiente paso (Step4Verification)
    } catch (error) {
      console.error('Error inesperado durante el registro:', error);
      showBanner({
        message:
          'Ocurrió un error inesperado durante el registro. Inténtalo de nuevo.',
        severity: 'error',
      });
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 520,
        width: '100%',
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mb: 1,
        mt: 0,
      }}
    >
      {' '}
      <img
        src="/logo.svg"
        alt="SELLSI Logo"
        style={{
          width:
            window.innerWidth < 600 ? 140 : window.innerWidth < 900 ? 110 : 160,
          marginBottom: window.innerWidth < 600 ? 4 : 8,
        }}
      />
      <Typography
        variant="h6"
        align="center"
        sx={{
          mb: { xs: 1, sm: 2, md: 2, lg: 4 },
          color: theme.palette.mode === 'dark' ? '#fff' : '#222',
          fontWeight: 700,
          fontSize: 18,
          fontStyle: 'italic',
        }}
      >
        Conecta. Vende. Crece.
      </Typography>
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {' '}
        <TextField
          label="Correo electrónico"
          variant="outlined"
          fullWidth
          value={correo}
          onChange={e => {
            onFieldChange('correo', e.target.value);
            setEmailEnUso(false); // Clear error when typing
          }}
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
          size="small"
          error={(correo.length > 0 && !correoValido) || emailEnUso}
          helperText={
            emailEnUso
              ? 'Este correo ya está en uso. Intenta con otro.'
              : correo.length > 0 && !correoValido
              ? 'Correo inválido. Ejemplo: usuario@dominio.com'
              : ''
          }
        />{' '}
        <TextField
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          value={contrasena}
          onChange={e => onFieldChange('contrasena', e.target.value)}
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={onTogglePasswordVisibility}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />{' '}
        <TextField
          label="Repita su Contraseña"
          type={showRepeatPassword ? 'text' : 'password'}
          variant="outlined"
          fullWidth
          value={confirmarContrasena}
          onChange={e => onFieldChange('confirmarContrasena', e.target.value)}
          sx={{ mb: { xs: 1, sm: 1, md: 1, lg: 1.5 } }}
          size="small"
          error={confirmarContrasena.length > 0 && !contrasenasCoinciden}
          helperText={
            confirmarContrasena.length > 0 && !contrasenasCoinciden
              ? 'Las contraseñas no coinciden'
              : ''
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={onToggleRepeatPasswordVisibility}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showRepeatPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <PasswordRequirements password={contrasena} size="normal" />
        <FormControlLabel
          control={
            <Checkbox
              checked={aceptaTerminos}
              onChange={e => onFieldChange('aceptaTerminos', e.target.checked)}
              sx={{ color: '#41B6E6' }}
              size="normal"
            />
          }
          label={
            <span style={{ fontSize: 15 }}>
              Acepto los{' '}
              <Link
                component="button"
                onClick={e => {
                  e.preventDefault();
                  openTermsModal();
                }}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  '&:hover': {
                    color: '#41B6E6',
                  },
                }}
              >
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link
                component="button"
                onClick={e => {
                  e.preventDefault();
                  openPrivacyModal();
                }}
                sx={{
                  color: '#1976d2',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  '&:hover': {
                    color: '#41B6E6',
                  },
                }}
              >
                Política de Privacidad
              </Link>
            </span>
          }
          sx={{
            mb: 0.5,
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.4,
            },
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={aceptaComunicaciones}
              onChange={e =>
                onFieldChange('aceptaComunicaciones', e.target.checked)
              }
              sx={{ color: '#41B6E6' }}
              size="normal"
            />
          }
          label={
            <span style={{ fontSize: 15 }}>
              Acepto recibir avisos de ofertas y novedades de Sellsi.
            </span>
          }
          sx={{
            mb: 1.5,
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': {
              lineHeight: 1.4,
            },
          }}
        />
        <PrimaryButton
          type="submit"
          disabled={!canSubmit || loading}
          fullWidth
          sx={{ mb: 0.5 }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </PrimaryButton>
        <PrimaryButton
          variant="text"
          onClick={onCancel}
          fullWidth
          sx={{ mt: 0.5 }}
        >
          Volver
        </PrimaryButton>
      </form>
      {/* Modal de Términos y Condiciones */}
      <TermsAndConditionsModal
        open={isTermsModalOpen}
        onClose={closeTermsModal}
      />
      {/* Modal de Política de Privacidad */}
      <PrivacyPolicyModal
        open={isPrivacyModalOpen}
        onClose={closePrivacyModal}
      />
    </Box>
  );
};

export default Step1Account;
