// ============================================================================
// KHIPU EMBEDDED MODAL - Checkout embebido (no redirección)
// Docs: https://docs.khipu.com/payment-solutions/khipu-client-web
// ============================================================================

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Box, CircularProgress, Typography, Backdrop, Button, Stack, Paper } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useBodyScrollLock } from '../../../shared/hooks/useBodyScrollLock';

const KHIPU_SCRIPT_SRC = 'https://js.khipu.com/v1/kws.js';
const KHIPU_MOUNT_ID = 'khipu-web-root';
const KHIPU_BRIDGE_FLAG = '__sellsiKhipuCtor';

const isGenericKhipuOperationFailure = (result) => {
  const exitTitle = String(result?.exitTitle || '').toLowerCase();
  const exitMessage = String(result?.exitMessage || '').toLowerCase();

  return (
    exitTitle.includes('operationfailedtitle') ||
    exitMessage.includes('operationfailedbody')
  );
};

// ============================================================================
// Carga dinámica del SDK de Khipu (una sola vez por sesión)
// ============================================================================
let scriptPromise = null;

/**
 * Espera a que window.Khipu esté definido mediante polling.
 * El script dispara onload pero el constructor puede tardar unos ms en asignarse al global.
 */
const getKhipuFactory = () => {
  if (typeof window === 'undefined') return null;

  const candidates = [
    window.Khipu,
    window.khipu?.Khipu,
    window.KWS?.Khipu,
    window.kws?.Khipu,
    window.KhipuWeb,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'function') {
      return () => new candidate();
    }
  }

  const singletonCandidates = [window.khipu, window.KWS, window.kws, window.KhipuWeb];
  for (const singleton of singletonCandidates) {
    if (singleton && typeof singleton.startOperation === 'function') {
      return () => singleton;
    }
  }

  return null;
};

const promoteLexicalKhipuToWindow = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (typeof window.Khipu === 'function') return true;

  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = `
      (function () {
        try {
          window.${KHIPU_BRIDGE_FLAG} = (typeof Khipu !== 'undefined') ? Khipu : null;
          if (!window.Khipu && window.${KHIPU_BRIDGE_FLAG}) {
            window.Khipu = window.${KHIPU_BRIDGE_FLAG};
          }
        } catch (e) {
          window.${KHIPU_BRIDGE_FLAG} = null;
        }
      })();
    `;
    document.head.appendChild(script);
    document.head.removeChild(script);

    if (!window.Khipu && window[KHIPU_BRIDGE_FLAG]) {
      window.Khipu = window[KHIPU_BRIDGE_FLAG];
    }

    return typeof window.Khipu === 'function';
  } catch (_) {
    return false;
  }
};

const getPossibleKhipuGlobals = () => {
  if (typeof window === 'undefined') return [];
  try {
    return Object.keys(window)
      .filter((key) => /khipu|kws|khenshin/i.test(key))
      .slice(0, 20);
  } catch (_) {
    return [];
  }
};

const waitForKhipuGlobal = (timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    promoteLexicalKhipuToWindow();
    if (getKhipuFactory()) { resolve(); return; }
    const start = Date.now();
    const check = () => {
      promoteLexicalKhipuToWindow();
      if (getKhipuFactory()) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        const globals = getPossibleKhipuGlobals();
        reject(
          new Error(
            `SDK Khipu no disponible tras espera de ${timeoutMs}ms. Globals detectados: ${globals.join(', ') || 'ninguno'}`
          )
        );
      } else {
        setTimeout(check, 50);
      }
    };
    setTimeout(check, 50);
  });

