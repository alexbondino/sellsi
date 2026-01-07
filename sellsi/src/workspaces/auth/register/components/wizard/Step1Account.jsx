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
import { useTermsModal } from '../../hooks/useTermsModal';

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
      // 🔧 FIX CRÍTICO Bug #3: Verificación COMPLETA de email duplicado
      // Paso 1: Verificar si el email ya existe en nuestra tabla users
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email, user_id')
        .eq('email', correo)
        .limit(1);

      if (checkError) {
        console.error('❌ Error al verificar email en DB:', checkError.message);
        showBanner({
          message: 'Error al verificar el correo. Por favor, inténtalo de nuevo.',
          severity: 'error',
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      // Si ya existe en la tabla users, rechazar inmediatamente
      if (existingUsers && existingUsers.length > 0) {
        console.log('❌ Email ya existe en tabla users:', correo);
        setEmailEnUso(true);
        showBanner({
          message: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.',
          severity: 'error',
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      // Paso 2: Intentar crear la cuenta en Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: correo,
          password: contrasena,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

      if (signUpError) {
        console.error('❌ Error al crear cuenta Auth:', signUpError.message);
        
        // Manejar errores explícitos de Supabase
        if (
          signUpError.message.includes('User already registered') ||
          signUpError.message.includes('already been registered') ||
          signUpError.message.includes('duplicate')
        ) {
          setEmailEnUso(true);
          showBanner({
            message: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.',
            severity: 'error',
            duration: 6000,
          });
        } else {
          showBanner({
            message: `Error de registro: ${signUpError.message}`,
            severity: 'error',
            duration: 6000,
          });
        }
        setLoading(false);
        return;
      }

      // 🔧 PASO 3 CRÍTICO: Verificar la respuesta de signUp
      // Supabase NO retorna error para emails duplicados cuando email confirmation está habilitado
      // En su lugar, retorna el usuario existente con identities vacío
      if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
        console.log('❌ Usuario ya existe (detectado por identities vacío):', correo);
        setEmailEnUso(true);
        showBanner({
          message: 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.',
          severity: 'error',
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      // Si llegamos aquí, el registro fue exitoso
      console.log('✅ Registro exitoso - nuevo usuario creado:', correo);
      
      showBanner({
        message: `¡Gracias por registrarte! Hemos enviado un correo de verificación a ${correo}. Por favor, revisa tu bandeja de entrada (y spam).`,
        severity: 'success',
        duration: 8000,
      });
      
      setLoading(false);
      onNext(); // Mover al siguiente paso (Step4Verification)
      
    } catch (error) {
      console.error('❌ Error inesperado durante el registro:', error);
      showBanner({
        message:
          'Ocurrió un error inesperado durante el registro. Inténtalo de nuevo.',
        severity: 'error',
        duration: 6000,
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
        src="/Logos/sellsi_logo_transparent.webp"
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
          color: theme.palette.mode === 'dark' ? '#fff' : '#2E52B2', //Azul Logo Sellsi
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
              ? 'Este correo ya está registrado. Por favor, inicia sesión o usa otro correo.'
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
                  color: '#2E52B2',
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
                  color: '#2E52B2',
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
