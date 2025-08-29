// Fase 3: Container que orquesta hooks y pasa datos a TopBarView
import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, IconButton, Tooltip, Badge, Divider, MenuItem } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { supabase } from '../../../services/supabase';
import useCartStore from '../../../stores/cart/cartStore';
import { useRole } from '../../../../infrastructure/providers/RoleProvider';
import { setSkipScrollToTopOnce } from '../ScrollToTop/ScrollToTop';
import { useNotificationsContext } from '../../../../domains/notifications/components/NotificationProvider';
import { ProfileAvatarButton } from './components/ProfileAvatarButton';
import { NotificationsMenu } from './components/NotificationsMenu';
import { RoleSwitchControl } from './components/RoleSwitchControl';
import { navButtonBase, iconButtonBase } from './topBar.styles';
import { useRoleFromRoute } from './hooks/useRoleFromRoute';
import { useAuthModalBus } from './hooks/useAuthModalBus';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';
import { useMarketplaceSearchBus } from '../../../contexts/MarketplaceSearchContext';
import { TopBarView } from './TopBarView';

export default function TopBarContainer({ session, isBuyer, logoUrl, onNavigate, onRoleChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const itemsInCart = useCartStore(state => state.items).length;
  const { isRoleLoading } = useRole();

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const {
    loginOpen: openLoginModal,
    registerOpen: openRegisterModal,
    openLogin: openLoginModalOpen,
    openRegister: openRegisterModalOpen,
    closeLogin: closeLoginModal,
    closeRegister: closeRegisterModal,
    transitionLoginToRegister: handleLoginToRegisterTransition,
  } = useAuthModalBus();

  const { currentRole } = useRoleFromRoute({ pathname: location.pathname, isBuyerProp: isBuyer, isRoleLoading });
  const isLoggedIn = !!session;

  const handleOpenMobileMenu = e => setMobileMenuAnchor(e.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenProfileMenu = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    if (!session) {
      handleCloseProfileMenu();
      handleCloseMobileMenu();
      navigate('/');
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        handleCloseProfileMenu();
        handleCloseMobileMenu();
        navigate('/');
        return;
      }
    } catch (_) {
      handleCloseProfileMenu();
      handleCloseMobileMenu();
      navigate('/');
      return;
    }
    try { await supabase.auth.signOut(); } catch (_) {}
    handleCloseProfileMenu();
    handleCloseMobileMenu();
    navigate('/');
  };

  const handleNavigate = ref => {
    handleCloseMobileMenu();
    setTimeout(() => {
      if (ref === 'contactModal') {
        setSkipScrollToTopOnce();
        const search = `?scrollTo=${encodeURIComponent('contactModal')}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      if (['quienesSomosRef','serviciosRef','trabajaConNosotrosRef'].includes(ref)) {
        setSkipScrollToTopOnce();
        const search = `?scrollTo=${encodeURIComponent(ref)}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      onNavigate?.(ref);
    }, 0);
  };

  const handleRoleToggleChange = (event, newRole) => {
    if (newRole && onRoleChange) onRoleChange(newRole, { skipNavigation: false });
  };

  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon {...props} sx={{ fontSize: '1.5rem', color: '#fff !important', ...sx }} />
  );

  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];
  let paddingX = { xs: 'max(25px, env(safe-area-inset-left))', sm: 'max(30px, env(safe-area-inset-left))', md: '250px', mac: '180px', lg: '250px' };

  const getProfileRoute = flag => (flag ? '/buyer/profile' : '/supplier/profile');
  const goToProfile = () => navigate(getProfileRoute(isBuyer));

  // Handler logo (home / marketplace according a role / or landing)
  const handleLogoClick = () => {
    if (isLoggedIn) {
      if (currentRole === 'supplier') navigate('/supplier/home');
      else if (currentRole === 'buyer') navigate('/buyer/marketplace');
      else navigate('/?scrollTo=top');
    } else navigate('/?scrollTo=top');
  };

  const profileMenuButton = <ProfileAvatarButton id="topbar-profile-button" logoUrl={logoUrl} onClick={handleOpenProfileMenu} expanded={Boolean(profileAnchor)} />;
  const notifCtx = useNotificationsContext?.() || null;
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const handleOpenNotif = e => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleViewAllNotif = () => { setNotifModalOpen(true); handleCloseNotif(); };
  const handleCloseNotifModal = () => setNotifModalOpen(false);
  const handleNotifItemClick = n => {
    if (n.context_section === 'supplier_orders') navigate('/supplier/my-orders');
    else if (n.context_section === 'buyer_orders') navigate('/buyer/orders');
    else if (n.order_status && currentRole === 'buyer') navigate('/buyer/orders');
    else if (n.order_status && currentRole === 'supplier') navigate('/supplier/my-orders');
    try { notifCtx?.markAsRead?.([n.id]); } catch(_){}
    handleCloseNotif();
  };

  if (!isLoggedIn) {
    const publicNavButtons = [
      { label: 'Servicios', ref: 'serviciosRef' },
      { label: 'Quiénes Somos', ref: 'quienesSomosRef' },
      { label: 'Contáctanos', ref: 'contactModal' },
    ];
    desktopNavLinks = publicNavButtons.map(({ label, ref }) => (
      <Button key={label} onClick={() => handleNavigate(ref)} sx={navButtonBase} disableRipple disableFocusRipple>{label}</Button>
    ));
    desktopRightContent = <>
      <Button onClick={openLoginModalOpen} variant="contained" color="primary" sx={{ ...navButtonBase, mr: 1 }}>Iniciar sesión</Button>
      <Button onClick={openRegisterModalOpen} variant="outlined" sx={{ color: 'white', border: 'none', ...navButtonBase }}>Registrarse</Button>
    </>;
    mobileMenuItems = [
      ...publicNavButtons.map(({ label, ref }) => <MenuItem key={label} onClick={() => { handleNavigate(ref); handleCloseMobileMenu(); }}>{label}</MenuItem>),
      <Divider key="d1" />,
      <MenuItem key="login" onClick={() => { openLoginModalOpen(); handleCloseMobileMenu(); }}>Iniciar sesión</MenuItem>,
      <MenuItem key="register" onClick={() => { openRegisterModalOpen(); handleCloseMobileMenu(); }}>Registrarse</MenuItem>,
    ];
  } else {
    paddingX = { xs: 2, md: 4, mac: 4, lg: 4 };
    desktopRightContent = <>
      <RoleSwitchControl role={currentRole} disabled={isRoleLoading} onChange={handleRoleToggleChange} sx={{ mr: 2, opacity: isRoleLoading ? 0.6 : 1 }} />
      <NotificationsMenu showBell unreadCount={notifCtx?.unreadCount || 0} notifications={notifCtx?.notifications || []} activeTab={notifCtx?.activeTab || 'all'} onTabChange={t => notifCtx?.setActiveTab?.(t)} onItemClick={handleNotifItemClick} onViewAll={handleViewAllNotif} onCloseDialog={handleCloseNotifModal} anchorEl={notifAnchor} onOpen={handleOpenNotif} onClose={handleCloseNotif} dialogOpen={notifModalOpen} />
      <Tooltip title="Carrito" arrow>
        <IconButton onClick={() => navigate('/buyer/cart')} sx={{ ...iconButtonBase, color: 'white', mr: 3 }} disableRipple disableFocusRipple>
          <Badge badgeContent={itemsInCart} color="error"><ShoppingCartIcon sx={{ lineHeight: 1 }} /></Badge>
        </IconButton>
      </Tooltip>
      {profileMenuButton}
    </>;
    mobileMenuItems = [
      <MenuItem key="roleToggleMobile" sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
        <RoleSwitchControl role={currentRole} disabled={isRoleLoading} onChange={handleRoleToggleChange} sx={{ width: '100%', mr: 0, opacity: isRoleLoading ? 0.6 : 1 }} />
      </MenuItem>,
      <Divider key="dividerMobileRole" />,
      <MenuItem key="profile" onClick={() => { goToProfile(); handleCloseMobileMenu(); }}>Mi Perfil</MenuItem>,
      <MenuItem key="logout" onClick={handleLogout}>Cerrar sesión</MenuItem>,
    ];
  }

  const isBuyerRole = currentRole === 'buyer';
  const marketplaceSearchBus = useMarketplaceSearchBus();
  const { term: mobileSearch, inputProps: mobileSearchInputProps, submit: submitMobileSearch } = useMarketplaceSearch({
    enabled: !!session,
    pathname: location.pathname,
    isBuyerRole,
    onReactive: (t) => {
      // Legacy fallback eliminado: se asume provider presente
      marketplaceSearchBus?.updateExternalSearchTerm?.(t);
    },
    onNavigateOutside: (t) => navigate('/buyer/marketplace', { state: { initialSearch: t, fromTopBar: true } }),
  });
  const mobileSearchInputRef = useRef(null);
  const handleMobileSearchButton = () => submitMobileSearch();

  return <TopBarView
    isLoggedIn={isLoggedIn}
    isBuyerRole={isBuyerRole}
    desktopNavLinks={desktopNavLinks}
    desktopRightContent={desktopRightContent}
    mobileMenuItems={mobileMenuItems}
    mobileMenuAnchor={mobileMenuAnchor}
    onOpenMobileMenu={handleOpenMobileMenu}
    onCloseMobileMenu={handleCloseMobileMenu}
    profileAnchor={profileAnchor}
    onOpenProfileMenu={handleOpenProfileMenu}
    onCloseProfileMenu={handleCloseProfileMenu}
    paddingX={paddingX}
    mobileSearchInputProps={mobileSearchInputProps}
    onMobileSearchButton={handleMobileSearchButton}
    mobileSearchInputRef={mobileSearchInputRef}
    notifBellCount={notifCtx?.unreadCount || 0}
    onOpenNotif={handleOpenNotif}
    notifMenuOpen={Boolean(notifAnchor)}
  onLogoClick={handleLogoClick}
  onGoToProfile={goToProfile}
    onLogout={handleLogout}
    openLoginModal={openLoginModal}
    openRegisterModal={openRegisterModal}
    onCloseLoginModal={closeLoginModal}
    onCloseRegisterModal={closeRegisterModal}
    onLoginToRegister={handleLoginToRegisterTransition}
    profileMenuButton={profileMenuButton}
  />;
}
