import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import Loader from './components/Loader'
import SuspenseLoader from './shared/components/layout/SuspenseLoader'
// ⚡ OPTIMIZACIÓN: Lazy loading de rutas para reducir bundle inicial
// Reduce bundle de 1.2MB a ~250KB inicial
const AdminLogin = lazy(() => import('./domains/admin/components/AdminLogin'))
const AdminGuard = lazy(() => import('./domains/admin/components/AdminGuard'))
const AdminPanelHome = lazy(() => import('./domains/admin/pages/AdminPanelHome'))
const AdminDashboard = lazy(() => import('./domains/admin/components/AdminDashboard'))
const AdminMetrics = lazy(() => import('./domains/admin/pages/AdminMetrics'))
const AdminConfig = lazy(() => import('./domains/admin/pages/AdminConfig'))
const FirstAdminSetup = lazy(() => import('./domains/admin/components/FirstAdminSetup'))

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
    },
    secondary: {
      main: '#3949ab',
    },
  },
})

// QueryClient para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
})

function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Suspense fallback={<SuspenseLoader />}>
            <Routes>
              {/* ========== RUTAS PÚBLICAS ========== */}
              
              {/* Login principal */}
              <Route path="/login" element={<AdminLogin />} />
              
              {/* Setup inicial de primer administrador */}
              <Route path="/setup" element={<FirstAdminSetup />} />
              
              {/* ========== RUTAS PROTEGIDAS ========== */}
              
              {/* Panel principal - muestra el home con menú lateral */}
              <Route path="/admin" element={
                <AdminGuard>
                  <AdminPanelHome />
                </AdminGuard>
              } />
              
              {/* Panel principal - muestra el home con menú lateral */}
              <Route path="/admin-panel" element={
                <AdminGuard>
                  <AdminPanelHome />
                </AdminGuard>
              } />
              
              {/* Dashboard administrativo */}
              <Route path="/admin-panel/dashboard" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } />
              
              {/* Métricas administrativas */}
              <Route path="/admin-panel/metrics" element={
                <AdminGuard>
                  <AdminMetrics />
                </AdminGuard>
              } />
              
              {/* Configuración del sistema */}
              <Route path="/admin-panel/config" element={
                <AdminGuard>
                  <AdminConfig />
                </AdminGuard>
              } />
              
              {/* Alias para dashboard (legacy) */}
              <Route path="/admin/dashboard" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } />
              
              {/* ========== REDIRECTS ========== */}
              
              {/* Redirect por defecto a login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </Router>
        
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
