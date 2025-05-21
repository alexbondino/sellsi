import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme';
import CssBaseline from '@mui/material/CssBaseline';
import TestSupabase from './services/test-supabase';
import BottomBar from './components/BottomBar';
import TopBar from './components/TopBar';
import Home from './pages/Home';

function App() {
  return (
    <ThemeProvider theme={theme}>
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
        < Home />
        <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
          <h1>This is sellsi</h1>
          <TestSupabase />
        </Box>

        <BottomBar />
      </Box>
    </ThemeProvider>
  );
}

export default App;
