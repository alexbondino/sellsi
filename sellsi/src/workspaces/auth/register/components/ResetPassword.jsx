// src/domains/auth/pages/ResetPassword.jsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { supabase } from '../../../../services/supabase';
import { PasswordRequirements } from '../../../../shared/components';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ mismos requisitos que en el registro
  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Números (0-9)', valid: /\d/.test(password) },
  ];
  const cumpleMinimos = requisitos.every(r => r.valid);
  const contrasenasCoinciden = confirm.length > 0 && password === confirm;
  const canSubmit = cumpleMinimos && contrasenasCoinciden && !loading;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!cumpleMinimos) {
      return setError(
        'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.'
      );
    }
    if (!contrasenasCoinciden) {
      return setError('Las contraseñas no coinciden.');
    }

    try {
      setLoading(true);

      // 🔐 Actualizar contraseña
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) throw upErr;

      setOk(true);

      // 👋 Cerrar sesión local
      await supabase.auth.signOut();

      // 🌍 Redirigir al mismo host (staging o producción)
      const base = window.location.origin;
      const url = new URL(base);
      url.searchParams.set('banner', 'reset_success');
      window.location.replace(url.toString());
    } catch (err) {
      setError(err?.message ?? 'Ocurrió un error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center', p: 2 }}
    >
      <Paper sx={{ p: 3, width: '100%', maxWidth: 420 }}>
        <Typography variant="h6" gutterBottom>
          Restablecer contraseña
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Ingresa tu nueva contraseña para continuar.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Primer campo */}
          <TextField
            type={showPwd ? 'text' : 'password'}
            label="Nueva contraseña"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPwd(v => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showPwd ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Segundo campo */}
          <TextField
            type={showConfirm ? 'text' : 'password'}
            label="Confirmar contraseña"
            fullWidth
            margin="normal"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            error={confirm.length > 0 && !contrasenasCoinciden}
            helperText={
              confirm.length > 0 && !contrasenasCoinciden
                ? 'Las contraseñas no coinciden'
                : ''
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm(v => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showConfirm ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* 📋 Checklist ahora debajo del segundo campo */}
          <PasswordRequirements password={password} size="normal" />

          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          {ok && (
            <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
              ¡Contraseña actualizada! Redirigiendo…
            </Typography>
          )}

          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading}
            disabled={!canSubmit}
            sx={{ mt: 2, width: '100%' }}
          >
            Guardar contraseña
          </LoadingButton>
        </Box>
      </Paper>
    </Box>
  );
}
