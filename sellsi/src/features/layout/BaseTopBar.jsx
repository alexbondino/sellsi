import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

import { supabase } from '../../services/supabase'
import ContactModal from '../ui/ContactModal'
import Login from '../login/Login'
import Register from '../register/Register'

export default function BaseTopBar({
  navigationButtons = [],
  authButtons = {},
  customRightElement = null, // Nuevo prop para elementos especiales sin envolver
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
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Suscripción a cambios de sesión
  useEffect(() => {
    const getCurrentSession = async () => {
      const { data } = await supabase.auth.getSession()
      setIsLoggedIn(!!data.session)
    }

    getCurrentSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const openMenu = (e) => setMenuAnchor(e.currentTarget)
  const closeMenu = () => setMenuAnchor(null)
  const openProfileMenu = (e) => setProfileAnchor(e.currentTarget)
  const closeProfileMenu = () => setProfileAnchor(null)
  const handleLogout = async () => {
    try {
      // Limpiar localStorage primero
      localStorage.removeItem('user_id')
      localStorage.removeItem('account_type')
      localStorage.removeItem('supplierid')
      localStorage.removeItem('sellerid')

      // Intentar sign out de Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error during logout:', error)
        // Continuar con la navegación incluso si hay error
      }

      closeProfileMenu()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      // En caso de cualquier error, seguir con la navegación
      closeProfileMenu()
      navigate('/')
    }
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

  const handleOpenContact = () => {
    setOpenContactModal(true)
    closeMenu()
  }
  const handleCloseContact = () => setOpenContactModal(false)

  const handleNavigate = (ref) => {
    closeMenu()
    if (ref === 'contactModal') {
      handleOpenContact()
      return
    }
    if (onNavigate) {
      onNavigate(ref)
    }
  }

  const handleGoHome = () => {
    navigate('/')
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  useEffect(() => {
    const handleOpenLoginModal = () => setOpenLoginModal(true)
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
      <Box
        sx={{
          width: '100%',
          maxWidth: {
            sm: '720px',
            md: '960px',
            lg: '1575px',
          },
          px: { xs: 2, sm: 3, md: 4 },
          ml: { xs: 0, sm: 0, md: 0, lg: 20.5, xl: 16 }, // Sin margen izquierdo en desktop
          display: 'flex',
          alignItems: 'center',
          justifyContent: {
            xs: 'space-between',
            md: 'space-between',
          },
        }}
      >
        {' '}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            ml: logoMarginLeft,
            gap: { md: 3, lg: 4 }, // Espacio entre logo y botones de navegación
          }}
        >
          {' '}
          <Box
            component="img"
            src="/logodark.svg"
            alt="Logo"
            onClick={handleGoHome}
            sx={{
              height: { xs: 129, md: 160 },
              cursor: 'pointer',
              mr: { xs: 1, md: 0 }, // Sin margen derecho en desktop
            }}
          />
          {/* Botones de navegación movidos al lado del logo */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {navigationButtons.map(({ label, ref }) => (
              <Button
                key={label}
                onClick={() => handleNavigate(ref)}
                sx={{
                  color: 'white',
                  textTransform: 'none',
                  fontSize: { xs: 14, md: 16 },
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  // Remover efectos de focus/active que causan bordes
                  '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '&:active': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '&.Mui-focusVisible': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>{' '}
        {/* Botones de autenticación mantenidos a la derecha */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          {authButtons.login ? (
            <Button
              onClick={authButtons.login.onClick}
              sx={authButtons.login.customStyles}
            >
              {authButtons.login.label}
            </Button>
          ) : (
            !isLoggedIn && (
              <Button
                onClick={handleOpenLogin}
                variant="contained"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: { xs: 14, md: 16 },
                  fontWeight: 500,
                }}
              >
                Iniciar sesión
              </Button>
            )
          )}{' '}
          {/* Si hay un customRightElement, lo renderizamos directamente sin envolver */}
          {customRightElement ? (
            customRightElement
          ) : authButtons.register ? (
            <Button
              onClick={authButtons.register.onClick}
              sx={authButtons.register.customStyles}
            >
              {authButtons.register.label}
            </Button>
          ) : (
            !isLoggedIn && (
              <Button
                onClick={handleOpenRegister}
                variant="outlined"
                sx={{
                  color: 'white',
                  borderColor: 'white',
                  textTransform: 'none',
                  fontSize: { xs: 14, md: 16 },
                  fontWeight: 500,
                }}
              >
                Registrarse
              </Button>
            )
          )}
          {!customRightElement && !authButtons.register && isLoggedIn && (
            <IconButton
              onClick={openProfileMenu}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:focus': {
                  outline: 'none',
                  boxShadow: 'none',
                },
                '&:active': {
                  outline: 'none',
                  boxShadow: 'none',
                },
                '&.Mui-focusVisible': {
                  outline: 'none',
                  boxShadow: 'none',
                },
              }}
            >
              <AccountCircleIcon />
            </IconButton>
          )}
        </Box>{' '}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            onClick={openMenu}
            sx={{
              color: 'white',
              // Remover efectos de focus/active que causan bordes
              '&:focus': {
                outline: 'none',
                boxShadow: 'none',
              },
              '&:active': {
                outline: 'none',
                boxShadow: 'none',
              },
              '&.Mui-focusVisible': {
                outline: 'none',
                boxShadow: 'none',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          sx={{
            '& .MuiPaper-root': {
              backgroundColor: theme.palette.background.paper,
              minWidth: 200,
            },
          }}
        >
          {navigationButtons.map(({ label, ref }) => (
            <MenuItem key={label} onClick={() => handleNavigate(ref)}>
              {label}
            </MenuItem>
          ))}

          {!isLoggedIn && [
            <MenuItem onClick={handleOpenLogin} key="login">
              {authButtons.login || 'Iniciar sesión'}
            </MenuItem>,
            <MenuItem onClick={handleOpenRegister} key="register">
              {authButtons.register || 'Registrarse'}
            </MenuItem>,
          ]}
          {isLoggedIn && (
            <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
          )}
        </Menu>
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={closeProfileMenu}
          sx={{
            '& .MuiPaper-root': {
              backgroundColor: theme.palette.background.paper,
              minWidth: 150,
            },
          }}
        >
          <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>        </Menu>        
        {/* AUTH MODALS */}
        {openLoginModal && (
          <Login open={openLoginModal} onClose={handleCloseLogin} />
        )}
        {openRegisterModal && (
          <Register open={openRegisterModal} onClose={handleCloseRegister} />
        )}
        
        {showContactModal && (
          <ContactModal open={openContactModal} onClose={handleCloseContact} />
        )}
      </Box>
    </Box>
  )
}
