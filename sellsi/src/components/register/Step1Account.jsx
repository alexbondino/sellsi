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
import { PasswordRequirements, CustomButton } from '../../hooks/shared';
import { supabase } from '../../services/supabase';

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
  const {
    correo,
    contrasena,
    confirmarContrasena,
    aceptaTerminos,
    aceptaComunicaciones,
  } = formData;

  const [emailEnUso, setEmailEnUso] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

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
    if (!canSubmit || checkingEmail) return;

    setCheckingEmail(true);

    // Verificar si el correo ya existe en la tabla 'users'
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', correo);

    if (error) {
      console.error('Error al verificar el correo:', error);
      setCheckingEmail(false);
      return;
    }

    if (data.length > 0) {
      setEmailEnUso(true);
      setCheckingEmail(false);
      return;
    }

    setEmailEnUso(false);
    setCheckingEmail(false);
    onNext();
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
    >      <img
        src="/logo.svg"
        alt="SELLSI Logo"
        style={{ 
          width: window.innerWidth < 600 ? 140 : window.innerWidth < 900 ? 110 : 160, 
          marginBottom: window.innerWidth < 600 ? 4 : 8 
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

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>        <TextField
          label="Correo electrónico"
          variant="outlined"
          fullWidth
          value={correo}
          onChange={e => {
            onFieldChange('correo', e.target.value);
            setEmailEnUso(false);
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
        />        <TextField
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
        />        <TextField
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
              <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
                Términos y Condiciones
              </Link>{' '}
              y la{' '}
              <Link href="#" sx={{ color: '#1976d2', fontWeight: 700 }}>
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

        <CustomButton
          type="submit"
          disabled={!canSubmit || checkingEmail}
          fullWidth
          sx={{ mb: 0.5 }}
        >
          {checkingEmail ? 'Verificando...' : 'Crear cuenta'}
        </CustomButton>

        <CustomButton
          variant="text"
          onClick={onCancel}
          fullWidth
          sx={{ mt: 0.5 }}
        >
          Volver atrás
        </CustomButton>
      </form>
    </Box>
  );
};

export default Step1Account;
