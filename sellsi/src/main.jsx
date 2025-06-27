import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'

// Cargar herramientas de emergencia en desarrollo
if (import.meta.env.DEV) {
  import('./utils/cartEmergencyTools.js');
}

const theme = createTheme({})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
)