const loadKhipuScript = () => {
  promoteLexicalKhipuToWindow();
  // Ya disponible → resolver inmediatamente
  if (typeof window !== 'undefined' && getKhipuFactory()) {
    return Promise.resolve();
  }

  // Reusar promise en curso (pero NO si terminó con error — scriptPromise se resetea a null en ese caso)
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const onScriptReady = () => {
      console.log('[KhipuEmbeddedModal] script onload → esperando SDK Khipu...');
      promoteLexicalKhipuToWindow();
      waitForKhipuGlobal()
        .then(() => { console.log('[KhipuEmbeddedModal] SDK Khipu disponible ✓'); resolve(); })
        .catch((err) => { scriptPromise = null; reject(err); });
    };

    const existing = document.querySelector(`script[src="${KHIPU_SCRIPT_SRC}"]`);
    if (existing) {
      onScriptReady();
      return;
    }

    const script = document.createElement('script');
    script.src = KHIPU_SCRIPT_SRC;
    script.async = true;
    script.onload = onScriptReady;
    script.onerror = () => { scriptPromise = null; reject(new Error('No se pudo cargar el script de Khipu')); };
    document.head.appendChild(script);
  });

  return scriptPromise;
};

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * KhipuEmbeddedModal
 *
 * Renderiza un div ancla (#khipu-web-root) siempre en el DOM.
 * Cuando open=true + paymentId están listos, carga el SDK y llama
 * a startOperation(). Khipu muestra su propio modal overlay.
 *
 * ⚠️  NO envolver en Dialog de MUI — Khipu modal:true crea su propio overlay.
 *
 * @param {boolean}  open        - Activa el pago embebido
 * @param {string}   paymentId   - payment_id devuelto por la API de Khipu
 * @param {string}   fallbackUrl - URL hosted checkout para fallback si SDK embebido falla
 * @param {Function} onSuccess   - Callback cuando result === 'OK'
 * @param {Function} onError     - Callback cuando result === 'ERROR'
 * @param {Function} onClose     - Callback cuando el usuario cancela (USER_CANCELED)
 */
const KhipuEmbeddedModal = ({ open, paymentId, fallbackUrl, onSuccess, onError, onClose }) => {
  const khipuInstanceRef = useRef(null);
  const startedRef = useRef(false);
  const callbackHandledRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryTick, setRetryTick] = useState(0);

  // Bloquear scroll del body mientras el modal de Khipu está activo
  useBodyScrollLock(open);

  // --------------------------------------------------------------------------
  // Callback que Khipu invoca al terminar el flujo
  // --------------------------------------------------------------------------
  const handleKhipuCallback = useCallback(
    (result) => {
      console.log('[KhipuEmbeddedModal] callback:', result);

      if (callbackHandledRef.current) {
        console.log('[KhipuEmbeddedModal] callback ignorado (ya procesado):', result?.result);
        return;
      }
      callbackHandledRef.current = true;

      startedRef.current = false;

      const failureReason = String(result?.failureReason || '').toUpperCase();
      const exitMessage = String(result?.exitMessage || '').toLowerCase();
      const isUserCanceled =
        failureReason === 'USER_CANCELED' ||
        exitMessage.includes('abandon') ||
        exitMessage.includes('cancel');

      switch (result?.result) {
        case 'OK':
          onSuccess?.(result);
          break;

        case 'WARNING':
          // WARNING no se considera éxito definitivo para evitar falsos "pagos en proceso"
          // cuando el usuario abandonó el flujo de Khipu.
          if (isUserCanceled) {
            onClose?.();
          } else if (result?.continueUrl) {
            window.location.href = result.continueUrl;
          } else {
            onClose?.();
          }
          break;

        case 'ERROR':
          // USER_CANCELED → tratar como "cerrar" en lugar de error duro
          if (isUserCanceled) {
            onClose?.();
          } else if (isGenericKhipuOperationFailure(result) && fallbackUrl) {
            console.warn('[KhipuEmbeddedModal] Error genérico de operación en SDK, usando fallback hosted checkout');
            window.location.href = fallbackUrl;
          } else {
            onError?.(result);
          }
          break;

        case 'CONTINUE':
          if (result.continueUrl) {
            window.location.href = result.continueUrl;
          }
          break;

        default:
          console.warn('[KhipuEmbeddedModal] resultado desconocido:', result?.result);
          onError?.(result);
      }
    },
    [onSuccess, onError, onClose, fallbackUrl]
  );

  // --------------------------------------------------------------------------
  // Arrancar Khipu cuando open + paymentId estén disponibles
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!open || !paymentId) return;
    if (startedRef.current) return;
    callbackHandledRef.current = false;

    let cancelled = false;

    const start = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        await loadKhipuScript();

        if (cancelled) return;

        // El div ancla debe existir en el DOM (se renderiza siempre abajo)
        const mountEl = document.getElementById(KHIPU_MOUNT_ID);
        if (!mountEl) {
          throw new Error(`Elemento #${KHIPU_MOUNT_ID} no encontrado en el DOM`);
        }

        startedRef.current = true;
        setLoading(false);

        const createKhipuClient = getKhipuFactory();
        if (!createKhipuClient) {
          const globals = getPossibleKhipuGlobals();
          throw new Error(
            `Constructor/cliente Khipu no encontrado en window. Globals detectados: ${globals.join(', ') || 'ninguno'}`
          );
        }

        const khipu = createKhipuClient();
        if (!khipu || typeof khipu.startOperation !== 'function') {
          throw new Error('Cliente Khipu inválido: startOperation no disponible');
        }
        khipuInstanceRef.current = khipu;

        console.log('[KhipuEmbeddedModal] startOperation → paymentId:', paymentId);

        khipu.startOperation(paymentId, handleKhipuCallback, {
          mountElement: mountEl,
          modal: true,
          modalOptions: {
            maxWidth: 450,
            maxHeight: 860,
          },
          options: {
            style: {
              primaryColor: '#2E52B2',
              fontFamily: 'Roboto',
            },
            skipExitPage: false,
          },
        });
      } catch (err) {
        if (!cancelled) {
          console.error('[KhipuEmbeddedModal] Error iniciando Khipu:', err);
          setLoadError(err.message);
          setLoading(false);
          startedRef.current = false;

          // No redirigir automáticamente: priorizamos embedded y dejamos fallback manual.
          // Notificamos error al parent solo si no hay URL de fallback.
          if (!fallbackUrl) {
            onError?.({ result: 'ERROR', exitMessage: err.message });
          }
        }
      }
    };

    start();

    return () => {
      cancelled = true;
    };
  }, [open, paymentId, fallbackUrl, handleKhipuCallback, onError, retryTick]);

  // --------------------------------------------------------------------------
  // Limpiar instancia cuando open → false
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!open) {
      try {
        khipuInstanceRef.current?.close?.();
      } catch (_) {}
      khipuInstanceRef.current = null;
      startedRef.current = false;
      callbackHandledRef.current = false;
      setLoading(false);
      setLoadError(null);
      setRetryTick(0);
    }
  }, [open]);

  const handleRetry = useCallback(() => {
    setLoadError(null);
    startedRef.current = false;
    callbackHandledRef.current = false;
    scriptPromise = null;
    setRetryTick((v) => v + 1);
  }, []);

  const handleOpenHosted = useCallback(() => {
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
      return;
    }
    onError?.({ result: 'ERROR', exitMessage: 'No hay URL de fallback para Hosted Checkout' });
  }, [fallbackUrl, onError]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      try {
        khipuInstanceRef.current?.close?.();
      } catch (_) {}
    };
  }, []);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <>
      {/* Spinner mientras el SDK carga (antes de que Khipu muestre su propio overlay) */}
      <Backdrop
        open={loading}
        sx={{ zIndex: 1600, flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress sx={{ color: 'white' }} />
        <Typography variant="body2" sx={{ color: 'white' }}>
          Cargando Khipu...
        </Typography>
      </Backdrop>

      {/* Error al cargar el SDK — diálogo centrado amigable */}
      {loadError && (
        <Backdrop open sx={{ zIndex: 1600, alignItems: 'center', justifyContent: 'center', px: 2 }}>
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              p: 4,
              maxWidth: 380,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <WarningAmberRoundedIcon sx={{ fontSize: 52, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              No pudimos cargar el pago
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hubo un problema al iniciar el formulario de Khipu.
              Puedes intentarlo de nuevo o pagar directamente en el sitio de Khipu.
            </Typography>
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleRetry}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, py: 1.2 }}
              >
                Intentar de nuevo
              </Button>
              {fallbackUrl && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleOpenHosted}
                  sx={{ borderRadius: 2, textTransform: 'none', py: 1.2 }}
                >
                  Pagar en Khipu.com
                </Button>
              )}
              <Button
                variant="text"
                fullWidth
                onClick={onClose}
                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
              >
                Cancelar
              </Button>
            </Stack>
          </Paper>
        </Backdrop>
      )}

      {/*
        Div ancla requerido por Khipu. Debe estar SIEMPRE en el DOM.
        Khipu lo usa para adjuntar su propio modal overlay.
        No necesita ser visible ni tener dimensiones.
      */}
      <div id={KHIPU_MOUNT_ID} style={{ position: 'fixed', bottom: 0, right: 0, width: 0, height: 0 }} />
    </>
  );
};

export default KhipuEmbeddedModal;
