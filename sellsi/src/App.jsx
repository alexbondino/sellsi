import { Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import theme from './styles/theme'
import CssBaseline from '@mui/material/CssBaseline'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TestSupabase from './services/test-supabase'
import BottomBar from './components/BottomBar'
import TopBar from './components/TopBar'
import Home from './pages/Home'
import Marketplace from './components/marketplace'
import MarketplaceGPT from './components/marketplace gpt'
import Marketplace4 from './components/marketplace 4'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <TopBar />
        <Box
          sx={{
            width: '100vw',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace-gpt" element={<MarketplaceGPT />} />
            <Route path="/marketplace-4" element={<Marketplace4 />} />
          </Routes>
          <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
            <h1>This is sellsi</h1>
            <TestSupabase />
          </Box>

          <BottomBar />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
