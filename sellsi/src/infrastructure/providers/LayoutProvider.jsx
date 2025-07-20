import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

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

  // Solo actualiza el cache buster cuando cambia el logoUrl
  const logoUrl = userProfile ? userProfile.logo_url : null;
  const [logoCacheBuster, setLogoCacheBuster] = useState(Date.now());

  useEffect(() => {
    setLogoCacheBuster(Date.now());
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
  const topBarHeight = '64px';

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
