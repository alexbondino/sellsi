import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' // ✅ AGREGAR useNavigate
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

// Importar componentes de diálogo
import Login from './Login'
import Register from './Register'

export default function TopBar({ onNavigate }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate() // ✅ AHORA FUNCIONA
  const location = useLocation() // ✅ AGREGAR para detectar cambios de ruta

  const [menuAnchor, setMenuAnchor] = useState(null)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const [openRegisterModal, setOpenRegisterModal] = useState(false)

  const isLoggedIn = !!localStorage.getItem('supplierid')

  const openMenu = (e) => setMenuAnchor(e.currentTarget)
  const closeMenu = () => setMenuAnchor(null)

  const openProfileMenu = (e) => setProfileAnchor(e.currentTarget)
  const closeProfileMenu = () => setProfileAnchor(null)

  const handleLogout = () => {
    localStorage.removeItem('supplierid')
    closeProfileMenu()
    navigate('/')
  }

  const handleOpenLogin = () => {
    setOpenLoginModal(true)
    closeMenu()
  }

  const handleOpenRegister = () => {
    setOpenRegisterModal(true)
    closeMenu()
  }

  const handleCloseLogin = () => setOpenLoginModal(false)
  const handleCloseRegister = () => setOpenRegisterModal(false)

  const sectionsMap = {
    'Quiénes somos': 'quienesSomosRef',
    Servicios: 'serviciosRef',
    Contáctanos: 'contactanosRef',
  }

  const handleNavigate = (ref) => {
    closeMenu()
    onNavigate(ref)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  useEffect(() => {
    const handleOpenLoginModal = () => {
      setOpenLoginModal(true)
    }

    window.addEventListener('openLoginModal', handleOpenLoginModal)

    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal)
    }
  }, [])

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.bars?.main || '#1976d2',
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
              src="/logo.svg"
              alt="SELLSI Logo"
              style={{ height: 28, maxWidth: '120px', flexShrink: 0 }}
            />
          </Box>

          {!isMobile && !isLoggedIn && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {Object.entries(sectionsMap).map(([label, ref]) => (
                <Button
                  key={ref}
                  onClick={() => handleNavigate(ref)}
                  color="inherit"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Botones o perfil */}
        {isMobile ? (
          <>
            <IconButton onClick={openMenu} sx={{ color: 'white', p: 1 }}>
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
              <MenuItem onClick={handleGoHome}>Inicio</MenuItem>
              {!isLoggedIn &&
                Object.entries(sectionsMap).map(([label, ref]) => (
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
          </>
        ) : isLoggedIn ? (
          <>
            <IconButton onClick={openProfileMenu} sx={{ color: 'white' }}>
              <AccountCircleIcon fontSize="large" />
            </IconButton>
            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={closeProfileMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleOpenLogin}
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              }}
            >
              Iniciar sesión
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenRegister}
              sx={{
                color: 'white',
                borderColor: 'white',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'white',
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
        onClose={handleCloseLogin}
        onOpenRegister={() => {
          handleCloseLogin()
          handleOpenRegister()
        }}
      />

      {/* Modal de Registro */}
      {openRegisterModal && (
        <Register open={openRegisterModal} onClose={handleCloseRegister} />
      )}
    </Box>
  )
}
