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

const TopBar = ({ onNavigate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const sectionsMap = {
    'Quiénes somos': 'quienesSomosRef',
    Servicios: 'serviciosRef',
    Contáctanos: 'contactanosRef',
  };

  const [menuAnchor, setMenuAnchor] = useState(null);
  const openMenu = e => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const handleNavigate = ref => {
    closeMenu();
    onNavigate(ref);
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
        zIndex: 1100,
        overflowX: 'hidden',
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
          overflowX: 'hidden',
        }}
      >
        {/* Logo y navegación */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
        >
          <img
            src="/logo.svg"
            alt="SELLSI Logo"
            style={{ height: 28, maxWidth: '120px', flexShrink: 0 }}
          />

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {Object.entries(sectionsMap).map(([label, ref]) => (
                <Button
                  key={ref}
                  onClick={() => onNavigate(ref)}
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

        {/* Botones o menú hamburguesa */}
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
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: {
                  maxWidth: '90vw',
                  overflowX: 'hidden',
                },
              }}
            >
              {Object.entries(sectionsMap).map(([label, ref]) => (
                <MenuItem key={ref} onClick={() => handleNavigate(ref)}>
                  {label}
                </MenuItem>
              ))}
              <MenuItem onClick={closeMenu}>Iniciar sesión</MenuItem>
              <MenuItem onClick={closeMenu}>Registrarse</MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
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
    </Box>
  );
};

export default TopBar;
