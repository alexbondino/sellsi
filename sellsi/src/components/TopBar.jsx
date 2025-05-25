import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGAR import
import Login from './Login.jsx';
import CrearAcc from './Register.jsx';

const TopBar = ({ onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate(); // ✅ AGREGAR hook de navegación

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [openLoginModal, setOpenLoginModal] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);

  const openMenu = e => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

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

  const sectionsMap = {
    'Quiénes somos': 'quienesSomosRef',
    Servicios: 'serviciosRef',
    Contáctanos: 'contactanosRef',
  };

  const handleNavigate = ref => {
    closeMenu();
    onNavigate(ref);
  };

  // ✅ AGREGAR función para ir a Home
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.bars.main,
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        zIndex: 1100, // ✅ ASEGURAR que esté por encima
        overflowX: 'hidden',
        height: { xs: 56, md: 64 }, // ✅ AGREGAR altura fija
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
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
        >
          {/* ✅ CONVERTIR logo en botón clickeable */}
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
              src="/logo.svg"
              alt="SELLSI Logo"
              style={{ height: 28, maxWidth: '120px', flexShrink: 0 }}
            />
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {Object.entries(sectionsMap).map(([label, ref]) => (
                <Button
                  key={ref}
                  onClick={() => handleNavigate(ref)}
                  color="inherit"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.common.white,
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Botones o menú móvil */}
        {isMobile ? (
          <>
            <IconButton
              onClick={openMenu}
              sx={{ color: theme.palette.common.white, p: 1 }}
            >
              <MenuIcon fontSize="large" />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={closeMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { maxWidth: '90vw', overflowX: 'hidden' } }}
            >
              {/* ✅ AGREGAR opción "Inicio" en menú móvil */}
              <MenuItem onClick={handleGoHome}>Inicio</MenuItem>
              {Object.entries(sectionsMap).map(([label, ref]) => (
                <MenuItem key={ref} onClick={() => handleNavigate(ref)}>
                  {label}
                </MenuItem>
              ))}
              <MenuItem onClick={handleOpenLogin}>Iniciar sesión</MenuItem>
              <MenuItem onClick={handleOpenRegister}>Registrarse</MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleOpenLogin}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.common.white,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              Iniciar sesión
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenRegister}
              sx={{
                color: theme.palette.common.white,
                borderColor: theme.palette.primary.main,
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              Registrarse
            </Button>
          </Box>
        )}
      </Box>

      {/* Modal de Login */}
      <Login
        open={openLoginModal}
        handleClose={handleCloseLogin}
        handleOpenRegister={() => {
          handleCloseLogin();
          handleOpenRegister();
        }}
      />

      {/* Modal de Registro */}
      {openRegisterModal && (
        <CrearAcc open={openRegisterModal} onClose={handleCloseRegister} />
      )}
    </Box>
  );
};

export default TopBar;
