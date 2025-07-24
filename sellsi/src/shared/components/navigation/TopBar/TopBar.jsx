// 📁 shared/components/navigation/TopBar/TopBar.jsx
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
import { supabase } from '../../../services/supabase';
import useCartStore from '../../../stores/cart/cartStore';
import ContactModal from '../../modals/ContactModal';
import { Modal, MODAL_TYPES } from '../../feedback';
import { useRole } from '../../../../infrastructure/providers/RoleProvider';
// Lazy imports para evitar bundling mixto
const Login = React.lazy(() => import('../../../../domains/auth').then(module => ({ default: module.Login })));
const Register = React.lazy(() => import('../../../../domains/auth').then(module => ({ default: module.Register })));
import { setSkipScrollToTopOnce } from '../ScrollToTop/ScrollToTop';

// Importa el nuevo componente reutilizable y ahora verdaderamente controlado
import { Switch } from '../'; // Ajusta la ruta si es diferente

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
  const { isRoleLoading } = useRole(); // ✅ Acceder al estado de loading del rol

  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [openContactModal, setOpenContactModal] = useState(false);

  // El estado `currentRole` se mantiene en TopBar, ya que es quien controla
  // el `Switch` y lo sincroniza con `isBuyer` del padre (App.jsx).
  const [currentRole, setCurrentRole] = useState(() => {
    // ✅ MEJORA: Solo establecer rol inicial si isBuyer no es undefined/null
    if (typeof isBuyer === 'boolean') {
      return isBuyer ? 'buyer' : 'supplier';
    }
    // Si isBuyer aún no está determinado, usar buyer como fallback temporal
    return 'buyer';
  });

  // Este useEffect es crucial para la sincronización con la prop `isBuyer`
  // (que viene de RoleProvider) al inicio o tras un cambio de sesión.
  useEffect(() => {
    if (session && typeof isBuyer === 'boolean') {
      const newRoleFromProps = isBuyer ? 'buyer' : 'supplier';
      if (currentRole !== newRoleFromProps) {
        setCurrentRole(newRoleFromProps);
      }
    } else if (!session) {
      setCurrentRole('buyer');
    }
  }, [session, isBuyer, currentRole]);

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
        setOpenContactModal(true);
        return;
      }
      // Si es un anchor de la home, navega a / con scrollTo
      if (ref === 'quienesSomosRef' || ref === 'serviciosRef' || ref === 'trabajaConNosotrosRef') {
        setSkipScrollToTopOnce();
        navigate(`/?scrollTo=${ref}`);
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
        color: '#fff !important',
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
    <IconButton onClick={handleOpenProfileMenu} sx={{ color: 'white', p: 0, display: { xs: 'none', md: 'inline-flex' } }}>
      {logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' ? (
        <Avatar
          src={logoUrl}
          key={logoUrl}
          sx={{
            transition: 'none !important',
            opacity: avatarLoaded ? 1 : 0,
            background: 'transparent !important',
          }}
          imgProps={{
            onLoad: () => setAvatarLoaded(true),
            onError: () => setAvatarLoaded(true),
            style: { transition: 'opacity 0.5s', opacity: avatarLoaded ? 1 : 0 }
          }}
        />
      ) : (
        <Avatar sx={{ background: '#fff !important', color: '#111 !important' }}>
          <PersonIcon sx={{ color: '#111 !important', fontSize: 32 }} />
        </Avatar>
      )}
    </IconButton>
  );
  // Estado para el modal de "Próximamente..."
  const [openComingSoonModal, setOpenComingSoonModal] = useState(false);

  if (!isLoggedIn) {
    // Botones públicos, pero el de "Trabaja con Nosotros" ahora abre modal
    const publicNavButtons = [
      { label: 'Quiénes Somos', ref: 'quienesSomosRef' },
      { label: 'Servicios', ref: 'serviciosRef' },
      { label: 'Trabaja con Nosotros', ref: 'trabajaConNosotrosRef' },
      { label: 'Contáctanos', ref: 'contactModal' },
    ];

    desktopNavLinks = publicNavButtons.map(({ label, ref }) => {
      if (ref === 'trabajaConNosotrosRef') {
        return (
          <Button
            key={label}
            onClick={() => setOpenComingSoonModal(true)}
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
        );
      }
      return (
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
      );
    });

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
      ...publicNavButtons.map(({ label, ref }) => {
        if (ref === 'trabajaConNosotrosRef') {
          return (
            <MenuItem
              key={label}
              onClick={() => {
                setOpenComingSoonModal(true);
                handleCloseMobileMenu();
              }}
            >
              {label}
            </MenuItem>
          );
        }
        return (
          <MenuItem key={label} onClick={() => handleNavigate(ref)}>
            {label}
          </MenuItem>
        );
      }),
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
    paddingX = { xs: 2, md: 4, mac: 4, lg: 4 }; // Updated padding for logged in
    desktopRightContent = (
      <>
        {/* Usamos el componente Switch */}
        <Switch
          value={currentRole} // Le pasamos el estado interno de TopBar como valor
          onChange={handleRoleToggleChange} // Le pasamos el manejador de cambios
          disabled={isRoleLoading} // ✅ Deshabilitar mientras se carga el rol
          // Los estilos base del switch ya están en Switch,
          // pero puedes agregarle más aquí si necesitas un ajuste específico para el desktop
          sx={{ 
            mr: 2,
            opacity: isRoleLoading ? 0.6 : 1, // ✅ Indicador visual de loading
          }}
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
          disabled={isRoleLoading} // ✅ Deshabilitar mientras se carga el rol
          sx={{ 
            width: '100%', 
            mr: 0,
            opacity: isRoleLoading ? 0.6 : 1, // ✅ Indicador visual de loading
          }} // Estilos específicos para el móvil, anula el mr del desktop
        />
      </MenuItem>,
      <Divider key="dividerMobileRole" />,
      // Eliminado el botón de carrito en mobileMenuItems
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
          py: { xs: 0, sm: 0, md: 1 }, // Sin padding vertical en mobile
          display: 'flex',
          justifyContent: 'center',
          position: 'fixed',
          top: 0,
          zIndex: 1100,
          height: { xs: 45, md: 64 }, // Altura reducida en mobile
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
                maxWidth: { xs: 90 , sm: 90, md: 140 },
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
                  height: { xs: 380, sm: 380, md: 450 },
                  width: { xs: 90, sm: 90, md: 140 }, // Mobile: fill width
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
                {/* Carrito eliminado en xs/sm, solo se muestra el profileMenuButton */}
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
            '& .MuiToggleButton-root': {
              color: '#FFFFFF',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&.Mui-selected': {
                backgroundColor: (theme) => theme.palette.primary.main,
                color: '#FFFFFF',
              },
              '&.Mui-selected:hover': {
                backgroundColor: (theme) => theme.palette.primary.dark,
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            },
            '& .MuiDivider-root': {
              borderColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        }}
      >
        {mobileMenuItems}
      </Menu>
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
            // ...log eliminado...
          }}
        />
      )}
      {/* Modal Proximamente */}
      <Modal
        isOpen={openComingSoonModal}
        onClose={() => setOpenComingSoonModal(false)}
        onSubmit={() => setOpenComingSoonModal(false)}
        type={MODAL_TYPES.INFO}
        title="Próximamente..."
        showCancelButton={false}
      >
        Esta funcionalidad estará disponible pronto.
      </Modal>
    </>
  );
}
