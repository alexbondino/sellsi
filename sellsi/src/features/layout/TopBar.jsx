// 📁 features/layout/TopBar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
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
import { supabase } from '../../services/supabase';
import useCartStore from '../buyer/hooks/cartStore';
import ContactModal from '../ui/ContactModal';
import Login from '../login/Login';
import Register from '../register/Register';
import Switch from '../ui/Switch';

export default function TopBar({
  session,
  isBuyer,
  logoUrl,
  onNavigate,
  onRoleChange,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const itemsInCart = useCartStore(state => state.items).length;

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);
  const [currentRole, setCurrentRole] = useState(
    isBuyer ? 'buyer' : 'supplier'
  );

  useEffect(() => {
    if (session) {
      const newRoleFromProps = isBuyer ? 'buyer' : 'supplier';
      if (currentRole !== newRoleFromProps) {
        setCurrentRole(newRoleFromProps);
      }
    } else {
      setCurrentRole('buyer');
    }
  }, [session, isBuyer, currentRole]);

  const isLoggedIn = !!session;

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

  const handleRoleToggleChange = (event, newRole) => {
    if (newRole !== null) {
      setCurrentRole(newRole);
      if (onRoleChange) {
        onRoleChange(newRole);
      }
    }
  };

  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon
      {...props}
      sx={{ fontSize: '1.5rem', color: 'white !important', ...sx }}
    />
  );

  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];
  let paddingX = { xs: 2, md: 18 }; // Padding por defecto para no logueados

  const profileMenuButton = (
    <IconButton onClick={handleOpenProfileMenu} sx={{ color: 'white', p: 0 }}>
      <Avatar src={logoUrl}>
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
    ];
  } else {
    paddingX = { xs: 2, md: 8 }; // Padding para usuarios logueados (más pequeño)

    desktopRightContent = (
      <>
        <Switch
          value={currentRole}
          onChange={handleRoleToggleChange}
          sx={{ mr: 2 }}
        />
        <Tooltip title="Carrito" arrow>
          <IconButton
            onClick={() => navigate('/buyer/cart')}
            sx={{ color: 'white', mr: 2.5 }}
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
        key="roleToggleMobile"
        sx={{ display: 'flex', justifyContent: 'center', py: 1 }}
      >
        <Switch
          value={currentRole}
          onChange={handleRoleToggleChange}
          sx={{ width: '100%', mr: 0 }}
        />
      </MenuItem>,
      <Divider key="dividerMobileRole" />,
      <MenuItem
        key="cart"
        onClick={() => {
          navigate('/buyer/cart');
          handleCloseMobileMenu();
        }}
      >
        <Badge badgeContent={itemsInCart} color="error" sx={{ mr: 1.5 }}>
          <CustomShoppingCartIcon
            sx={{ color: theme.palette.text.primary + ' !important' }}
          />
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
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#000000',
          height: 64,
          borderBottom: '1px solid white',
        }}
      >
        <Toolbar sx={{ height: '100%', px: paddingX }}>
          {/* ---- Contenido Izquierdo ---- */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src="/logodark.svg"
              alt="Sellsi Logo"
              onClick={() => navigate('/')}
              sx={{ height: { xs: 90, md: 110 }, cursor: 'pointer' }}
            />
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {desktopNavLinks}
            </Box>
          </Box>

          {/* ---- Espaciador que empuja el contenido derecho ---- */}
          <Box sx={{ flexGrow: 1 }} />

          {/* ---- Contenido Derecho (Desktop) ---- */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 2,
            }}
          >
            {desktopRightContent}
          </Box>

          {/* ---- Contenido Derecho (Móvil) ---- */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            {isLoggedIn && (
              <>
                <Tooltip title="Carrito" arrow>
                  <IconButton
                    onClick={() => navigate('/buyer/cart')}
                    sx={{ color: 'white', mr: 2.5 }}
                  >
                    <Badge badgeContent={itemsInCart} color="error">
                      <CustomShoppingCartIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </>
            )}
            <IconButton onClick={handleOpenMobileMenu} sx={{ color: 'white' }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menús y Modales */}
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
