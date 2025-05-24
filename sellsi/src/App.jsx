import React, { useEffect, useState, useRef } from 'react'
import { Box, CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import theme from './styles/theme'
import GlobalStyles from '@mui/material/GlobalStyles'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import TestSupabase from './services/test-supabase'
import BottomBar from './components/BottomBar'
import TopBar from './components/TopBar'
import Home from './pages/Home'
import Marketplace from './components/marketplace'
import MarketplaceGPT from './components/marketplace gpt'
import Marketplace4 from './components/marketplace 4'

function App() {
  // Referencias para scroll entre secciones
  const scrollTargets = useRef({})

  const handleScrollTo = (sectionKey) => {
    scrollTargets.current[sectionKey]?.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  // ⚙️ Backend testing
  const [mensaje, setMensaje] = useState('')
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
          body: { overflowX: 'hidden' },
          '#root': { overflowX: 'hidden' },
        }}
      />
      <BrowserRouter>
        {/* Barra superior con scroll dinámico */}
        <TopBar onNavigate={handleScrollTo} />

        <Box
          sx={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pt: '64px', // deja espacio para TopBar fija
            overflowX: 'hidden',
          }}
        >
          {/* Rutas */}
          <Routes>
            <Route path="/" element={<Home scrollTargets={scrollTargets} />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace-gpt" element={<MarketplaceGPT />} />
            <Route path="/marketplace-4" element={<Marketplace4 />} />
          </Routes>

          {/* Zona de pruebas backend */}
          <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
            <h1>This is Sellsi</h1>
            <p>Respuesta del backend:</p>
            <pre>{mensaje}</pre>
            <TestSupabase />
          </Box>

          <BottomBar />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
