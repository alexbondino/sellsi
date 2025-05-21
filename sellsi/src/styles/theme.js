import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#007ACC' }, // Colores de botones primarios
    secondary: { main: '#2e2e2e' }, // Colores de botones secundarios
    bars: { main: '#2e2e2e' }, // Colores de barras (Top y Bottom)
    background: { default: '#f9f9f9' }, // Color de fondo de la app
    box_backgroud: {primary: '#E7E7E7', secondary: 'white'},
    text: { black:'#1A1A1A', white: '#ffffff'}, // Colores de texto custom

  },
  typography: {
    fontFamily: 'Arial, sans-serif', // Fuente
    h1: { fontWeight: 700, fontSize: '2.5rem' }, // Heading1
    h2: { fontWeight: 600, fontSize: '2rem' }, // Heading2
    h3: { fontWeight: 600, fontSize: '1.75rem' }, // Heading3
    body1: { fontSize: '1rem' }, // Cuerpo del texto
    button: { textTransform: 'none', fontWeight:'bold' }, 
  },
});

export default theme;