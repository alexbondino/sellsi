import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'

// Importar componentes del panel admin
import AdminLogin from './domains/admin/components/AdminLogin'
import AdminGuard from './domains/admin/components/AdminGuard'
import AdminPanelHome from './domains/admin/pages/AdminPanelHome'
import AdminDashboard from './domains/admin/components/AdminDashboard'
import AdminMetrics from './domains/admin/pages/AdminMetrics'
import FirstAdminSetup from './domains/admin/components/FirstAdminSetup'

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
        </Router>
        
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
