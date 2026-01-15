import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './UnifiedAuthProvider';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  const { session, userProfile } = useAuth();
  const location = useLocation();

  // Default responsive sidebar widths (single source of truth)
  const defaultSideBarWidth = { md: '210px', lg: '210px', xl: '210px' };

  // Normalize any width (string or object) into a responsive object with md/lg/xl
  const normalizeWidth = w => {
    if (typeof w === 'string') return { md: w, lg: w, xl: w };
    if (!w || typeof w !== 'object') return { ...defaultSideBarWidth };
    return {
      md: w.md || w.lg || w.xl || defaultSideBarWidth.md,
      lg: w.lg || w.md || w.xl || defaultSideBarWidth.lg,
      xl: w.xl || w.lg || w.md || defaultSideBarWidth.xl,
    };
  };

  const SideBarWidth = defaultSideBarWidth; // kept for backward compatibility
  const [currentSideBarWidth, setCurrentSideBarWidth] = useState(
    () => normalizeWidth(SideBarWidth)
  );
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

  // Handler para cuando cambia el ancho de la sidebar
  const handleSideBarWidthChange = (newWidth, isCollapsed) => {
    const normalized = normalizeWidth(newWidth);
    // Compare semantic values (md/lg/xl) to avoid triggering updates when nothing changed
    const equal = (a, b) => {
      if (!a || !b) return false;
      return a.md === b.md && a.lg === b.lg && a.xl === b.xl;
    };

    if (!equal(normalized, currentSideBarWidth)) {
      setCurrentSideBarWidth(normalized);
    }
    // Only update collapsed state when it really changes
    setSideBarCollapsed(prev => {
      const next = Boolean(isCollapsed);
      return prev === next ? prev : next;
    });
  };

  // FIX: Usar useRef para evitar re-renders que causan doble petición HTTP
  // El cache buster debe cambiar cuando logoUrl REALMENTE cambia de valor
  const logoUrl = userProfile ? userProfile.logo_url : null;
  const prevLogoUrlRef = React.useRef(logoUrl);
  const [logoCacheBuster, setLogoCacheBuster] = useState(() => Date.now());

  useEffect(() => {
    // Actualizar cache buster cuando logoUrl cambia (incluyendo de null a valor o viceversa)
    if (prevLogoUrlRef.current !== logoUrl) {
      prevLogoUrlRef.current = logoUrl;
      // Siempre actualizar el cache buster cuando hay un cambio real
      setLogoCacheBuster(Date.now());
    }
  }, [logoUrl]);

  // Determinar qué barras mostrar
  const isAdminRoute =
    location.pathname.startsWith('/admin-login') ||
    location.pathname.startsWith('/admin-panel');

  const showBottomBar = !isAdminRoute && location.pathname !== '/onboarding';
  const showTopBar = !isAdminRoute;
  // ✅ CORREGIDO: topBarHeight debe coincidir con las alturas responsive del TopBar
  // TopBar usa: height: { xs: 45, md: 64 }
  const topBarHeight = { xs: '45px', md: '64px' };

  const value = {
    // SideBar state
    currentSideBarWidth,
    sideBarCollapsed,
    setSideBarCollapsed, // ✅ Exportar el setter para que SideBar pueda actualizar el estado
    handleSideBarWidthChange,
    SideBarWidth,

    // Logo state
    logoUrl: logoUrl ? `${logoUrl}?cb=${logoCacheBuster}` : null,
    logoCacheBuster,

    // Layout flags
    showBottomBar,
    showTopBar,
    topBarHeight,
    isAdminRoute,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
};
