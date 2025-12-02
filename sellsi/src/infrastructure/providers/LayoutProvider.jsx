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

  const SideBarWidth = '210px';
  const [currentSideBarWidth, setCurrentSideBarWidth] = useState(SideBarWidth);
  const [sideBarCollapsed, setSideBarCollapsed] = useState(false);

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

  // Handler para cuando cambia el ancho de la sidebar
  const handleSideBarWidthChange = (newWidth, isCollapsed) => {
    setCurrentSideBarWidth(newWidth);
    setSideBarCollapsed(isCollapsed);
  };

  // Determinar qué barras mostrar
  const isAdminRoute = location.pathname.startsWith('/admin-login') || 
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
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
