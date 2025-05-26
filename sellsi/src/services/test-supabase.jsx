import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom' // ✅ AGREGAR useNavigate
import { Box, Typography, Button, Paper, Alert } from '@mui/material'
  AppBar,testConnection, testAuth, supabase } from './supabase'
  Toolbar,
  Typography,abase = () => {
  Button,connectionStatus, setConnectionStatus] = useState('testing')
  Box,t [authStatus, setAuthStatus] = useState('testing')
  IconButton,lts, setResults] = useState({})
  Menu,
  MenuItem,(() => {
  useTheme,s()
  useMediaQuery,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

// Importar componentes de diálogo
import Login from './Login'sting')
import Register from './Register'Connection()
    setConnectionStatus(connResult.success ? 'success' : 'error')
export default function TopBar({ onNavigate }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate() // ✅ AHORA FUNCIONA
  const location = useLocation() // ✅ AGREGAR para detectar cambios de ruta

  const [menuAnchor, setMenuAnchor] = useState(null)
  const [profileAnchor, setProfileAnchor] = useState(null)
  const [openLoginModal, setOpenLoginModal] = useState(false)
  const [openRegisterModal, setOpenRegisterModal] = useState(false)
      url: import.meta.env.VITE_SUPABASE_URL,
  const isLoggedIn = !!localStorage.getItem('supplierid')
    })
  // ✅ CERRAR MODALES AL CAMBIAR DE RUTA
  useEffect(() => {
    setOpenLoginModal(false)atus) => {
    setOpenRegisterModal(false)
    setMenuAnchor(null)
    setProfileAnchor(null)
  }, [location.pathname]) // ❌ ESTE ES EL CULPABLE
        return 'error'
  const openMenu = (e) => setMenuAnchor(e.currentTarget)
  const closeMenu = () => setMenuAnchor(null)
      default:
  const openProfileMenu = (e) => setProfileAnchor(e.currentTarget)
  const closeProfileMenu = () => setProfileAnchor(null)
  }
  const handleLogout = () => {
    localStorage.removeItem('supplierid')
    closeProfileMenu()
    navigate('/')ss':
  }     return '✅ Conectado'
      case 'error':
  const handleOpenLogin = () => {
    setOpenLoginModal(true)
    closeMenu()'⚠️ Advertencia'
  }   default:
        return '🔄 Probando...'
  const handleOpenRegister = () => {
    setOpenRegisterModal(true)
    closeMenu()
  }eturn (
    <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: 600, mx: 'auto' }}>
  const handleCloseLogin = () => setOpenLoginModal(false)00 }}>
  const handleCloseRegister = () => setOpenRegisterModal(false)
      </Typography>
  const sectionsMap = {
    'Quiénes somos': 'quienesSomosRef',
    Servicios: 'serviciosRef',
    Contáctanos: 'contactanosRef',">
  }       <strong>URL:</strong> {results.url || 'No configurada'}
        </Typography>
  const handleNavigate = (ref) => {>
    closeMenu()ng>API Key:</strong>{' '}
    onNavigate(ref)hasKey ? '✅ Configurada' : '❌ Faltante'}
  }     </Typography>
      </Box>
  const handleGoHome = () => {
    navigate('/')ion Test */}
  }   <Alert severity={getStatusColor(connectionStatus)} sx={{ mb: 1 }}>
        <strong>Database Connection:</strong> {getStatusText(connectionStatus)}
  return (esults.connection?.error && (
    <Box  <Typography variant="body2" sx={{ mt: 1 }}>
      sx={{ Error: {results.connection.error}
        backgroundColor: theme.palette.bars?.main || '#1976d2',
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center',olor(authStatus)} sx={{ mb: 2 }}>
        position: 'fixed',tion:</strong> {getStatusText(authStatus)}
        top: 0,s.auth?.user && (
        zIndex: 1100, variant="body2" sx={{ mt: 1 }}>
        overflowX: 'hidden',s.auth.user.email || 'Sin email'}
        height: { xs: 56, md: 64 },
      }})}
    > </Alert>
      <Box
        sx={{ry Button */}
          width: '100%',utlined" onClick={runTests} sx={{ width: '100%' }}>
          maxWidth: '1200px',
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center', 'development' && (
        }}ox sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      >   <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
        {/* Logo y navegación */}strong>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Boxvironment: {import.meta.env.MODE}
            component="button"
            onClick={handleGoHome}meta.env.VITE_SUPABASE_URL?.substring(0, 30)}
            sx={{
              background: 'none',
              border: 'none',t.meta.env.VITE_SUPABASE_ANON_KEY}
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                opacity: 0.8,
                transform: 'scale(1.05)',
              },estSupabase
              transition: 'all 0.2s ease',            }}          >            <img              src="/logo.svg"              alt="SELLSI Logo"              style={{ height: 28, maxWidth: '120px', flexShrink: 0 }}            />          </Box>          {!isMobile && !isLoggedIn && (            <Box sx={{ display: 'flex', gap: 3 }}>              {Object.entries(sectionsMap).map(([label, ref]) => (                <Button                  key={ref}                  onClick={() => handleNavigate(ref)}                  color="inherit"                  sx={{                    fontWeight: 'bold',                    color: 'white',                  }}                >                  {label}                </Button>              ))}            </Box>          )}        </Box>        {/* Botones o perfil */}        {isMobile ? (          <>            <IconButton onClick={openMenu} sx={{ color: 'white', p: 1 }}>              <MenuIcon fontSize="large" />            </IconButton>            <Menu              anchorEl={menuAnchor}              open={Boolean(menuAnchor)}              onClose={closeMenu}              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}              transformOrigin={{ vertical: 'top', horizontal: 'right' }}              PaperProps={{ sx: { maxWidth: '90vw', overflowX: 'hidden' } }}            >              <MenuItem onClick={handleGoHome}>Inicio</MenuItem>              {!isLoggedIn &&                Object.entries(sectionsMap).map(([label, ref]) => (                  <MenuItem key={ref} onClick={() => handleNavigate(ref)}>                    {label}                  </MenuItem>                ))}              {!isLoggedIn ? (                <>                  <MenuItem onClick={handleOpenLogin}>Iniciar sesión</MenuItem>                  <MenuItem onClick={handleOpenRegister}>Registrarse</MenuItem>                </>              ) : (                <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>              )}            </Menu>          </>        ) : isLoggedIn ? (          <>            <IconButton onClick={openProfileMenu} sx={{ color: 'white' }}>              <AccountCircleIcon fontSize="large" />            </IconButton>            <Menu              anchorEl={profileAnchor}              open={Boolean(profileAnchor)}              onClose={closeProfileMenu}              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}              transformOrigin={{ vertical: 'top', horizontal: 'right' }}            >              <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>            </Menu>          </>        ) : (          <Box sx={{ display: 'flex', gap: 1 }}>            <Button              variant="contained"              onClick={handleOpenLogin}              sx={{                backgroundColor: '#1976d2',                color: 'white',                fontWeight: 'bold',                '&:hover': {                  backgroundColor: '#1565c0',                },              }}            >              Iniciar sesión            </Button>            <Button              variant="outlined"              onClick={handleOpenRegister}              sx={{                color: 'white',                borderColor: 'white',                fontWeight: 'bold',                '&:hover': {                  backgroundColor: 'rgba(255,255,255,0.1)',                  borderColor: 'white',                },              }}            >              Registrarse            </Button>          </Box>        )}      </Box>      {/* Modal de Login */}      <Login        open={openLoginModal}        onClose={handleCloseLogin}        onOpenRegister={() => {          handleCloseLogin()          handleOpenRegister()        }}      />      {/* Modal de Registro */}      {openRegisterModal && (        <Register open={openRegisterModal} onClose={handleCloseRegister} />      )}    </Box>  )}