// 📁 features/layout/TopBar.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import { supabase } from '../../services/supabase';
import useCartStore from '../buyer/hooks/cartStore';
import ContactModal from '../ui/ContactModal';
import Login from '../login/Login';
import Register from '../register/Register';

// Importa el nuevo componente reutilizable y ahora verdaderamente controlado
import Switch from '../ui/Switch'; // Ajusta la ruta si es diferente

export default function TopBar({
  session,
  isBuyer, // Esta prop viene de App.jsx y refleja el rol del perfil
  logoUrl,
  onNavigate,
  onRoleChange, // Esta función actualiza el rol en App.jsx
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const itemsInCart = useCartStore(state => state.items).length;

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);

  // El estado `currentRole` se mantiene en TopBar, ya que es quien controla
  // el `Switch` y lo sincroniza con `isBuyer` del padre (App.jsx).
  const [currentRole, setCurrentRole] = useState(
    isBuyer ? 'buyer' : 'supplier'
  );

  // Este useEffect es crucial para la sincronización con la prop `isBuyer`
  // (que viene de Supabase en App.jsx) al inicio o tras un cambio de sesión.
  useEffect(() => {
    if (session) {
      const newRoleFromProps = isBuyer ? 'buyer' : 'supplier';
      if (currentRole !== newRoleFromProps) {
        setCurrentRole(newRoleFromProps);
      }
    } else {
      setCurrentRole('buyer');
    }
  }, [session, isBuyer, currentRole]); // currentRole como dependencia es importante para la condición de no-coincidencia.

  const isLoggedIn = !!session;

  const handleOpenMobileMenu = e => setMobileMenuAnchor(e.currentTarget);
  const handleCloseMobileMenu = () => setMobileMenuAnchor(null);
  const handleOpenProfileMenu = e => setProfileAnchor(e.currentTarget);
  const handleCloseProfileMenu = () => setProfileAnchor(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleCloseProfileMenu();
    handleCloseMobileMenu();
    // Al hacer logout, el App.jsx manejará la redirección y el `session` pasará a null.
    // El useEffect de TopBar entonces reseteará `currentRole` a 'buyer'.
    navigate('/');
  };

  const handleNavigate = ref => {
    handleCloseMobileMenu();
    setTimeout(() => {
      console.log('handleNavigate called with ref:', ref);
      if (ref === 'contactModal') {
        setOpenContactModal(true);
        console.log('setOpenContactModal(true) called');
        return;
      }
      if (onNavigate) {
        onNavigate(ref);
      }
    }, 0);
  };

  // Este es el manejador de cambios del `Switch`.
  // Recibe el `newRole` del `Switch` y lo pasa al padre `App.jsx`.
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
      sx={{
        fontSize: '1.5rem',
        color: 'white !important',
        ...sx,
      }}
    />
  );

  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];
  let paddingX = { xs: 2, md: 18, mac: 18, lg: 18 }; // Default padding for logged out

  // Avatar con fade-in
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  useEffect(() => {
    setAvatarLoaded(false); // Resetear cuando cambia el logo
  }, [logoUrl]);

  const profileMenuButton = (
    <IconButton onClick={handleOpenProfileMenu} sx={{ color: 'white', p: 0 }}>
      <Avatar
        src={logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' ? logoUrl : undefined}
        key={logoUrl || 'default-avatar'}
        sx={{
          transition: 'opacity 0.5s',
          opacity: avatarLoaded ? 1 : 0,
          background: '#e0e0e0',
        }}
        imgProps={{
          onLoad: () => setAvatarLoaded(true),
          onError: () => setAvatarLoaded(true),
          style: { transition: 'opacity 0.5s', opacity: avatarLoaded ? 1 : 0 }
        }}
      >
        <PersonIcon sx={{ opacity: avatarLoaded ? 0 : 1, transition: 'opacity 0.3s' }} />
      </Avatar>
    </IconButton>
  );

  if (!isLoggedIn) {
    const publicNavButtons = [
      { label: 'Quiénes somos', ref: 'quienesSomosRef' },
      { label: 'Servicios', ref: 'serviciosRef' },
      { label: 'Trabaja con Nosotros', ref: 'trabajaConNosotrosRef' },
      { label: 'Contáctanos', ref: 'contactModal' }, // Cambiado a contactModal para abrir el modal
    ];

    desktopNavLinks = publicNavButtons.map(({ label, ref }) => (
      <Button
        key={label}
        onClick={() => handleNavigate(ref)}
        sx={{
          color: 'white',
          textTransform: 'none',
          fontSize: 16,
          outline: 'none',
          boxShadow: 'none',
          border: 'none',
          '&:focus': { outline: 'none', boxShadow: 'none', border: 'none' },
          '&:active': { outline: 'none', boxShadow: 'none', border: 'none' },
          '&:hover': { outline: 'none', boxShadow: 'none', border: 'none' },
        }}
        disableFocusRipple
        disableRipple
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
          sx={{
            outline: 'none',
            boxShadow: 'none',
            border: 'none',
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
          onClick={() => setOpenRegisterModal(true)}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'white',
            outline: 'none',
            boxShadow: 'none',
            border: 'none',
            '&:focus': { outline: 'none', boxShadow: 'none', border: 'none' },
            '&:active': { outline: 'none', boxShadow: 'none', border: 'none' },
            '&:hover': { outline: 'none', boxShadow: 'none', border: 'none' },
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
        <MenuItem key={label} onClick={() => handleNavigate(ref)}>
          {label}
        </MenuItem>
      )),
      <Divider key="divider1" />,
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
    // Si el usuario está logueado
    paddingX = { xs: 2, md: 6, mac: 6, lg: 6 }; // Updated padding for logged in
    desktopRightContent = (
      <>
        {/* Usamos el componente Switch */}
        <Switch
          value={currentRole} // Le pasamos el estado interno de TopBar como valor
          onChange={handleRoleToggleChange} // Le pasamos el manejador de cambios
          // Los estilos base del switch ya están en Switch,
          // pero puedes agregarle más aquí si necesitas un ajuste específico para el desktop
          sx={{ mr: 2 }}
        />

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
              '&:active': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              },
              '&:hover': {
                background: theme => theme.palette.primary.main,
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
        key="roleToggleMobile"
        sx={{ display: 'flex', justifyContent: 'center', py: 1 }}
      >
        {/* Usamos el componente Switch en el menú móvil también */}
        <Switch
          value={currentRole} // Le pasamos el estado interno de TopBar como valor
          onChange={handleRoleToggleChange} // Le pasamos el manejador de cambios
          sx={{ width: '100%', mr: 0 }} // Estilos específicos para el móvil, anula el mr del desktop
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
          const profileRoute = isBuyer ? '/buyer/profile' : '/supplier/profile';
          navigate(profileRoute);
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
          height: 64,
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
              component="img"
              src="/logodark.svg"
              alt="Sellsi Logo"
              onClick={() => navigate('/')}
              sx={{
                height: { xs: 90, md: 110 },
                cursor: 'pointer',
              }}
            />
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {desktopNavLinks}
            </Box>
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
            {isLoggedIn && (
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
                      '&:focus': {
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      },
                      '&:active': {
                        outline: 'none',
                        border: 'none',
                        boxShadow: 'none',
                      },
                      '&:hover': {
                        background: theme => theme.palette.primary.main,
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
            )}
            <IconButton onClick={handleOpenMobileMenu}>
              <MenuIcon sx={{ color: 'white' }} />
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
        disableScrollLock={true}
      >
        <MenuItem
          onClick={() => {
            const profileRoute = isBuyer ? '/buyer/profile' : '/supplier/profile';
            navigate(profileRoute);
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
          onClose={() => {
            setOpenContactModal(false);
            console.log('ContactModal cerrado');
          }}
        />
      )}
    </>
  );
}
