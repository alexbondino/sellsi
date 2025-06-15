import React, { useEffect, useState, useRef, Suspense } from 'react'
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
import PrivateRoute from './features/auth/PrivateRoute'
import { BannerProvider, useBanner } from './features/ui/BannerContext'
import Banner from './features/ui/Banner'
import { Toaster } from 'react-hot-toast'
import { supabase } from './services/supabase'
import MarketplaceTopBar from './features/layout/MarketplaceTopBar'
import { usePrefetch } from './hooks/usePrefetch'

// ============================================================================
// 🚀 CODE SPLITTING: LAZY LOADING DE COMPONENTES POR RUTAS
// ============================================================================

// Landing Page (carga inmediata para primera impresión)
import Home from './features/landing_page/Home'

// 📦 RUTAS PRINCIPALES - LAZY LOADING
const MarketplaceBuyer = React.lazy(() => import('./features/buyer/MarketplaceBuyer'))
const Marketplace = React.lazy(() => import('./features/marketplace/Marketplace'))
const BuyerCart = React.lazy(() => import('./features/buyer/BuyerCart'))

// 📦 SUPPLIER DASHBOARD - LAZY LOADING
const ProviderHome = React.lazy(() => import('./features/supplier/home/ProviderHome'))
const MyProducts = React.lazy(() => import('./features/supplier/pages/MyProducts'))
const AddProduct = React.lazy(() => import('./features/supplier/pages/AddProduct'))

// 📦 RUTAS SECUNDARIAS - LAZY LOADING
const BuyerOrders = React.lazy(() => import('./features/buyer/BuyerOrders'))
const BuyerPerformance = React.lazy(() => import('./features/buyer/BuyerPerformance'))
const TechnicalSpecs = React.lazy(() => import('./features/marketplace/view_page/TechnicalSpecs'))

// 📦 AUTH - LAZY LOADING (raramente usados después del primer uso)
const Login = React.lazy(() => import('./features/login/Login'))
const Register = React.lazy(() => import('./features/register/Register'))

// ============================================================================
// 🎨 COMPONENTE DE LOADING UNIVERSAL PARA SUSPENSE
// ============================================================================
const SuspenseLoader = ({ message = "Cargando..." }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
      {message}
    </Box>
  </Box>
)

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

  // 🚀 PREFETCHING: Carga anticipada de rutas probables
  const { prefetchRoute } = usePrefetch()

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

  // 🚀 PREFETCHING INTELIGENTE: Cargar rutas probables según tipo de usuario
  useEffect(() => {
    if (!loadingUserType && session && isBuyer !== null) {
      // Prefetch después de 1.5s para no interferir con la carga inicial
      setTimeout(() => {
        if (isBuyer) {
          // BUYER: Prefetch marketplace y carrito
          prefetchRoute('/buyer/marketplace')
          prefetchRoute('/buyer/cart')
        } else {
          // SUPPLIER: Prefetch dashboard y productos
          prefetchRoute('/supplier/home')
          prefetchRoute('/supplier/myproducts')
        }
      }, 1500)
    }
  }, [loadingUserType, session, isBuyer, prefetchRoute])

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
      >        <Routes>
          {/* 🏠 Landing Page - Carga inmediata para primera impresión */}
          <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
          
          {/* 🛒 MARKETPLACE - Lazy Loading */}
          <Route 
            path="/marketplace" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando marketplace..." />}>
                <Marketplace />
              </Suspense>
            } 
          />
          <Route 
            path="/buyer/marketplace" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando marketplace..." />}>
                <MarketplaceBuyer />
              </Suspense>
            } 
          />
          
          {/* 🛍️ BUYER ROUTES - Lazy Loading */}
          <Route 
            path="/buyer/orders" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando pedidos..." />}>
                <BuyerOrders />
              </Suspense>
            } 
          />
          <Route 
            path="/buyer/performance" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando performance..." />}>
                <BuyerPerformance />
              </Suspense>
            } 
          />
          <Route 
            path="/buyer/cart" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando carrito..." />}>
                <BuyerCart />
              </Suspense>
            } 
          />
          
          {/* 📋 PRODUCT DETAILS - Lazy Loading */}
          <Route
            path="/technicalspecs/:productSlug"
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando producto..." />}>
                <TechnicalSpecs />
              </Suspense>
            }
          />
          
          {/* 🔐 AUTH - Lazy Loading */}
          <Route 
            path="/login" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando..." />}>
                <Login />
              </Suspense>
            } 
          />
          <Route 
            path="/crear-cuenta" 
            element={
              <Suspense fallback={<SuspenseLoader message="Cargando..." />}>
                <Register />
              </Suspense>
            } 
          />
          
          {/* 🏢 SUPPLIER ROUTES - Lazy Loading con Private Routes */}
          <Route
            path="/supplier/home"
            element={
              <PrivateRoute requiredAccountType="proveedor">
                <Suspense fallback={<SuspenseLoader message="Cargando dashboard..." />}>
                  <ProviderHome />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path="/supplier/myproducts"
            element={
              <PrivateRoute requiredAccountType="proveedor">
                <Suspense fallback={<SuspenseLoader message="Cargando productos..." />}>
                  <MyProducts />
                </Suspense>
              </PrivateRoute>
            }
          />
          <Route
            path="/supplier/addproduct"
            element={
              <PrivateRoute requiredAccountType="proveedor">
                <Suspense fallback={<SuspenseLoader message="Cargando formulario..." />}>
                  <AddProduct />
                </Suspense>
              </PrivateRoute>
            }
          />
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
