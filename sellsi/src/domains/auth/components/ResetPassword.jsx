import React, { useEffect, useState } from 'react';
import { Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');

  // ✅ Maneja tanto hash tokens como query code
  useEffect(() => {
    (async () => {
      try {
        // --- HASH tokens ---
        const hash = window.location.hash || '';
        const hasHashTokens =
          hash.startsWith('#') &&
          (hash.includes('access_token') || hash.includes('refresh_token'));

        if (hasHashTokens) {
          const params = new URLSearchParams(hash.slice(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) throw error;
            setReady(true);
            return;
          }
        }

        // --- QUERY code (?code=...&type=recovery) ---
        const search = new URLSearchParams(location.search);
        const code = search.get('code');
        const type = search.get('type');
        if (code && type === 'recovery') {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setReady(true);
          return;
        }

        // Ningún token encontrado
        if (!hasHashTokens && !code) {
          setErrMsg(
            'Enlace inválido o expirado. Solicita un nuevo correo de recuperación.'
          );
        }
      } catch (e) {
        setErrMsg(e?.message || 'No pudimos validar tu enlace.');
      } finally {
        setReady(true);
      }
    })();
  }, [location.search]);

  const valid = pwd.length >= 8 && pwd === pwd2;

  const handleUpdate = async e => {
    e.preventDefault();
    if (!valid) return;

    setLoading(true);
    setErrMsg('');
    setOkMsg('');

    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;

      setOkMsg('¡Tu contraseña se actualizó correctamente!');
      // Opcional: redirigir al login después de un tiempo
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setErrMsg(e?.message || 'No pudimos actualizar tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 460, mx: 'auto', mt: 6 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Restablecer contraseña
      </Typography>

      {!ready && <Typography>Validando enlace…</Typography>}
      {ready && (
        <>
          {errMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errMsg}
            </Alert>
          )}
          {okMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {okMsg}
            </Alert>
          )}

          <form onSubmit={handleUpdate}>
            <TextField
              type="password"
              label="Nueva contraseña"
              fullWidth
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Mínimo 8 caracteres"
            />
            <TextField
              type="password"
              label="Repetir contraseña"
              fullWidth
              value={pwd2}
              onChange={e => setPwd2(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!valid || loading}
              fullWidth
            >
              {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        </>
      )}
    </Paper>
  );
}
