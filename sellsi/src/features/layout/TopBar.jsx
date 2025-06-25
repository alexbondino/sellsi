// 📁 features/layout/TopBar.jsx
import React, { useState, useEffect, useRef } from 'react'; // Importa useRef
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

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

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

  // Estado interno para el switch de la TopBar.
  // Se inicializa con la prop `isBuyer`.
  const [currentRole, setCurrentRole] = useState(
    isBuyer ? 'buyer' : 'supplier'
  );

  // Usamos un ref para saber si ya hemos inicializado el rol.
  const isInitialRoleSet = useRef(false);

  // useEffect para establecer el rol del switch UNA VEZ al inicio o al cambiar la sesión.
  // Es importante que este efecto se ejecute solo cuando el isBuyer de la sesión cambie,
  // NO cada vez que el usuario interactúe con el switch.
  useEffect(() => {
    // Solo si la sesión o el estado `isBuyer` inicial cambia por fuera.
    // Esto asegura que al cargar la página o al hacer login, el switch se ajuste al rol del usuario.
    // Una vez que el usuario interactúa con el switch (manejado por handleRoleToggleChange),
    // el estado `currentRole` de la TopBar toma precedencia hasta un nuevo login/recarga.
    if (
      !isInitialRoleSet.current ||
      (session && currentRole !== (isBuyer ? 'buyer' : 'supplier'))
    ) {
      setCurrentRole(isBuyer ? 'buyer' : 'supplier');
      isInitialRoleSet.current = true; // Marca que ya se configuró el rol inicial
    }
  }, [session, isBuyer]); // Dependencias: la sesión y la prop isBuyer

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
      setCurrentRole(newRole); // Actualiza el estado interno del switch
      // Notifica al componente padre (App.jsx) sobre el cambio de rol
      if (onRoleChange) {
        onRoleChange(newRole);
      }
    }
  };

  const CustomShoppingCartIcon = ({ sx, ...props }) => (
    <ShoppingCartIcon
      {...props}
      sx={{
        fontSize: '2.24rem',
        color: 'white !important',
        ...sx,
      }}
    />
  );

  let desktopNavLinks = null;
  let desktopRightContent = null;
  let mobileMenuItems = [];

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
    desktopRightContent = (
      <>
        {/* Toggle Button Group para Proveedor/Comprador */}
        <ToggleButtonGroup
          value={currentRole} // Usa el estado interno `currentRole`
          exclusive
          onChange={handleRoleToggleChange}
          aria-label="Selección de rol"
          sx={{
            mr: 2,
            height: '32px',
            '& .MuiToggleButton-root': {
              borderColor: 'white',
              color: 'white',
              minWidth: 'unset',
              padding: '4px 12px',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              height: '32px',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            },
          }}
        >
          <ToggleButton value="buyer" aria-label="comprador">
            Comprador
          </ToggleButton>
          <ToggleButton value="supplier" aria-label="proveedor">
            Proveedor
          </ToggleButton>
        </ToggleButtonGroup>

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
        <ToggleButtonGroup
          value={currentRole} // Usa el estado interno `currentRole`
          exclusive
          onChange={handleRoleToggleChange}
          aria-label="Selección de rol móvil"
          sx={{
            width: '100%',
            '& .MuiToggleButton-root': {
              flexGrow: 1,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              padding: '6px 12px',
              fontSize: '0.85rem',
              minHeight: '36px',
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          <ToggleButton value="buyer">Comprador</ToggleButton>
          <ToggleButton value="supplier">Proveedor</ToggleButton>
        </ToggleButtonGroup>
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
            px: { xs: 2, md: 18, mac: 18, lg: 18 },
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
