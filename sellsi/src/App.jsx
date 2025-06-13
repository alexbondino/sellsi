import React, { useEffect, useState, useRef } from 'react'
import { Box, CssBaseline, CircularProgress } from '@mui/material'
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
import TopBar from './features/layout/TopBar'
import BottomBar from './features/layout/BottomBar'
import Home from './features/landing_page/Home'
import ProviderHome from './features/supplier/home/ProviderHome'
import MyProducts from './features/supplier/pages/MyProducts'
import AddProduct from './features/supplier/pages/AddProduct'
import TechnicalSpecs from './features/marketplace/view_page/TechnicalSpecs'
import Marketplace from './features/marketplace/Marketplace'
import MarketplaceBuyer from './features/buyer/MarketplaceBuyer'
import BuyerOrders from './features/buyer/BuyerOrders'
import BuyerPerformance from './features/buyer/BuyerPerformance'
import BuyerCart from './features/buyer/BuyerCart'
import Login from './features/login/Login'
import Register from './features/register/Register'
import PrivateRoute from './features/auth/PrivateRoute'
import { BannerProvider, useBanner } from './features/ui/BannerContext'
import Banner from './features/ui/Banner'
import { Toaster } from 'react-hot-toast'
import { supabase } from './services/supabase'
import MarketplaceTopBar from './features/layout/MarketplaceTopBar'

