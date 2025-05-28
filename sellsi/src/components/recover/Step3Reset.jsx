import React from 'react';
import { Box, TextField, Typography, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { PasswordRequirements, CustomButton } from '../shared';

const Step3Reset = ({
  nuevaContrasena,
  setNuevaContrasena,
  repiteContrasena,
  setRepiteContrasena,
  showPassword,
  setShowPassword,
  showRepeatPassword,
  setShowRepeatPassword,
  onSubmit
}) => {
  // Validaciones de contraseña
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: nuevaContrasena.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(nuevaContrasena) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(nuevaContrasena) },
    { label: 'Números (0-9)', valid: /\d/.test(nuevaContrasena) },
  ];
  
  const cumpleMinimos = requisitos.filter((r) => r.valid).length >= 4;
  const contrasenasCoinciden = nuevaContrasena === repiteContrasena && repiteContrasena.length > 0;

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Restablecer contraseña
      </Typography>
      
      <Typography sx={{ mb: 2 }}>
        Ingrese su nueva contraseña y confírmela.
      </Typography>
      
      <TextField
        label="Ingrese su nueva contraseña"
        type={showPassword ? 'text' : 'password'}
        variant="outlined"
        fullWidth
        value={nuevaContrasena}
        onChange={(e) => setNuevaContrasena(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword((show) => !show)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <TextField
        label="Confirme su contraseña nueva"
        type={showRepeatPassword ? 'text' : 'password'}
        variant="outlined"
        fullWidth
        value={repiteContrasena}
        onChange={(e) => setRepiteContrasena(e.target.value)}
        sx={{ mb: 2 }}
        error={repiteContrasena.length > 0 && !contrasenasCoinciden}
        helperText={
          repiteContrasena.length > 0 && !contrasenasCoinciden
            ? 'Las contraseñas no coinciden'
            : ''
        }
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle repeat password visibility"
                onClick={() => setShowRepeatPassword((show) => !show)}
                edge="end"
              >
                {showRepeatPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      <PasswordRequirements password={nuevaContrasena} />
      
      <CustomButton
        fullWidth
        disabled={!cumpleMinimos || !contrasenasCoinciden}
        onClick={onSubmit}
        sx={{
          fontSize: 18,
          height: 48,
          mb: 2,
        }}
      >
        Cambiar contraseña
      </CustomButton>
    </Box>
  );
};

export default Step3Reset;