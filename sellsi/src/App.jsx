import { Box } from '@mui/material';
import TestSupabase from './services/test-supabase';
import BottomBar from './components/BottomBar';

function App() {
  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ flexGrow: 1, textAlign: 'center', py: 4 }}>
        <h1>This is sellsi</h1>
        <TestSupabase />
      </Box>

      <BottomBar />
    </Box>
  );
}

export default App;
