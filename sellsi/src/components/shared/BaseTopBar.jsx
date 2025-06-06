import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import { supabase } from '../../services/supabase';

import Login from '../Login';
import Register from '../Register';
import ContactModal from '../ContactModal';

export default function BaseTopBar({
  navigationButtons = [],
  authButtons = {},
  onNavigate,
  showContactModal = true,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Suscripción a cambios de sesión
  useEffect(() => {
    const getCurrentSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };

    getCurrentSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const openMenu = e => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const openProfileMenu = e => setProfileAnchor(e.currentTarget);
  const closeProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    closeProfileMenu();
    navigate('/');
  };

  const handleOpenLogin = () => {
    setOpenLoginModal(true);
    closeMenu();
  };

  const handleOpenRegister = () => {
    setOpenRegisterModal(true);
    closeMenu();
  };

  const handleCloseLogin = () => setOpenLoginModal(false);
  const handleCloseRegister = () => setOpenRegisterModal(false);

  const handleOpenContact = () => {
    setOpenContactModal(true);
    closeMenu();
  };
  const handleCloseContact = () => setOpenContactModal(false);

  const handleNavigate = ref => {
    closeMenu();
    if (ref === 'contactModal') {
      handleOpenContact();
      return;
    }
    if (ref !== 'trabajaConNosotrosRef' && onNavigate) {
      onNavigate(ref);
    }
  };

  const handleGoHome = () => {
    navigate('/');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    const handleOpenLoginModal = () => setOpenLoginModal(true);
    window.addEventListener('openLoginModal', handleOpenLoginModal);
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal);
    };
  }, []);

  return (
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
        overflowX: 'hidden',
        height: { xs: 56, md: 64 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo y navegación */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="button"
            onClick={handleGoHome}
            sx={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <img
              src="/logodark.svg"
              alt="SELLSI Logo"
              style={{ height: 28, maxWidth: '120px', flexShrink: 0 }}
            />
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 3,
            }}
          >
            {!isLoggedIn &&
              navigationButtons.map(({ label, ref }) => (
                <Button
                  key={ref}
                  onClick={() => handleNavigate(ref)}
                  color="inherit"
                  sx={{ fontWeight: 'bold', color: 'white' }}
                >
                  {label}
                </Button>
              ))}
          </Box>
        </Box>

        {/* Menú móvil */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <IconButton onClick={openMenu} sx={{ color: 'white', p: 1 }}>
            <MenuIcon fontSize="large" />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleGoHome}>Inicio</MenuItem>
            {!isLoggedIn &&
              navigationButtons.map(({ label, ref }) => (
                <MenuItem key={ref} onClick={() => handleNavigate(ref)}>
                  {label}
                </MenuItem>
              ))}
            {!isLoggedIn ? (
              <>
                <MenuItem onClick={handleOpenLogin}>Iniciar sesión</MenuItem>
                <MenuItem onClick={handleOpenRegister}>Registrarse</MenuItem>
              </>
            ) : (
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            )}
          </Menu>
        </Box>

        {/* Desktop auth */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          {isLoggedIn ? (
            <>
              <IconButton onClick={openProfileMenu} sx={{ color: 'white' }}>
                <AccountCircleIcon fontSize="large" />
              </IconButton>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={closeProfileMenu}
              >
                <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleOpenLogin}>
                Iniciar sesión
              </Button>
              <Button variant="outlined" onClick={handleOpenRegister}>
                Registrarse
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modales */}
      <Login
        open={openLoginModal}
        onClose={handleCloseLogin}
        onOpenRegister={() => {
          handleCloseLogin();
          handleOpenRegister();
        }}
      />
      {openRegisterModal && (
        <Register open={openRegisterModal} onClose={handleCloseRegister} />
      )}
      {showContactModal && (
        <ContactModal open={openContactModal} onClose={handleCloseContact} />
      )}
    </Box>
  );
}
