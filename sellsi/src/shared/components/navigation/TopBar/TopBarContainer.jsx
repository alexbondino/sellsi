// Fase 3: Container que orquesta hooks y pasa datos a TopBarView
import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Badge,
  Divider,
  MenuItem,
  Menu,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { supabase } from '../../../services/supabase';
import useCartStore from '../../../stores/cart/cartStore';
import { useRole } from '../../../../infrastructure/providers';
import { setSkipScrollToTopOnce } from '../ScrollToTop/ScrollToTop';
import { useNotificationsContext } from '../../../../domains/notifications/components/NotificationProvider';
import { ProfileAvatarButton } from './components/ProfileAvatarButton';
import { NotificationsMenu } from './components/NotificationsMenu';
import { RoleSwitchControl } from './components/RoleSwitchControl';
import FeedbackModal from './components/FeedbackModal';
import { navButtonBase, iconButtonBase } from './topBar.styles';
import { useRoleFromRoute } from './hooks/useRoleFromRoute';
import { useAuthModalBus } from './hooks/useAuthModalBus';
import { useMarketplaceSearch } from './hooks/useMarketplaceSearch';
import { useMarketplaceSearchBus } from '../../../contexts/MarketplaceSearchContext';
import { TopBarView } from './TopBarView';

export default function TopBarContainer({
  session,
  isBuyer,
  logoUrl,
  onNavigate,
  onRoleChange,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const itemsInCart = useCartStore(state => state.items).length;
  const { isRoleLoading } = useRole();

  // ====== TODOS LOS HOOKS DEBEN IR AQUÍ ARRIBA ======
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifModalOpen, setNotifModalOpen] = useState(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);

  const {
    loginOpen: openLoginModal,
    registerOpen: openRegisterModal,
    openLogin: openLoginModalOpen,
    openRegister: openRegisterModalOpen,
    closeLogin: closeLoginModal,
    closeRegister: closeRegisterModal,
    transitionLoginToRegister: handleLoginToRegisterTransition,
  } = useAuthModalBus({ enableLegacyEventListeners: true });

  const { currentRole } = useRoleFromRoute({
    pathname: location.pathname,
    isBuyerProp: isBuyer,
    isRoleLoading,
  });

  const notifCtx = useNotificationsContext?.() || null;
  const marketplaceSearchBus = useMarketplaceSearchBus();

  const isBuyerRole = currentRole === 'buyer';
  const {
    term: mobileSearch,
    inputProps: mobileSearchInputProps,
    submit: submitMobileSearch,
  } = useMarketplaceSearch({
    enabled: !!session,
    pathname: location.pathname,
    isBuyerRole,
    onReactive: t => {
      marketplaceSearchBus?.updateExternalSearchTerm?.(t);
    },
    onNavigateOutside: t =>
      navigate('/buyer/marketplace', {
        state: { initialSearch: t, fromTopBar: true },
      }),
  });

  // ====== FIN DE HOOKS ======

  // Detectar si estamos en onboarding para mostrar TopBar simplificado
  const isOnboarding = location.pathname.startsWith('/onboarding');
  const isLoggedIn = !!session;

  // Handler de logout (usado tanto en onboarding como en TopBar normal)
  const handleLogout = async () => {
    setProfileAnchor(null);
    setMobileMenuAnchor(null);
    try {
      await supabase.auth.signOut();
    } catch (_) {}
    navigate('/');
  };

  // ====== TopBar simplificado para Onboarding ======
  if (isOnboarding) {
    return (
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
            px: { xs: 2, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              height: { xs: 38, sm: 38, md: 50 },
              width: { xs: 90, sm: 90, md: 140 },
              display: 'flex',
              alignItems: 'center',
              p: 0,
              m: 0,
              lineHeight: 0,
              overflow: 'hidden',
            }}
          >
            <Box
              component="img"
              src="/Logos/sellsiwhite_logo_transparent.webp"
              alt="Sellsi Logo"
              sx={{
                height: { xs: 25, sm: 25, md: 38 },
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          {/* Perfil con opción de cerrar sesión */}
          <Box>
            <ProfileAvatarButton
              logoUrl={logoUrl}
              onClick={e => setProfileAnchor(e.currentTarget)}
              expanded={Boolean(profileAnchor)}
            />
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={() => setProfileAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
    );
  }

  // ====== TopBar normal (no onboarding) ======
  const handleOpenMobileMenu = e => setMobileMenuAnchor(e.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenProfileMenu = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchor(null);

  const handleNavigate = ref => {
    handleCloseMobileMenu();
    setTimeout(() => {
      if (ref === 'contactModal') {
        setSkipScrollToTopOnce();
        const search = `?scrollTo=${encodeURIComponent(
          'contactModal'
        )}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      if (
        ['quienesSomosRef', 'serviciosRef', 'trabajaConNosotrosRef'].includes(
          ref
        )
      ) {
        setSkipScrollToTopOnce();
        const search = `?scrollTo=${encodeURIComponent(ref)}&t=${Date.now()}`;
        navigate(`/${search}`);
        return;
      }
      onNavigate?.(ref);
    }, 0);
  };

  const handleRoleToggleChange = (event, newRole) => {
    if (newRole && onRoleChange)
      onRoleChange(newRole, { skipNavigation: false });
  };

  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon
      {...props}
      sx={{ fontSize: '1.5rem', color: '#fff !important', ...sx }}
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
  };

  const getProfileRoute = flag =>
    flag ? '/buyer/profile' : '/supplier/profile';
  const goToProfile = () => navigate(getProfileRoute(isBuyer));

  // Handler logo (home / marketplace according a role / or landing)
  const handleLogoClick = () => {
    // Siempre hacer scroll to top al hacer clic en el logo
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (isLoggedIn) {
      if (currentRole === 'supplier') navigate('/supplier/home');
      else if (currentRole === 'buyer') navigate('/buyer/marketplace');
      else navigate('/?scrollTo=top');
    } else navigate('/?scrollTo=top');
  };

  const profileMenuButton = (
    <ProfileAvatarButton
      id="topbar-profile-button"
      logoUrl={logoUrl}
      onClick={handleOpenProfileMenu}
      expanded={Boolean(profileAnchor)}
    />
  );
  const handleOpenNotif = e => setNotifAnchor(e.currentTarget);
  const handleCloseNotif = () => setNotifAnchor(null);
  const handleViewAllNotif = () => {
    setNotifModalOpen(true);
    handleCloseNotif();
  };
  const handleCloseNotifModal = () => setNotifModalOpen(false);
  const handleNotifItemClick = n => {
    if (n.context_section === 'supplier_orders')
      navigate('/supplier/my-orders');
    else if (n.context_section === 'buyer_orders') navigate('/buyer/orders');
    else if (n.context_section === 'supplier_offers')
      navigate('/supplier/offers');
    else if (n.context_section === 'buyer_offers') navigate('/buyer/offers');
    else if (n.order_status && currentRole === 'buyer')
      navigate('/buyer/orders');
    else if (n.order_status && currentRole === 'supplier')
      navigate('/supplier/my-orders');
    try {
      notifCtx?.markAsRead?.([n.id]);
    } catch (_) {}
    handleCloseNotif();
  };

  if (!isLoggedIn) {
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
          sx={{ ...navButtonBase, mr: 1 }}
        >
          Iniciar sesión
        </Button>
        <Button
          onClick={openRegisterModalOpen}
          variant="outlined"
          sx={{ color: 'white', border: 'none', ...navButtonBase }}
        >
          Registrarse
        </Button>
      </>
    );
    mobileMenuItems = [
      ...publicNavButtons.map(({ label, ref }) => (
        <MenuItem
          key={label}
          onClick={() => {
            handleNavigate(ref);
            handleCloseMobileMenu();
          }}
        >
          {label}
        </MenuItem>
      )),
      <Divider key="d1" />,
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
    paddingX = { xs: 2, md: 4, mac: 4, lg: 4 };
    desktopRightContent = (
      <>
        <RoleSwitchControl
          role={currentRole}
          disabled={isRoleLoading}
          onChange={handleRoleToggleChange}
          sx={{ mr: 2, opacity: isRoleLoading ? 0.6 : 1 }}
        />
        <Tooltip title="Ayúdanos a mejorar" arrow>
          <IconButton
            onClick={() => setFeedbackModalOpen(true)}
            sx={{ ...iconButtonBase, color: 'white', mr: 1 }}
            disableRipple
            disableFocusRipple
          >
            <FeedbackIcon sx={{ fontSize: '1.3rem' }} />
          </IconButton>
        </Tooltip>
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
          <IconButton
            onClick={() => navigate('/buyer/cart')}
            sx={{ ...iconButtonBase, color: 'white', mr: 3 }}
            disableRipple
            disableFocusRipple
          >
            <Badge badgeContent={itemsInCart} color="error">
              <ShoppingCartIcon sx={{ lineHeight: 1 }} />
            </Badge>
          </IconButton>
        </Tooltip>
        {profileMenuButton}
        <FeedbackModal
          open={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          userEmail={session?.user?.email}
          companyName={session?.user?.user_metadata?.company_name}
          userName={session?.user?.user_metadata?.full_name}
        />
      </>
    );
    mobileMenuItems = [
      <MenuItem
        key="roleToggleMobile"
        sx={{ display: 'flex', justifyContent: 'center', py: 1 }}
      >
        <RoleSwitchControl
          role={currentRole}
          disabled={isRoleLoading}
          onChange={handleRoleToggleChange}
          sx={{ width: '100%', mr: 0, opacity: isRoleLoading ? 0.6 : 1 }}
        />
      </MenuItem>,
      <Divider key="dividerMobileRole" />,
      <MenuItem
        key="feedback"
        onClick={() => {
          setFeedbackModalOpen(true);
          handleCloseMobileMenu();
        }}
      >
        <FeedbackIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
        Ayúdanos a mejorar
      </MenuItem>,
      <MenuItem
        key="profile"
        onClick={() => {
          goToProfile();
          handleCloseMobileMenu();
        }}
      >
        Mi Perfil
      </MenuItem>,
      <MenuItem key="logout" onClick={handleLogout}>
        Cerrar sesión
      </MenuItem>,
    ];
  }

  const handleMobileSearchButton = () => submitMobileSearch();

  return (
    <TopBarView
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
    />
  );
}
