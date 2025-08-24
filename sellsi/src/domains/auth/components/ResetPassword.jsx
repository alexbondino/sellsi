// 📁 domains/auth/pages/ResetPassword.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Alert,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { supabase } from '../../../services/supabase';

export default function ResetPassword() {
  // Estado de arranque: procesando enlace
  const [bootLoading, setBootLoading] = useState(true);

  // Control explícito del error de enlace
  const [showLinkError, setShowLinkError] = useState(false);

  // Usuario (si hay sesión válida después de consumir el enlace)
  const [user, setUser] = useState(null);

  // Form / guardado
  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Utilidad: quitar ?code=... de la URL sin recargar
  const removeCodeParam = url => {
    const u = new URL(url.href);
    if (u.searchParams.has('code')) {
      u.searchParams.delete('code');
      const qs = u.search.toString();
      const clean = u.pathname + (qs ? `?${qs}` : '');
      window.history.replaceState({}, '', clean);
    }
  };

  // Utilidad: quitar hash (#...) de la URL sin recargar
  const removeHash = url => {
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  // Paso 1: consumir tokens del mail y crear sesión
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const url = new URL(window.location.href);

        // v2 (actual): ?code=...
        const code = url.searchParams.get('code');

        // v1 (legacy hash): #access_token=...&refresh_token=...&type=recovery
        const hash = url.hash?.startsWith('#') ? url.hash.slice(1) : '';
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        // Importante: NO activamos showLinkError por defecto.
        // Solo lo haremos si el backend devuelve un error explícito.

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          removeCodeParam(url);
        } else if (access_token && refresh_token && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          removeHash(url);
        }

        // Verificar sesión actual (si no hubo token también puede existir sesión ya activa)
        const { data, error: getUserError } = await supabase.auth.getUser();
        if (getUserError) throw getUserError;

        if (mounted) {
          setUser(data?.user ?? null);
          // Si llegamos aquí sin excepciones, NO mostramos error de enlace
          setShowLinkError(false);
        }
      } catch (e) {
        // Solo mostramos el banner si el error es realmente de enlace inválido / expirado
        const msg = String(e?.message || '');
        const code = e?.code || e?.name || '';

        const looksExpired =
          /expired|invalid|invalid_grant|expired_action_token/i.test(msg) ||
          /expired|invalid/i.test(code);

        setShowLinkError(Boolean(looksExpired));
      } finally {
        if (mounted) setBootLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Paso 2: guardar nueva contraseña (requiere sesión activa)
  const onSave = useCallback(async () => {
    if (pwd1.length < 8) return;
    if (pwd1 !== pwd2) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd1 });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      // Si aquí falla, probablemente la sesión no está válida (enlace usado/expirado)
      setShowLinkError(true);
    } finally {
      setSaving(false);
    }
  }, [pwd1, pwd2]);

  // ---------------- UI ----------------
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, mb: 6 }}>
      <Paper sx={{ p: 3, width: 440, maxWidth: '90vw' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Restablecer contraseña
        </Typography>

        {/* Mensajería:
            - Durante bootLoading: nunca mostrar error.
            - Si hubo error explícito Y no hay sesión, mostrar banner.
            - De lo contrario, no mostrarlo. */}
        {!bootLoading && showLinkError && !user && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Enlace inválido o expirado. Solicita un nuevo correo de
            recuperación.
          </Alert>
        )}

        {bootLoading ? (
          <Alert severity="info">Validando enlace…</Alert>
        ) : done ? (
          <Alert severity="success">
            ¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva
            contraseña.
          </Alert>
        ) : user ? (
          <>
            <TextField
              label="Nueva contraseña"
              type="password"
              fullWidth
              sx={{ mb: 2 }}
              value={pwd1}
              onChange={e => setPwd1(e.target.value)}
              helperText="Mínimo 8 caracteres"
            />
            <TextField
              label="Repetir contraseña"
              type="password"
              fullWidth
              sx={{ mb: 2 }}
              value={pwd2}
              onChange={e => setPwd2(e.target.value)}
              error={pwd2.length > 0 && pwd1 !== pwd2}
              helperText={
                pwd2.length > 0 && pwd1 !== pwd2
                  ? 'Las contraseñas no coinciden'
                  : ' '
              }
            />
            <Button
              variant="contained"
              fullWidth
              onClick={onSave}
              disabled={saving || pwd1.length < 8 || pwd1 !== pwd2}
            >
              {saving ? 'Guardando…' : 'Guardar nueva contraseña'}
            </Button>
          </>
        ) : (
          // No hay sesión y no hubo error “explícito” => no renderizamos el form,
          // pero tampoco mostramos el banner si no hubo error real.
          <Alert severity="warning">
            No se pudo validar tu sesión para restablecer la contraseña. Abre
            este formulario desde el correo de recuperación más reciente.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
