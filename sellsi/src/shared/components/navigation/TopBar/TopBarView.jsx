// Fase 3: Presentational View de la TopBar (sin lógica de negocio)
import React from 'react';
import { Box, Button, IconButton, Tooltip, Badge, Divider, TextField, InputAdornment, MenuItem, Menu } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { NotificationBell } from '../../../../domains/notifications';
import { MobileMenu } from './components/MobileMenu';
import { AuthModals } from './components/AuthModals';

export function TopBarView({
  isLoggedIn,
  isBuyerRole,
  desktopNavLinks,
  desktopRightContent,
  mobileMenuItems,
  mobileMenuAnchor,
  onOpenMobileMenu,
  onCloseMobileMenu,
  profileAnchor,
  onOpenProfileMenu,
  onCloseProfileMenu,
  paddingX,
  // Search
  mobileSearchInputProps,
  onMobileSearchButton,
  mobileSearchInputRef,
  // Notifications (mobile bell only)
  notifBellCount,
  onOpenNotif,
  notifMenuOpen = false,
  // Profile menu utilities
  onLogoClick,
  onGoToProfile,
  onLogout,
  // Auth modals state/handlers
  openLoginModal,
  openRegisterModal,
  onCloseLoginModal,
  onCloseRegisterModal,
  onLoginToRegister,
  // Children nodes pre-built
  profileMenuButton,
}) {
  return (
    <>
      <Box
        sx={{
          backgroundColor: '#000000',
          width: '100%',
          left: 0,
          right: 0,
          px: 0,
          py: { xs: 0, sm: 0, md: 1 },
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          zIndex: 1100,
          height: { xs: 45, md: '64px' },
          borderBottom: '1px solid white',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            px: paddingX,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                height: { xs: 38, sm: 38, md: 50 },
                width: { xs: 90, sm: 90, md: 140 },
                maxWidth: { xs: 90, sm: 90, md: 140 },
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                p: 0,
                m: 0,
                lineHeight: 0,
                overflow: 'hidden',
                outline: 'none',
                '&:focus-visible': {
                  boxShadow: '0 0 0 2px #2E52B2',
                  borderRadius: 4,
                },
              }}
              role="button"
              tabIndex={0}
              aria-label="Ir a inicio"
              onClick={onLogoClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLogoClick(); } }}
            >
              <Box
                component="img"
                src="/Logos/sellsiwhite_logo_transparent.webp"
                alt="Sellsi Logo"
                sx={{
                  height: { xs: 25, sm: 25, md: 38 },
                  width: { xs: 90, sm: 90, md: 137 },
                  display: 'block',
                  objectFit: 'contain',
                  p: 0,
                  m: 0,
                  lineHeight: 0,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            </Box>
            {isLoggedIn && isBuyerRole && (
              <Box data-component="TopBar.mobileSearch" sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', ml: { xs: 0.5, sm: 1 } }}>
        <TextField
                  size="small"
                  placeholder="Buscar productos..."
                  inputRef={mobileSearchInputRef}
                  sx={{
                    width: { xs: 160, sm: 180 },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      height: 34,
                      borderRadius: 1.5,
                      fontSize: '0.75rem'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
        <IconButton size="small" onClick={onMobileSearchButton} aria-label="Ejecutar búsqueda">
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
      inputProps={{ 'aria-label': 'Buscar productos' }}
                  {...mobileSearchInputProps}
                />
              </Box>
            )}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }} role="navigation" aria-label="Navegación principal">
              {desktopNavLinks}
            </Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }} aria-label="Acciones de usuario" role="group">
            {desktopRightContent}
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0, ml: { xs: 0.5, sm: 2 } }}>
            {isLoggedIn && (
              <Tooltip title="Notificaciones" arrow>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir notificaciones, ${notifBellCount||0} sin leer`}
                  aria-haspopup="true"
                  aria-expanded={notifMenuOpen ? 'true' : 'false'}
                  aria-controls={notifMenuOpen ? 'topbar-notifications-popover' : undefined}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenNotif?.(e); } }}
                  onClick={onOpenNotif}
                >
                  <NotificationBell count={notifBellCount} />
                </span>
              </Tooltip>
            )}
            {/* FIX: Eliminado profileMenuButton de mobile - nunca era visible (display:none)
                pero causaba una descarga innecesaria del logo (~177KB) */}
            <IconButton
              onClick={onOpenMobileMenu}
              id="topbar-mobile-menu-button"
              aria-label="Abrir menú móvil"
              aria-haspopup="true"
              aria-expanded={Boolean(mobileMenuAnchor) ? 'true' : 'false'}
              aria-controls={Boolean(mobileMenuAnchor) ? 'topbar-mobile-menu' : undefined}
            >
              <MenuIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <MobileMenu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={onCloseMobileMenu}
        items={mobileMenuItems}
        ariaLabel="Menú móvil"
        menuId="topbar-mobile-menu"
        labelledBy="topbar-mobile-menu-button"
      />

      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={onCloseProfileMenu}
        disableScrollLock
        aria-label="Menú de perfil"
        MenuListProps={{ 'aria-label': 'Opciones de perfil', 'aria-labelledby': 'topbar-profile-button' }}
        PaperProps={{
          sx: {
            backgroundColor: '#2C2C2C',
            color: '#FFFFFF',
            '& .MuiMenuItem-root': {
              color: '#FFFFFF',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            },
            '& .MuiSvgIcon-root': { color: '#FFFFFF' },
          },
        }}
      >
        <MenuItem onClick={() => { onGoToProfile(); onCloseProfileMenu(); }}>Mi Perfil</MenuItem>
        <MenuItem onClick={onLogout}>Cerrar sesión</MenuItem>
      </Menu>

      <AuthModals
        openLogin={openLoginModal}
        openRegister={openRegisterModal}
        onCloseLogin={onCloseLoginModal}
        onCloseRegister={onCloseRegisterModal}
        onLoginToRegister={onLoginToRegister}
      />
    </>
  );
}
