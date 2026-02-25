// Fase 3: Presentational View de la TopBar (sin lógica de negocio)
import React, { memo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  TextField,
  InputAdornment,
  MenuItem,
  Menu,
  ListItemIcon,
  Avatar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { NotificationBell } from '../../../../domains/notifications';
import { MobileMenu } from './components/MobileMenu';
import { AuthModals } from './components/AuthModals';
import { ProfileAvatarButton } from './components/ProfileAvatarButton';

// Constantes de módulo: evitan nuevos objetos en cada render
const PROFILE_MENU_PAPER_PROPS = {
  elevation: 4,
  sx: {
    minWidth: 240,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.1)',
    '& .MuiMenuItem-root': {
      color: '#FFFFFF',
      px: 2,
      py: 1.25,
      gap: 1.5,
      '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
    },
    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' },
    '& .MuiListItemIcon-root': { minWidth: 'unset' },
  },
};

const PROFILE_MENU_LIST_PROPS = {
  'aria-label': 'Opciones de perfil',
  'aria-labelledby': 'topbar-profile-button',
  disablePadding: true,
};

const PROFILE_HEADER_SX = {
  px: 2,
  py: 1.75,
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(255,255,255,0.04)',
};

const PROFILE_AVATAR_SX = {
  width: 40,
  height: 40,
  bgcolor: '#2E52B2',
  fontSize: '1rem',
  fontWeight: 700,
  flexShrink: 0,
};

const PROFILE_NAME_SX = {
  color: '#FFFFFF',
  fontWeight: 600,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 170,
};

const PROFILE_EMAIL_SX = {
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.3,
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 170,
};

const PROFILE_OPTIONS_BOX_SX = { py: 0.5 };

const ProfileMenuPopover = memo(function ProfileMenuPopover({
  profileAnchor,
  onCloseProfileMenu,
  onGoToProfile,
  onLogout,
  userName,
  userEmail,
  userLogoUrl,
}) {
  return (
    <Menu
      anchorEl={profileAnchor}
      open={Boolean(profileAnchor)}
      onClose={onCloseProfileMenu}
      disableScrollLock
      aria-label="Menú de perfil"
      MenuListProps={PROFILE_MENU_LIST_PROPS}
      PaperProps={PROFILE_MENU_PAPER_PROPS}
    >
      <Box sx={PROFILE_HEADER_SX}>
        <Avatar src={userLogoUrl || undefined} sx={PROFILE_AVATAR_SX}>
          {userName?.charAt(0)?.toUpperCase() || '?'}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          {userName && (
            <Typography variant="body2" sx={PROFILE_NAME_SX}>
              {userName}
            </Typography>
          )}
          {userEmail && (
            <Typography variant="caption" sx={PROFILE_EMAIL_SX}>
              {userEmail}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={PROFILE_OPTIONS_BOX_SX}>
        <MenuItem
          onClick={() => {
            onGoToProfile();
            onCloseProfileMenu();
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={onLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar sesión
        </MenuItem>
      </Box>
    </Menu>
  );
});

export const TopBarView = memo(function TopBarView({
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
  isProfileMenuOpen,
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
  userName,
  userEmail,
  userLogoUrl,
  // Auth modals state/handlers
  openLoginModal,
  openRegisterModal,
  onCloseLoginModal,
  onCloseRegisterModal,
  onLoginToRegister,
  // Children nodes pre-built
  desktopNotifNode,
  cartButtonNode,
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
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLogoClick();
                }
              }}
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
              <Box
                data-component="TopBar.mobileSearch"
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  ml: { xs: 0.5, sm: 1 },
                }}
              >
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
                      fontSize: '0.75rem',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={onMobileSearchButton}
                          aria-label="Ejecutar búsqueda"
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ 'aria-label': 'Buscar productos' }}
                  {...mobileSearchInputProps}
                />
              </Box>
            )}
            <Box
              sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}
              role="navigation"
              aria-label="Navegación principal"
            >
              {desktopNavLinks}
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
            }}
            aria-label="Acciones de usuario"
            role="group"
          >
            {desktopRightContent}
            {isLoggedIn && desktopNotifNode}
            {isLoggedIn && cartButtonNode}
            {isLoggedIn && (
              <ProfileAvatarButton
                id="topbar-profile-button"
                logoUrl={userLogoUrl}
                onClick={onOpenProfileMenu}
                expanded={isProfileMenuOpen}
              />
            )}
          </Box>

          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 0,
              ml: { xs: 0.5, sm: 2 },
            }}
          >
            {isLoggedIn && (
              <Tooltip title="Notificaciones" arrow>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir notificaciones, ${
                    notifBellCount || 0
                  } sin leer`}
                  aria-haspopup="true"
                  aria-expanded={notifMenuOpen ? 'true' : 'false'}
                  aria-controls={
                    notifMenuOpen ? 'topbar-notifications-popover' : undefined
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenNotif?.(e);
                    }
                  }}
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
              aria-controls={
                Boolean(mobileMenuAnchor) ? 'topbar-mobile-menu' : undefined
              }
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

      <ProfileMenuPopover
        profileAnchor={profileAnchor}
        onCloseProfileMenu={onCloseProfileMenu}
        onGoToProfile={onGoToProfile}
        onLogout={onLogout}
        userName={userName}
        userEmail={userEmail}
        userLogoUrl={userLogoUrl}
      />

      <AuthModals
        openLogin={openLoginModal}
        openRegister={openRegisterModal}
        onCloseLogin={onCloseLoginModal}
        onCloseRegister={onCloseRegisterModal}
        onLoginToRegister={onLoginToRegister}
      />
    </>
  );
});
