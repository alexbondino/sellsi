import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  Avatar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

// Importar componentes de diálogo
import Login from '../Login'
import Register from '../Register'
import ContactModal from '../ContactModal'

// Importar hook para logo del proveedor
// ❌ Este import debería ser removido:
// import { useSupplierLogo } from '../../hooks/shared/useSupplierLogo'

/**
 * BaseTopBar - Componente base para todas las variantes de TopBar
 * Maneja la lógica común y permite customización mediante props
 */
export default function BaseTopBar({
  navigationButtons = [],
  authButtons = {},
  onNavigate,
  showContactModal = true,
  logoMarginLeft = {
    xs: 0,
    sm: -1,
    md: -2,
    lg: -3,
    xl: -4,
  },
}) {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
  const [openContactModal, setOpenContactModal] = useState(false)

  const supplierid = localStorage.getItem('supplierid')
  const sellerid = localStorage.getItem('sellerid')
  const isLoggedIn = !!(supplierid || sellerid)
  const isProvider = !!supplierid
  // Hook para obtener logo del proveedor
  // ❌ ROLLBACK: Comentado temporalmente
  // const { logoUrl: supplierLogo, loading: logoLoading } = useSupplierLogo()

  // Menú móvil
  const openMenu = (e) => setMenuAnchor(e.currentTarget)
  const closeMenu = () => setMenuAnchor(null)

  // Menú de perfil
  const openProfileMenu = (e) => setProfileAnchor(e.currentTarget)
  const closeProfileMenu = () => setProfileAnchor(null)

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('supplierid')
    localStorage.removeItem('sellerid')
    localStorage.removeItem('account_type')
    localStorage.removeItem('user_email')
    closeProfileMenu()
    navigate('/')
  }

  // Modales de autenticación
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

  // Modal de contacto
  const handleOpenContact = () => {
    setOpenContactModal(true)
    closeMenu()
  }
  const handleCloseContact = () => setOpenContactModal(false)
  // Navegación
  const handleNavigate = (ref) => {
    closeMenu()

    // Abrir modal de contacto
    if (ref === 'contactModal') {
      handleOpenContact()
      return
    }

    // Navegación personalizada - SIEMPRE llamar a onNavigate si existe
    if (onNavigate) {
      onNavigate(ref)
    }
  }

  // Ir al inicio
  const handleGoHome = () => {
    navigate('/')
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }, 100)
  }

  // Listener para abrir modal de login desde otros componentes
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
      {' '}
      <Box
        sx={{
          width: '100%',
          maxWidth: {
            sm: '720px',
            md: '960px',
            lg: '1575px',
            xl: '1700px',
          },
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {' '}
        {/* Logo y navegación */}{' '}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            // ❌ REMOVER esta línea:
            // marginLeft: logoMarginLeft,
          }}
        >
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
              marginLeft: logoMarginLeft,
              // ✅ AGREGAR estas líneas para eliminar el borde de focus:
              outline: 'none',
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
              '&:focus-visible': {
                outline: 'none',
                border: 'none',
                boxShadow: 'none',
              },
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
              style={{ height: 126, maxWidth: '540px', flexShrink: 0 }}
            />
          </Box>

          {/* Navigation links - hidden on mobile */}
          <Box
            sx={{
              display: {
                xs: 'none',
                sm: 'none',
                md: 'flex',
                lg: 'flex',
                xl: 'flex',
              },
              gap: 3,
            }}
          >
            {!isLoggedIn &&
              navigationButtons.map(({ label, ref }) => (
                <Button
                  key={ref}
                  onClick={() => handleNavigate(ref)}
                  color="inherit"
                  sx={{
                    fontWeight: 'bold',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    '&:focus': {
                      backgroundColor: 'transparent',
                      outline: 'none',
                    },
                    '&:active': {
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-focusVisible': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
          </Box>
        </Box>
        {/* Mobile menu button */}
        <Box
          sx={{
            display: {
              xs: 'block',
              sm: 'block',
              md: 'none',
              lg: 'none',
              xl: 'none',
            },
          }}
        >
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
              navigationButtons.map(({ label, ref }) => (
                <MenuItem key={ref} onClick={() => handleNavigate(ref)}>
                  {label}
                </MenuItem>
              ))}{' '}
            {!isLoggedIn ? (
              [
                authButtons.loginButton ? (
                  <MenuItem
                    key="login"
                    onClick={authButtons.loginButton.onClick || handleOpenLogin}
                  >
                    {typeof authButtons.loginButton.label === 'string'
                      ? authButtons.loginButton.label
                      : 'Mi Carro'}
                  </MenuItem>
                ) : (
                  <MenuItem key="login" onClick={handleOpenLogin}>
                    Iniciar sesión
                  </MenuItem>
                ),
                authButtons.registerButton ? (
                  <MenuItem
                    key="register"
                    onClick={
                      authButtons.registerButton.onClick || handleOpenRegister
                    }
                  >
                    {typeof authButtons.registerButton.label === 'string'
                      ? authButtons.registerButton.label
                      : 'Ir a mi perfil'}
                  </MenuItem>
                ) : (
                  <MenuItem key="register" onClick={handleOpenRegister}>
                    Registrarse
                  </MenuItem>
                ),
              ]
            ) : (
              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
            )}
          </Menu>
        </Box>
        {/* Desktop auth buttons and profile menu */}
        <Box
          sx={{
            display: {
              xs: 'none',
              sm: 'none',
              md: 'block',
              lg: 'block',
              xl: 'block',
            },
          }}
        >
          {' '}
          {isLoggedIn ? (
            <>
              {' '}
              <IconButton onClick={openProfileMenu} sx={{ color: 'white' }}>
                {/* ❌ ROLLBACK: Comentado temporalmente - lógica de logo del proveedor
                {isProvider && supplierLogo && !logoLoading ? (
                  <Avatar
                    src={supplierLogo}
                    alt="Logo del proveedor"
                    sx={{
                      width: 32,
                      height: 32,
                      border: '2px solid white',
                    }}
                  />
                ) : (
                */}
                {isProvider ? (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      border: '2px solid white',
                      bgcolor: 'primary.main',
                    }}
                  >
                    P
                  </Avatar>
                ) : (
                  <AccountCircleIcon fontSize="large" />
                )}
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
            <Box sx={{ display: 'flex', gap: 2.5 }}>
              {' '}
              {authButtons.loginButton ? (
                <Button
                  variant="contained"
                  onClick={authButtons.loginButton.onClick || handleOpenLogin}
                  sx={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                    // Aplicar estilos personalizados si existen
                    ...authButtons.loginButton.customStyles,
                  }}
                >
                  {authButtons.loginButton.label || 'Iniciar sesión'}
                </Button>
              ) : (
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
              )}{' '}
              {authButtons.registerButton ? (
                <Button
                  variant="outlined"
                  onClick={
                    authButtons.registerButton.onClick || handleOpenRegister
                  }
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                    },
                    // Aplicar estilos personalizados si existen
                    ...authButtons.registerButton.customStyles,
                  }}
                >
                  {authButtons.registerButton.label || 'Registrarse'}
                </Button>
              ) : (
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
              )}
            </Box>
          )}
        </Box>
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
      {/* Modal de Contacto */}
      {showContactModal && (
        <ContactModal open={openContactModal} onClose={handleCloseContact} />
      )}
    </Box>
  )
}
