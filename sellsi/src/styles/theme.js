import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#007ACC' },
    secondary: { main: '#2e2e2e' },
    bars: { main: '#2e2e2e' },
    background: { default: '#f9f9f9' },
    box_backgroud: { primary: '#E7E7E7', secondary: 'white' },
    text: { primary: '#1A1A1A', secondary: '#7A7A7A' },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    body1: { fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 'bold' },
  },

  palette: {
    primary: { main: '#007ACC' },
    bars: { main: '#2e2e2e' },
    common: {
      white: '#ffffff',
      black: '#000000',
    },
  },
});

export default theme;
