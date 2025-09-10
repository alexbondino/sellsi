import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useBanStatus } from '../hooks/useBanStatus';
import { CircularProgress } from '@mui/material';

// Lazy import para evitar conflicto con App.jsx
const BanPageView = React.lazy(() => import('../domains/ban/pages/BanPageView'));

/**
 * BanGuard (versión no bloqueante)
 *
 * Objetivo: No frenar el primer render para el 99.999% de usuarios no baneados.
 * Estrategia:
 *  - No ejecuta el chequeo automáticamente (enabled = false en hook)
 *  - Programa el chequeo tras el primer paint (requestIdleCallback o timeout)
 *  - Aplica TTL local (localStorage) para evitar llamadas redundantes en navegaciones frecuentes
 *  - Fail-open: si falla o expira timeout, deja la app visible
 *  - Si detecta ban, reemplaza el contenido por la BanPage
 */
const BanGuard = ({ children, userId = null, cacheTTLms = 5 * 60 * 1000, checkDelayMs = 300, networkTimeoutMs = 1800 }) => {
  const { banStatus, isLoading, error, reloadBanStatus } = useBanStatus(userId, false); // disabled auto-run
  const [showBan, setShowBan] = useState(false);
  const [checking, setChecking] = useState(false); // indicador liviano (opcional)
  const startedRef = useRef(false);
  const timeoutRef = useRef(null);
  const idleIdRef = useRef(null);

  // Observa cambios de banStatus para activar la pantalla de ban
  useEffect(() => {
    if (!isLoading && banStatus?.isBanned) {
      setShowBan(true);
      // Cachear resultado para futuros montajes inmediatos
      try {
        localStorage.setItem('BAN_CHECK_CACHE', JSON.stringify({ isBanned: true, ts: Date.now(), reason: banStatus.reason, bannedAt: banStatus.bannedAt }));
      } catch(_) {}
    } else if (!isLoading && !banStatus?.isBanned) {
      try {
        localStorage.setItem('BAN_CHECK_CACHE', JSON.stringify({ isBanned: false, ts: Date.now() }));
      } catch(_) {}
    }
  }, [banStatus, isLoading]);

  // Programar chequeo diferido post-paint
  useEffect(() => {
    if (startedRef.current) return; // asegurar una sola ejecución
    startedRef.current = true;

    // 1. Revisar cache TTL
    try {
      const raw = localStorage.getItem('BAN_CHECK_CACHE');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.ts === 'number' && (Date.now() - parsed.ts) < cacheTTLms) {
          if (parsed.isBanned) {
            setShowBan(true);
          }
          // Cache válida => No lanzar chequeo inmediato (reduce llamadas)
          return () => {};
        }
      }
    } catch(_) {}

    const runCheck = () => {
      setChecking(true);
      let finished = false;
      const t = setTimeout(() => {
        if (!finished) {
          // Timeout: fail-open (no modificamos UI, sólo paramos indicador)
          setChecking(false);
        }
      }, networkTimeoutMs);
      timeoutRef.current = t;
      reloadBanStatus() // se apoyará en hook para actualizar estado
        .catch(() => {})
        .finally(() => {
          finished = true;
          clearTimeout(t);
          setChecking(false);
        });
    };

    const schedule = () => {
      // requestIdleCallback si está disponible (con timeout de respaldo)
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleIdRef.current = window.requestIdleCallback(runCheck, { timeout: 500 });
      } else {
        idleIdRef.current = setTimeout(runCheck, checkDelayMs);
      }
    };

    schedule();
    return () => {
      if (idleIdRef.current) {
        if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleIdRef.current === 'number') {
          try { window.cancelIdleCallback(idleIdRef.current); } catch(_) {}
        } else {
          clearTimeout(idleIdRef.current);
        }
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [userId, cacheTTLms, checkDelayMs, networkTimeoutMs, reloadBanStatus]);

  // Si se determinó ban => mostrar página de ban
  if (showBan) {
    return (
      <Suspense fallback={<CircularProgress />}>
        <BanPageView />
      </Suspense>
    );
  }

  // Ignorar errores (fail-open) — se podrían loguear externamente
  if (error) {
    try { console.error('[BanGuard] error check ban (fail-open):', error); } catch(_) {}
  }

  return (
    <>
      {children}
      {/* Indicador opcional muy liviano mientras corre el chequeo (no bloqueante) */}
      {checking && (
        <div style={{ position: 'fixed', bottom: 8, right: 8, fontSize: 11, opacity: 0.6, zIndex: 9999 }}>
          verificando acceso…
        </div>
      )}
    </>
  );
};

export default BanGuard;
