// 📁 shared/components/navigation/TopBar/TopBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, IconButton, MenuItem, useTheme, Tooltip, Badge, Divider, TextField, InputAdornment, Menu } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
// import PersonIcon from '@mui/icons-material/Person'; // Ya no se usa directamente en TopBar
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// Removed unused NotificationsIcon import
import { supabase } from '../../../services/supabase';
import useCartStore from '../../../stores/cart/cartStore';
// Removed unused Modal (Coming Soon) after refactor phase
import { useRole } from '../../../../infrastructure/providers/RoleProvider';
// Auth modals ahora encapsulados en componente AuthModals (lazy dentro)
import { setSkipScrollToTopOnce } from '../ScrollToTop/ScrollToTop';

// Importa el nuevo componente reutilizable y ahora verdaderamente controlado
import { useNotificationsContext } from '../../../../domains/notifications/components/NotificationProvider';
import { NotificationBell } from '../../../../domains/notifications';
// Consolidated MUI imports
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ProfileAvatarButton } from './components/ProfileAvatarButton';
import { AuthModals } from './components/AuthModals';
import { NotificationsMenu } from './components/NotificationsMenu';
// import { PublicNavLinks } from './components/PublicNavLinks'; // Reemplazado por mapeo directo usando navButtonBase
import { MobileMenu } from './components/MobileMenu';
import { RoleSwitchControl } from './components/RoleSwitchControl';
import { navButtonBase, iconButtonBase } from './topBar.styles';
// Hooks Fase 2
import { useRoleFromRoute } from './hooks/useRoleFromRoute';
import { useAuthModalBus } from './hooks/useAuthModalBus';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';

