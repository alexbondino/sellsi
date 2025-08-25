import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0, // 0 – 411px → Teléfonos muy pequeños
      sm: 412, // 412 – 767px → Teléfonos grandes
      md: 768, // 768 – 1919px → Tablets y laptops pequeñas/medianas
      mac: 1280,
      lg: 1700, // Full HD
      xl: 2160, // 1200p y resoluciones superiores
    },
  },
  palette: {
    primary: { main: '#1565c0' }, // Azul Sellsi
    secondary: { main: '#2e2e2e' },
    bars: { main: '#2e2e2e' },
    background: { default: '#f9f9f9' },
    box_backgroud: { primary: '#E7E7E7', secondary: 'white' },
    text: { primary: '#1A1A1A', secondary: '#7A7A7A' },
    common: {
      white: '#ffffff',
      black: '#000000',
    },
  },
  typography: {
    fontFamily:
      'Lato, "Proxima Nova", -apple-system, "Helvetica Neue", helvetica, roboto, arial, sans-serif',

    h1: {
      fontFamily: 'Inter, sans-serif', // ✅ fuente Inter
      fontWeight: 'bold',
      fontSize: '45px',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'Inter, sans-serif', // ✅ fuente Inter
      fontSize: '25px', // ✅ tamaño 25px
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    body1: { fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 'bold' },
  },
});

export default theme;
