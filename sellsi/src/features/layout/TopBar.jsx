import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  Tooltip,
  Badge,
  Avatar,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { supabase } from '../../services/supabase'; // Still needed for logout
import useCartStore from '../buyer/hooks/cartStore';
import ContactModal from '../ui/ContactModal';
import Login from '../login/Login';
import Register from '../register/Register';

export default function TopBar({ session, isBuyer, logoUrl, onNavigate }) {
  // --- HOOKS Y ESTADO ---
  const theme = useTheme();
  const navigate = useNavigate();
  const itemsInCart = useCartStore(state => state.items).length;

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  // logoUrl now comes from props, no need for internal state or useEffect here
  // const [logoUrl, setLogoUrl] = useState(null); // REMOVED

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);

  const isLoggedIn = !!session;

  // --- EFECTO PARA BUSCAR EL LOGO DEL USUARIO ---
  // This useEffect is no longer needed here as logoUrl is passed as a prop
  // useEffect(() => { ... }, [session, isBuyer]); // REMOVED

  // --- MANEJADORES DE EVENTOS ---
  const handleOpenMobileMenu = e => setMobileMenuAnchor(e.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenProfileMenu = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleCloseProfileMenu();
    handleCloseMobileMenu();
    navigate('/');
  };

  const handleNavigate = ref => {
    handleCloseMobileMenu();
    if (ref === 'contactModal') {
      setOpenContactModal(true);
      return;
    }
    if (onNavigate) {
      onNavigate(ref);
    }
  };

  // Custom ShoppingCart component to force styles
  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon 
      {...props} 
      sx={{ 
        fontSize: '2.24rem', 
        color: 'white !important',
        ...sx 
      }} 
    />
  );

  // --- LÓGICA DINÁMICA PARA RENDERIZAR CONTENIDO ---
  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];

  const profileMenuButton = (
    <IconButton onClick={handleOpenProfileMenu} sx={{ color: 'white', p: 0 }}>
      <Avatar src={logoUrl}>
        {' '}
        {/* Uses logoUrl from props */}
        <PersonIcon />
      </Avatar>
    </IconButton>
  );

  if (!isLoggedIn) {
    const publicNavButtons = [
      { label: 'Quiénes somos', ref: 'quienesSomosRef' },
      { label: 'Servicios', ref: 'serviciosRef' },
      { label: 'Trabaja con Nosotros', ref: 'trabajaConNosotrosRef' },
      { label: 'Contáctanos', ref: 'contactanosRef' },
    ];

    desktopNavLinks = publicNavButtons.map(({ label, ref }) => (
      <Button
        key={label}
        onClick={() => handleNavigate(ref)}
        sx={{ color: 'white', textTransform: 'none', fontSize: 16 }}
      >
        {label}
      </Button>
    ));

    desktopRightContent = (
      <>
        <Button
          onClick={() => setOpenLoginModal(true)}
          variant="contained"
          color="primary"
        >
          Iniciar sesión
        </Button>
        <Button
          onClick={() => setOpenRegisterModal(true)}
          variant="outlined"
          sx={{ color: 'white', borderColor: 'white' }}
        >
          Registrarse
        </Button>
      </>
    );

    mobileMenuItems = [
      ...publicNavButtons.map(({ label, ref }) => (
        <MenuItem key={label} onClick={() => handleNavigate(ref)}>
          {label}
        </MenuItem>
      )),
      <Divider key="divider1" />,
      <MenuItem key="contact" onClick={() => handleNavigate('contactModal')}>
        Contáctanos
      </MenuItem>,
      <MenuItem
        key="login"
        onClick={() => {
          setOpenLoginModal(true);
          handleCloseMobileMenu();
        }}
      >
        Iniciar sesión
      </MenuItem>,
      <MenuItem
        key="register"
        onClick={() => {
          setOpenRegisterModal(true);
          handleCloseMobileMenu();
        }}
      >
        Registrarse
      </MenuItem>,
    ];  } else if (isBuyer) {
    desktopRightContent = (
      <>
        <Tooltip title="Carrito" arrow>
          <IconButton 
            onClick={() => navigate('/buyer/cart')} 
            sx={{
              color: 'white',
              mr: 2.5,
              boxShadow: 'none',
              outline: 'none',
              border: 'none',
              transition: 'background 0.2s',
              '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
              '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
              '&:hover': {
                background: (theme) => theme.palette.primary.main,
                boxShadow: 'none',
                outline: 'none',
                border: 'none',
              },
            }}
            disableFocusRipple
            disableRipple
          >
            <Badge badgeContent={itemsInCart} color="error">
              <CustomShoppingCartIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        {profileMenuButton}
      </>
    );

    mobileMenuItems = [
      <MenuItem
        key="cart"
        onClick={() => {
          navigate('/buyer/cart');
          handleCloseMobileMenu();
        }}
      >
        <Badge badgeContent={itemsInCart} color="error" sx={{ mr: 1.5 }}>
          <CustomShoppingCartIcon />
        </Badge>
        Mi Carrito
      </MenuItem>,
      <MenuItem
        key="profile"
        onClick={() => {
          navigate('/profile');
          handleCloseMobileMenu();
        }}
      >
        Mi Perfil
      </MenuItem>,
      <Divider key="divider" />,
      <MenuItem key="logout" onClick={handleLogout}>
        Cerrar sesión
      </MenuItem>,
    ];  } else {
    desktopRightContent = (
      <>
        <Tooltip title="Carrito" arrow>
          <IconButton 
            onClick={() => navigate('/buyer/cart')} 
            sx={{
              color: 'white',
              mr: 2.5,
              boxShadow: 'none',
              outline: 'none',
              border: 'none',
              transition: 'background 0.2s',
              '&:focus': { outline: 'none', border: 'none', boxShadow: 'none' },
              '&:active': { outline: 'none', border: 'none', boxShadow: 'none' },
              '&:hover': {
                background: (theme) => theme.palette.primary.main,
                boxShadow: 'none',
                outline: 'none',
                border: 'none',
              },
            }}
            disableFocusRipple
            disableRipple
          >
            <Badge badgeContent={itemsInCart} color="error">
              <CustomShoppingCartIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        {profileMenuButton}
      </>
    );

    mobileMenuItems = [
      <MenuItem
        key="cart"
        onClick={() => {
          navigate('/buyer/cart');
          handleCloseMobileMenu();
        }}
      >
        <Badge badgeContent={itemsInCart} color="error" sx={{ mr: 1.5 }}>
          <CustomShoppingCartIcon />
        </Badge>
        Mi Carrito
      </MenuItem>,
      <MenuItem
        key="profile"
        onClick={() => {
          navigate('/profile');
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

  return (
    <>
      <Box
        sx={{
          backgroundColor: '#000000',
          width: '100vw',
          px: 0,
          py: 1,
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          zIndex: 1100,
          height: 64, // Ensure this matches pt in AppContent Box
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '1575px',
            px: { xs: 2, md: 4 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            component="img"
            src="/logodark.svg"
            alt="Sellsi Logo"
            onClick={() => navigate('/')}
            sx={{ height: { xs: 129, md: 160 }, cursor: 'pointer' }}
          />
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {desktopNavLinks}
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 2,
            }}
          >
            {desktopRightContent}
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            {isLoggedIn && !isBuyer && (
              <Box sx={{ mr: 1 }}>{profileMenuButton}</Box>
            )}
            <IconButton onClick={handleOpenMobileMenu} color="inherit">
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleCloseMobileMenu}
      >
        {mobileMenuItems}
      </Menu>
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={handleCloseProfileMenu}
      >
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleCloseProfileMenu();
          }}
        >
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
      </Menu>

      {openLoginModal && (
        <Login
          open={openLoginModal}
          onClose={() => setOpenLoginModal(false)}
          onOpenRegister={() => {
            setOpenLoginModal(false);
            setOpenRegisterModal(true);
          }}
        />
      )}
      {openRegisterModal && (
        <Register
          open={openRegisterModal}
          onClose={() => setOpenRegisterModal(false)}
        />
      )}
      {openContactModal && (
        <ContactModal
          open={openContactModal}
          onClose={() => setOpenContactModal(false)}
        />
      )}
    </>
  );
}
