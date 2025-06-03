import React, { useEffect, useState, useRef } from 'react'
import { Box, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import GlobalStyles from '@mui/material/GlobalStyles'
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import theme from './styles/theme'
import TopBar from './components/TopBar'
import BottomBar from './components/BottomBar'
import Home from './pages/Home'
import ProviderHome from './pages/provider/ProviderHome'
import FichaTecnica from './pages/FichaTecnica'
import TestSupabase from './services/test-supabase'
import Marketplace from './pages/Marketplace'
import Login from './components/Login'
import Register from './components/Register'
import { testConnection } from './services/supabase'
import { BannerProvider, useBanner } from './contexts/BannerContext'
import { Banner } from './hooks/shared'

function AppContent({ mensaje, supabaseStatus }) {
  const location = useLocation()
  const navigate = useNavigate()
  const scrollTargets = useRef({})
  const { bannerState, hideBanner } = useBanner()

  const handleScrollTo = (refName) => {
    const element = scrollTargets.current[refName]?.current
    if (element) {
      const topBarHeight = 30 // ✅ Altura de la TopBar + margen
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - topBarHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('supplierid')
    if (isLoggedIn && location.pathname === '/') {
      navigate('/supplier/home', { replace: true })
    }
  }, [location.pathname, navigate])

  // ✅ EFECTO PARA CERRAR MODALES EN NAVEGACIÓN DEL NAVEGADOR
  useEffect(() => {
    const handlePopstate = () => {
      // Cerrar cualquier modal abierto cuando se usa botón atrás/adelante
      const event = new CustomEvent('closeAllModals')
      window.dispatchEvent(event)
    }

    // Escuchar eventos de navegación del navegador (botón atrás/adelante)
    window.addEventListener('popstate', handlePopstate)

    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  const needsPadding = true
  const showTopBar = true // ✅ MOSTRAR SIEMPRE
  const showBottomBar = location.pathname !== '/supplier/home'
  return (
    <>
      {showTopBar && <TopBar onNavigate={handleScrollTo} />}

      {/* Banner global */}
      <Banner
        message={bannerState.message}
        severity={bannerState.severity}
        duration={bannerState.duration}
        show={bannerState.show}
        onClose={hideBanner}
      />

      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pt: needsPadding ? '64px' : 0,
          overflowX: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {' '}
        <Routes>
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/fichatecnica/:productSlug" element={<FichaTecnica />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<Register />} />
          <Route path="/supplier/home" element={<ProviderHome />} />
        </Routes>
        {process.env.NODE_ENV === 'development' &&
          location.pathname === '/' && (
            <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <h1>This is Sellsi</h1>
              <p>Respuesta del backend:</p>
              <pre>{mensaje}</pre>

              <p>
                Supabase Status:
                <span
                  style={{
                    color: supabaseStatus === 'connected' ? 'green' : 'red',
                    fontWeight: 'bold',
                  }}
                >
                  {supabaseStatus === 'connected'
                    ? ' ✅ Conectado'
                    : ' ❌ Error'}
                </span>
              </p>

              {/* ✅ COMPONENTE DE TEST: */}
              <TestSupabase />
            </Box>
          )}
        {showBottomBar && <BottomBar />}
      </Box>
    </>
  )
}

function App() {
  const [mensaje, setMensaje] = useState('Cargando...')
  const [supabaseStatus, setSupabaseStatus] = useState('testing')
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/`)
        const data = await res.json()
        setMensaje(JSON.stringify(data))
        console.log('✅ Backend conectado:', data)

        // Test Supabase connection
        const supabaseResult = await testConnection()
        setSupabaseStatus(supabaseResult.success ? 'connected' : 'error')
      } catch (error) {
        console.error('❌ Error al conectar con backend:', error)
        setMensaje('No se pudo conectar con el backend.')
        setSupabaseStatus('error')
      }
    }

    fetchBackend()
  }, [backendUrl])
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />{' '}
      <GlobalStyles
        styles={{
          html: { overflowX: 'hidden' },
          body: {
            overflowX: 'hidden',
            margin: 0,
            // ✅ SOLUCIÓN: Prevenir scroll automático cuando se abren popovers
            scrollBehavior: 'smooth',
          },
          '#root': {
            overflowX: 'hidden',
            // ✅ SOLUCIÓN: Mantener posición estable del contenedor principal
            position: 'relative',
          },
          // ✅ SOLUCIÓN: Estilos específicos para popovers para prevenir displacement
          '.MuiPopover-root': {
            '& .MuiBackdrop-root': {
              backgroundColor: 'transparent', // Sin backdrop para evitar cambios visuales
            },
          },
        }}
      />
      <BrowserRouter>
        <BannerProvider>
          <AppContent mensaje={mensaje} supabaseStatus={supabaseStatus} />
        </BannerProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
