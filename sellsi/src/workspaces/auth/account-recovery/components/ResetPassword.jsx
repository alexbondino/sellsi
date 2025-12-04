import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/services/supabase';
import { PasswordRequirements } from '@/shared/components';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const requisitos = [
    { label: 'Al menos 8 caracteres', valid: password.length >= 8 },
    { label: 'Letras minúsculas (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Letras mayúsculas (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Números (0-9)', valid: /\d/.test(password) },
  ];
  const cumpleMinimos = requisitos.every(r => r.valid);
  const contrasenasCoinciden = confirm.length > 0 && password === confirm;
  const canSubmit = cumpleMinimos && contrasenasCoinciden && !loading;

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 ResetPassword - Iniciando verificación...');
        console.log('🔍 URL completa:', window.location.href);

        // Marcar modo recovery INMEDIATAMENTE al montar este componente
        // Esto previene que UnifiedAuthProvider redirija
        localStorage.setItem('recovery_mode', 'true');
        console.log('🔐 Modo recovery activado');

        // Verificar si venimos directamente desde el email (tokens en hash/query)
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, '')
        );
        const searchParams = new URLSearchParams(window.location.search);

        const type = hashParams.get('type') || searchParams.get('type');
        const access_token =
          hashParams.get('access_token') || searchParams.get('access_token');
        const refresh_token =
          hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const token_hash =
          searchParams.get('token_hash') || hashParams.get('token_hash');

        console.log('  URL type:', type);
        console.log('  Has access_token in URL:', !!access_token);
        console.log('  Has refresh_token in URL:', !!refresh_token);
        console.log('  Has token_hash in URL:', !!token_hash);

        // Verificar sesión (Supabase ya la estableció desde el hash)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log('  session exists:', !!session);
        console.log('  session error:', sessionError?.message);

        if (!session || sessionError) {
          throw new Error(
            'Token de recuperación inválido o expirado. Por favor, solicita un nuevo enlace.'
          );
        }

        // Guardar user_id para validación
        localStorage.setItem('recovery_user_id', session.user.id);
        console.log('✅ Sesión de recovery verificada - mostrando formulario');
        setIsVerifying(false);
      } catch (err) {
        console.error('❌ Error de verificación:', err.message);
        setIsVerifying(false);
        setError(err.message || 'Enlace de recuperación inválido o expirado.');

        // Limpiar recovery mode si falla
        localStorage.removeItem('recovery_mode');
        localStorage.removeItem('recovery_user_id');

        // Redirigir después de 3 segundos
        setTimeout(() => {
          window.location.replace(
            `${window.location.origin}/?error=invalid_recovery_link`
          );
        }, 3000);
      }
    };

    init();
  }, []);

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

      // Actualizar contraseña usando la sesión creada por el enlace de recovery
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) throw upErr;

      setOk(true);

      // Limpiar banderas de recovery
      localStorage.removeItem('recovery_mode');
      localStorage.removeItem('recovery_user_id');

      // Cerrar sesión local
      await supabase.auth.signOut();

      // Redirigir al mismo host con banner
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

  if (isVerifying) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
        <Typography>Verificando enlace...</Typography>
      </Box>
    );
  }

  // Si hay error de verificación, mostrar mensaje
  if (error && !password) {
    return (
      <Box
        sx={{ minHeight: '80vh', display: 'grid', placeItems: 'center', p: 2 }}
      >
        <Paper sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Enlace inválido o expirado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Redirigiendo...
          </Typography>
        </Paper>
      </Box>
    );
  }

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
