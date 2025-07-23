import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';

import { TopBar } from '../navigation/TopBar';
import { BottomBar } from './BottomBar';
import { MobileBar } from '../navigation/MobileBar';
import { SideBar } from '../navigation/SideBar';
import Banner from '../display/banners/Banner';
import WhatsAppWidget from '../../../components/WhatsAppWidget';
import { useBanner } from '../display/banners/BannerContext';

import { useAuth } from '../../../infrastructure/providers/AuthProvider';
import { useRole } from '../../../infrastructure/providers/RoleProvider';
import { useLayout } from '../../../infrastructure/providers/LayoutProvider';

export const AppShell = ({ children }) => {
  const location = useLocation();
  const { bannerState, hideBanner } = useBanner();
  const { session, userProfile } = useAuth();
  const { 
    currentAppRole, 
    isDashboardRoute, 
    isBuyer, 
    handleRoleChange 
  } = useRole();
  const { 
    currentSideBarWidth,
    sideBarCollapsed,
    handleSideBarWidthChange,
    logoUrl,
    showBottomBar,
    showTopBar,
    topBarHeight,
  } = useLayout();

  const handleScrollTo = (refName, scrollTargets) => {
    const element = scrollTargets.current[refName]?.current;
    if (element) {
      const topBarHeight = 64; // Altura de tu TopBar
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - topBarHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* TopBar - Solo se muestra si no es una ruta admin */}
      {showTopBar && (
        <TopBar
          key={`${session?.user?.id || 'no-session'}-${logoUrl || 'default-topbar'}`}
          session={session}
          isBuyer={isBuyer}
          logoUrl={logoUrl}
          onNavigate={handleScrollTo}
          onRoleChange={handleRoleChange}
        />
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {/* Banner */}
        <Banner
          message={bannerState.message}
          severity={bannerState.severity}
          duration={bannerState.duration}
          show={bannerState.show}
          onClose={hideBanner}
        />

        {/* Contenedor principal para SideBar y Contenido (Main) */}
        <Box
          sx={{
            display: 'flex',
            flex: '1 0 auto', // Toma el espacio disponible
            mt: showTopBar ? topBarHeight : 0, // Solo aplicar margen si TopBar está visible
          }}
        >
          {isDashboardRoute && (
            // Pasamos el currentAppRole a la SideBar para que sepa qué menú mostrar
            <SideBar 
              role={currentAppRole} 
              width="210px"
              onWidthChange={handleSideBarWidthChange}
            />
          )}

          <Box
            component="main"
            sx={theme => ({
              flexGrow: 1,
              pl: isDashboardRoute ? 3 : 0,
              pr: isDashboardRoute ? 3 : 0,
              pt: isDashboardRoute ? 3 : 0,
              pb: isDashboardRoute ? { xs: session ? 10 : 3, md: 3 } : { xs: session ? 10 : 0, md: 0 },
              width: isDashboardRoute
                ? { xs: '100%', md: `calc(100% - ${currentSideBarWidth})` }
                : '100%',
              overflowX: 'hidden',
              ml: isDashboardRoute ? { md: 14, lg: 14, xl: 0 } : 0,
              // Animación robusta: solo en md y lg, nunca en xl
              transition: [
                theme.breakpoints.up('md') && theme.breakpoints.down('lg')
                  ? 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  : 'margin-left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
              ].join(','),
              // Solo aplicar el shift animado en md y lg, nunca en xl
              transform: {
                xs: 'none',
                sm: 'none',
                md: isDashboardRoute && sideBarCollapsed ? 'translateX(-80px)' : 'none',
                lg: isDashboardRoute && sideBarCollapsed ? 'translateX(-80px)' : 'none',
                xl: 'none',
              },
            })}
          >
            {children}
          </Box>
        </Box>
        
        {/* BottomBar - Flex shrink: 0 para que mantenga su tamaño */}
        {showBottomBar && (
          <Box sx={{ flexShrink: 0 }}>
            <BottomBar />
          </Box>
        )}

        {/* MobileBar - Solo se muestra en móviles cuando hay sesión */}
        <MobileBar 
          role={currentAppRole} 
          session={session}
          isBuyer={isBuyer}
          logoUrl={logoUrl}
        />

        {/* WhatsApp Widget - Con acceso al contexto del Router */}
        <WhatsAppWidget 
          isLoggedIn={!!session} 
          userProfile={userProfile}
          currentPath={location.pathname}
        />
      </Box>
    </>
  );
};
