// shared/components/display/banners/BannerContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const BannerContext = createContext();

export const useBanner = () => {
  const context = useContext(BannerContext);
  if (!context)
    throw new Error('useBanner debe usarse dentro de BannerProvider');
  return context;
};

export const BannerProvider = ({ children }) => {
  const [bannerState, setBannerState] = useState({
    show: false,
    message: '',
    severity: 'success',
    duration: 6000,
  });

  /**
   * Muestra un banner.
   * Firmas soportadas (para retro-compatibilidad):
   *  - showBanner({ message, severity?, duration? })
   *  - showBanner(messageString, severity?, duration?)  (LEGACY)
   */
  const showBanner = (cfg, legacySeverity, legacyDuration) => {
    if (typeof cfg === 'string') {
      // Firma legacy: (message, severity?, duration?)
      const message = cfg;
      const severity = legacySeverity || 'success';
      const duration = typeof legacyDuration === 'number' ? legacyDuration : 6000;
      setBannerState({ show: true, message, severity, duration });
      return;
    }
    if (cfg && typeof cfg === 'object') {
      const { message = '', severity = 'success', duration = 6000 } = cfg;
      setBannerState({ show: true, message, severity, duration });
      return;
    }
    // Entrada inválida: no cambia estado, opcionalmente podríamos loggear
  };

  const hideBanner = () => {
    setBannerState(prev => ({ ...prev, show: false }));
  };

  // 🧭 Detectar ?banner=... en el arranque y limpiar la URL
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const flag = url.searchParams.get('banner');
      if (flag) {
        const map = {
          reset_success: {
            message: '¡Tu contraseña fue actualizada con éxito!',
            severity: 'success',
          },
          verify_success: {
            message: '¡Tu correo fue verificado!',
            severity: 'success',
          },
          login_error: {
            message: 'No pudimos iniciar tu sesión. Intenta nuevamente.',
            severity: 'error',
          },
        };
        const cfg = map[flag] ?? {
          message: 'Operación realizada correctamente',
          severity: 'success',
        };
        showBanner(cfg);

        url.searchParams.delete('banner');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignorar si URL no es válida en algún entorno raro
    }
    // solo una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ bannerState, showBanner, hideBanner }),
    [bannerState]
  );

  return (
    <BannerContext.Provider value={value}>{children}</BannerContext.Provider>
  );
};