// Contenido principal que depende de la ruta
function AppContent({ mensaje }) {
  const location = useLocation()
  const navigate = useNavigate()
  const scrollTargets = useRef({})
  const { bannerState, hideBanner } = useBanner()
  const [session, setSession] = useState(null)
  const [isBuyer, setIsBuyer] = useState(null)
  const [loadingUserType, setLoadingUserType] = useState(true)
  const lastUserType = useRef(null)

  // Escuchar cambios de sesión en tiempo real
  useEffect(() => {
    let mounted = true
    setLoadingUserType(true)
    setIsBuyer(null) // Siempre reiniciar a null al iniciar la consulta
    const getUserType = async (currentSession) => {
      if (!currentSession || !currentSession.user) {
        if (mounted) {
          setIsBuyer(null)
          setLoadingUserType(false)
        }
        return
      }
      const result = await supabase
        .from('users')
        .select('main_supplier')
        .eq('user_id', currentSession.user.id)
        .single()
      const userData = result.data
      const userError = result.error
      if (userError) {
        if (mounted) {
          setIsBuyer(null)
        }
      } else {
        if (mounted) {
          if (userData && typeof userData.main_supplier === 'boolean') {
            setIsBuyer(userData.main_supplier === false)
          } else {
            setIsBuyer(null)
          }
        }
      }
      if (mounted) setLoadingUserType(false)
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      getUserType(data.session)
    })

    // Suscribirse a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
        getUserType(newSession)
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Redirección tras login: solo si la ruta es neutra y el tipo de usuario ya está determinado
  useEffect(() => {
    if (!loadingUserType && session && isBuyer !== null) {
      const neutralRoutes = ['/', '/login', '/crear-cuenta', '/supplier/home']
      if (neutralRoutes.includes(location.pathname)) {
        if (isBuyer && location.pathname !== '/buyer/marketplace') {
          navigate('/buyer/marketplace', { replace: true })
        } else if (!isBuyer && location.pathname !== '/supplier/home') {
          navigate('/supplier/home', { replace: true })
        }
      }
    }
  }, [loadingUserType, session, location.pathname, navigate, isBuyer])

  useEffect(() => {
    const handlePopstate = () => {
      const event = new CustomEvent('closeAllModals')
      window.dispatchEvent(event)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  const handleScrollTo = (refName) => {
    const element = scrollTargets.current[refName]?.current
    if (element) {
      const topBarHeight = 30
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - topBarHeight
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  const needsPadding = true
  const showTopBar = !isBuyer
  const showBottomBar = location.pathname !== '/supplier/home'

  // Centralizar la lógica de tipo de usuario y barra
  useEffect(() => {
    let mounted = true
    const isBuyerRoute = location.pathname.startsWith('/buyer')
    const isSupplierRoute = location.pathname.startsWith('/supplier')
    // Si el tipo de usuario no cambia y la sesión es la misma, no mostrar loading
    if (
      lastUserType.current !== null &&
      ((isBuyerRoute && lastUserType.current === 'buyer') ||
        (isSupplierRoute && lastUserType.current === 'supplier'))
    ) {
      setLoadingUserType(false)
      return
    }
    setLoadingUserType(true)
    const checkUserType = async () => {
      if (!session || !session.user) {
        if (mounted) {
          setIsBuyer(null)
          setLoadingUserType(false)
          lastUserType.current = null
        }
        return
      }
      if (isSupplierRoute) {
        // Si estamos en /supplier/home, consultar main_supplier para decidir
        const { data: userData } = await supabase
          .from('users')
          .select('main_supplier')
          .eq('user_id', session.user.id)
          .single()
        if (mounted) {
          if (userData && userData.main_supplier === false) {
            // Es buyer, no forzar supplier, dejar que la redirección lo saque
            setIsBuyer(true)
            setLoadingUserType(false)
            lastUserType.current = 'buyer'
          } else if (userData && userData.main_supplier === true) {
            setIsBuyer(false)
            setLoadingUserType(false)
            lastUserType.current = 'supplier'
          } else {
            setIsBuyer(null)
            setLoadingUserType(false)
            lastUserType.current = null
          }
        }
        return
      }
      if (isBuyerRoute) {
        const { data: userData } = await supabase
          .from('users')
          .select('main_supplier')
          .eq('user_id', session.user.id)
          .single()
        if (mounted) {
          const isBuyerNow = userData && userData.main_supplier === false
          setIsBuyer(isBuyerNow)
          setLoadingUserType(false)
          lastUserType.current = isBuyerNow ? 'buyer' : 'supplier'
        }
        return
      }
      if (mounted) {
        setIsBuyer(null)
        setLoadingUserType(false)
        lastUserType.current = null
      }
    }
    checkUserType()
    return () => {
      mounted = false
    }
  }, [session, location.pathname])

  // Loading global: solo mientras loadingUserType es true
  if (loadingUserType) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 99999,
        }}
      >
        <CircularProgress size={48} color="primary" />
      </Box>
    )
  }

  // Render de barras: MarketplaceTopBar solo para buyers logueados, TopBar para suppliers logueados o visitantes
  return (
    <>
      {/* Topbars */}
      {session && isBuyer === true && <MarketplaceTopBar />}
      {(!session || isBuyer === false) && (
        <TopBar onNavigate={handleScrollTo} />
      )}

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
        <Routes>
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/buyer/marketplace" element={<MarketplaceBuyer />} />
          <Route path="/buyer/orders" element={<BuyerOrders />} />
          <Route path="/buyer/performance" element={<BuyerPerformance />} />
          <Route path="/buyer/cart" element={<BuyerCart />} />
          <Route
            path="/technicalspecs/:productSlug"
            element={<TechnicalSpecs />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-cuenta" element={<Register />} />
          {/* Solo renderizar rutas supplier si el usuario es supplier */}
          {session && isBuyer === false && (
            <>
              <Route
                path="/supplier/home"
                element={
                  <PrivateRoute requiredAccountType="proveedor">
                    <ProviderHome />
                  </PrivateRoute>
                }
              />
              <Route
                path="/supplier/myproducts"
                element={
                  <PrivateRoute requiredAccountType="proveedor">
                    <MyProducts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/supplier/addproduct"
                element={
                  <PrivateRoute requiredAccountType="proveedor">
                    <AddProduct />
                  </PrivateRoute>
                }
              />
            </>
          )}
        </Routes>

        {process.env.NODE_ENV === 'development' &&
          location.pathname === '/' && (
            <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
              <h1>This is Sellsi</h1>
              <p>Respuesta del backend:</p>
              <pre>{mensaje}</pre>
            </Box>
          )}

        {showBottomBar && <BottomBar />}
      </Box>
    </>
  )
}

// Componente principal que monta el contenido y aplica estilos globales
function App() {
  const [mensaje, setMensaje] = useState('Cargando...')
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const res = await fetch(`${backendUrl}/`)
        const data = await res.json()
        setMensaje(JSON.stringify(data))
      } catch (error) {
        console.error('❌ Error al conectar con backend:', error)
        setMensaje('No se pudo conectar con el backend.')
      }
    }

    fetchBackend()
  }, [backendUrl])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          html: { overflowX: 'hidden' },
          body: {
            overflowX: 'hidden',
            margin: 0,
            scrollBehavior: 'smooth',
          },
          '#root': {
            overflowX: 'hidden',
            position: 'relative',
          },
          '.MuiPopover-root': {
            '& .MuiBackdrop-root': {
              backgroundColor: 'transparent',
            },
          },
        }}
      />
      <BannerProvider>
        <BrowserRouter>
          <AppContent mensaje={mensaje} />
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              style: {
                background: '#4caf50',
              },
            },
            error: {
              style: {
                background: '#f44336',
              },
            },
          }}
        />
      </BannerProvider>
    </ThemeProvider>
  )
}

export default App