export default function TopBar({
  session,
  isBuyer, // Esta prop viene de App.jsx y refleja el rol del perfil
  logoUrl,
  onNavigate,
  onRoleChange, // Esta función actualiza el rol en App.jsx
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const itemsInCart = useCartStore(state => state.items).length;
  const { isRoleLoading } = useRole(); // ✅ Acceder al estado de loading del rol

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  // Auth modal bus (reemplaza listeners window y timeout transición)
  const {
    loginOpen: openLoginModal,
    registerOpen: openRegisterModal,
    openLogin: openLoginModalOpen,
    openRegister: openRegisterModalOpen,
    closeLogin: closeLoginModal,
    closeRegister: closeRegisterModal,
    transitionLoginToRegister: handleLoginToRegisterTransition,
  } = useAuthModalBus({ enableLegacyEventListeners: true });

  // Rol derivado vía hook
  const { currentRole } = useRoleFromRoute({ pathname: location.pathname, isBuyerProp: isBuyer, isRoleLoading });

  const isLoggedIn = !!session;

  const handleOpenMobileMenu = e => setMobileMenuAnchor(e.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenProfileMenu = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    // Verificar si el usuario está realmente logueado desde el prop session
    if (!session) {
      handleCloseProfileMenu();
      handleCloseMobileMenu();
      navigate('/');
      return;
    }

    // Verificar también desde Supabase directamente
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        handleCloseProfileMenu();
        handleCloseMobileMenu();
        navigate('/');
        return;
      }
    } catch (sessionError) {
      handleCloseProfileMenu();
      handleCloseMobileMenu();
      navigate('/');
      return;
    }

    // Solo intentar logout si hay sesión válida
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Silenciar error
    }
    handleCloseProfileMenu();
    handleCloseMobileMenu();
    navigate('/');
  };

  const handleNavigate = ref => {
    handleCloseMobileMenu();
    setTimeout(() => {
      if (ref === 'contactModal') {
        // Navigate to landing and trigger scroll to contact section
        setSkipScrollToTopOnce();
        const search = `?scrollTo=${encodeURIComponent('contactModal')}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      if (
        ref === 'quienesSomosRef' ||
        ref === 'serviciosRef' ||
        ref === 'trabajaConNosotrosRef'
      ) {
        setSkipScrollToTopOnce();
        // Forzar cambio de URL incluso si ya estás en / añadiendo un timestamp
        const search = `?scrollTo=${encodeURIComponent(ref)}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      if (onNavigate) {
        onNavigate(ref);
      }
    }, 0);
  };

  // ✅ CAMBIO: Handler que usa RoleProvider para cambio completo de rol
  const handleRoleToggleChange = (event, newRole) => {
    if (newRole !== null && onRoleChange) {
      // Usar la función del RoleProvider que SÍ navega cuando es cambio manual
      onRoleChange(newRole, { skipNavigation: false });
    }
  };

  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon
      {...props}
      sx={{
        fontSize: '1.5rem',
        color: '#fff !important',
        ...sx,
      }}
    />
  );

  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];
  let paddingX = {
    xs: 'max(25px, env(safe-area-inset-left))',
    sm: 'max(30px, env(safe-area-inset-left))',
    md: '250px',
    mac: '180px',
    lg: '250px',
  }; // Default padding for logged out
  // Helpers centralizados
  const getProfileRoute = (flag) => (flag ? '/buyer/profile' : '/supplier/profile');
  const goToProfile = () => navigate(getProfileRoute(isBuyer));

  // Avatar state handled inside ProfileAvatarButton now; removed local avatarLoaded.
  const profileMenuButton = <ProfileAvatarButton logoUrl={logoUrl} onClick={handleOpenProfileMenu} />;
  // Notifications
  const notifCtx = useNotificationsContext?.() || null;
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const handleOpenNotif = e => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleViewAllNotif = () => {
    setNotifModalOpen(true);
    handleCloseNotif();
  };
  const handleCloseNotifModal = () => setNotifModalOpen(false);
  const handleNotifItemClick = n => {
    // Navigate based on context_section
    if (n.context_section === 'supplier_orders')
      navigate('/supplier/my-orders');
    else if (n.context_section === 'buyer_orders') navigate('/buyer/orders');
    else if (n.order_status && currentRole === 'buyer')
      navigate('/buyer/orders');
    else if (n.order_status && currentRole === 'supplier')
      navigate('/supplier/my-orders');
    // Mark read locally
    try {
      notifCtx?.markAsRead?.([n.id]);
    } catch (_) {}
    handleCloseNotif();
  };

  if (!isLoggedIn) {
    // Botones públicos, pero el de "Trabaja con Nosotros" ahora abre modal
    // Ocultar totalmente el botón "Trabaja con Nosotros" según requerimiento
    const publicNavButtons = [
      { label: 'Servicios', ref: 'serviciosRef' },
      { label: 'Quiénes Somos', ref: 'quienesSomosRef' },
      { label: 'Contáctanos', ref: 'contactModal' },
    ];

    desktopNavLinks = publicNavButtons.map(({ label, ref }) => (
      <Button
        key={label}
        onClick={() => handleNavigate(ref)}
        sx={navButtonBase}
        disableRipple
        disableFocusRipple
      >
        {label}
      </Button>
    ));

    desktopRightContent = (
      <>
        <Button
          onClick={openLoginModalOpen}
          variant="contained"
          color="primary"
          sx={{
            outline: 'none',
            boxShadow: 'none',
            border: 'none',
            mr: 1,
            '&:focus': { outline: 'none', boxShadow: 'none', border: 'none' },
            '&:active': { outline: 'none', boxShadow: 'none', border: 'none' },
            '&:hover': { outline: 'none', boxShadow: 'none', border: 'none' },
          }}
          disableFocusRipple
          disableRipple
        >
          Iniciar sesión
        </Button>
        <Button
          onClick={openRegisterModalOpen}
          variant="outlined"
          sx={{
            color: 'white',
            border: 'none', // quitar borde blanco
            outline: 'none',
            boxShadow: 'none',
            '&:focus': { outline: 'none', boxShadow: 'none' },
            '&:active': { outline: 'none', boxShadow: 'none' },
            '&:hover': {
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)', // opcional
            },
          }}
          disableFocusRipple
          disableRipple
        >
          Registrarse
        </Button>
      </>
    );

    mobileMenuItems = [
      ...publicNavButtons.map(({ label, ref }) => (
        <MenuItem key={label} onClick={() => { handleNavigate(ref); handleCloseMobileMenu(); }} sx={{ fontSize: 16 }}>
          {label}
        </MenuItem>
      )),
      <Divider key="divider1" />,
      <MenuItem
        key="login"
        onClick={() => {
          openLoginModalOpen();
          handleCloseMobileMenu();
        }}
      >
        Iniciar sesión
      </MenuItem>,
      <MenuItem
        key="register"
        onClick={() => {
          openRegisterModalOpen();
          handleCloseMobileMenu();
        }}
      >
        Registrarse
      </MenuItem>,
    ];
  } else {
    // Si el usuario está logueado
    paddingX = { xs: 2, md: 4, mac: 4, lg: 4 }; // Updated padding for logged in
    desktopRightContent = (
      <>
        {/* Usamos el componente Switch - Solo mostrar cuando el rol esté determinado */}
        <RoleSwitchControl
          role={currentRole}
          disabled={isRoleLoading}
          onChange={handleRoleToggleChange}
          sx={{ mr: 2, opacity: isRoleLoading ? 0.6 : 1 }}
        />

        <NotificationsMenu
          showBell
          unreadCount={notifCtx?.unreadCount || 0}
          notifications={notifCtx?.notifications || []}
          activeTab={notifCtx?.activeTab || 'all'}
          onTabChange={t => notifCtx?.setActiveTab?.(t)}
          onItemClick={handleNotifItemClick}
          onViewAll={handleViewAllNotif}
          onCloseDialog={handleCloseNotifModal}
          anchorEl={notifAnchor}
          onOpen={handleOpenNotif}
          onClose={handleCloseNotif}
          dialogOpen={notifModalOpen}
        />

        <Tooltip title="Carrito" arrow>
          <IconButton onClick={() => navigate('/buyer/cart')} sx={{ ...iconButtonBase, color: 'white', mr: 3 }} disableFocusRipple disableRipple>
            <Badge badgeContent={itemsInCart} color="error">
              <CustomShoppingCartIcon sx={{ lineHeight: 1 }} />
            </Badge>
          </IconButton>
        </Tooltip>
        {profileMenuButton}
      </>
    );

    mobileMenuItems = [
      <MenuItem
        key="roleToggleMobile"
        sx={{ display: 'flex', justifyContent: 'center', py: 1 }}
      >
        {/* Usamos el componente Switch en el menú móvil - Solo mostrar cuando el rol esté determinado */}
        <RoleSwitchControl
          role={currentRole}
          disabled={isRoleLoading}
          onChange={handleRoleToggleChange}
          sx={{ width: '100%', mr: 0, opacity: isRoleLoading ? 0.6 : 1 }}
        />
      </MenuItem>,
      <Divider key="dividerMobileRole" />,
      // Eliminado el botón de carrito en mobileMenuItems
      <MenuItem
        key="profile"
        onClick={() => { goToProfile(); handleCloseMobileMenu(); }}
      >
        Mi Perfil
      </MenuItem>,
      <MenuItem key="logout" onClick={handleLogout}>
        Cerrar sesión
      </MenuItem>,
    ];
  }

  // ================== 🔍 MOBILE MARKETPLACE SEARCH (Buyer only) ==================
  const isBuyerRole = currentRole === 'buyer';
  const { term: mobileSearch, setTerm: setMobileSearch, isOnBuyerMarketplace, inputProps: mobileSearchInputProps, submit: submitMobileSearch } = useMarketplaceSearch({
    enabled: !!session,
    pathname: location.pathname,
    isBuyerRole,
    onReactive: (t) => {
      // Reemplaza evento global: en lugar de dispatch se podría usar contexto; mantenemos evento por compat temporal
      const evt = new CustomEvent('marketplaceSearch', { detail: { term: t } });
      window.dispatchEvent(evt);
    },
    onNavigateOutside: (t) => {
      navigate('/buyer/marketplace', { state: { initialSearch: t, fromTopBar: true } });
    },
  });
  const mobileSearchInputRef = useRef(null);
  const handleMobileSearchButton = () => submitMobileSearch();

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#000000',
          width: '100%',
          left: 0,
          right: 0,
          px: 0,
          py: { xs: 0, sm: 0, md: 1 }, // Sin padding vertical en mobile
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          zIndex: 1100,
          height: { xs: 45, md: '64px' }, // Altura reducida en mobile
          borderBottom: '1px solid white',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '100%',
            px: paddingX, // Use the dynamically set paddingX
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                height: { xs: 38, sm: 38, md: 50 },
                width: { xs: 90, sm: 90, md: 140 }, // Mobile: fill width
                maxWidth: { xs: 90, sm: 90, md: 140 },
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                p: 0,
                m: 0,
                lineHeight: 0,
                overflow: 'hidden',
              }}
              onClick={() => {
                if (isLoggedIn) {
                  if (currentRole === 'supplier') {
                    navigate('/supplier/home');
                  } else if (currentRole === 'buyer') {
                    navigate('/buyer/marketplace');
                  } else {
                    navigate('/?scrollTo=top');
                  }
                } else {
                  navigate('/?scrollTo=top');
                }
              }}
            >
              <Box
                component="img"
                src="/logodark.svg"
                alt="Sellsi Logo"
                sx={{
                  height: { xs: 110, sm: 110, md: 110 },
                  width: { xs: 116, sm: 116, md: 140 }, // Mobile: fill width
                  maxWidth: { xs: 90, sm: 90, md: 140 },
                  display: 'block',
                  objectFit: { xs: 'contain', sm: 'contain', md: 'contain' },
                  p: 0,
                  m: 0,
                  lineHeight: 0,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
                draggable={false}
              />
            </Box>
            {/* Mobile search: placed right of logo for buyer role */}
            {isLoggedIn && isBuyerRole && (
              <Box data-component="TopBar.mobileSearch" sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', ml: { xs: 0.5, sm: 1 } }}>
                <TextField
                  size="small"
                  value={mobileSearchInputProps.value}
                  onChange={mobileSearchInputProps.onChange}
                  onKeyDown={mobileSearchInputProps.onKeyDown}
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
                        <IconButton size="small" onClick={handleMobileSearchButton}>
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            )}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {desktopNavLinks}
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {desktopRightContent}
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0, ml: { xs: 0.5, sm: 2 } }}>
            {/* Campana de notificaciones - móvil */}
            {isLoggedIn && (
              <Tooltip title="Notificaciones" arrow>
                <span>
                  <NotificationBell
                    count={notifCtx?.unreadCount || 0}
                    onClick={handleOpenNotif}
                  />
                </span>
              </Tooltip>
            )}
            {isLoggedIn && profileMenuButton}
            <IconButton onClick={handleOpenMobileMenu}>
              <MenuIcon sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <MobileMenu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleCloseMobileMenu}
        items={mobileMenuItems}
      />
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleCloseProfileMenu}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            backgroundColor: '#2C2C2C',
            color: '#FFFFFF',
            '& .MuiMenuItem-root': {
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
            '& .MuiSvgIcon-root': {
              color: '#FFFFFF',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => { goToProfile(); handleCloseProfileMenu(); }}
        >
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
      </Menu>

  {/* Legacy inline auth modals removed; using AuthModals wrapper */}
      <AuthModals
        openLogin={openLoginModal}
        openRegister={openRegisterModal}
        onCloseLogin={() => setOpenLoginModal(false)}
        onCloseRegister={() => setOpenRegisterModal(false)}
        onLoginToRegister={handleLoginToRegisterTransition}
      />
    </>
  );
}
