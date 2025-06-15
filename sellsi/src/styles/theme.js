import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0, // 0 – 411px → Teléfonos muy pequeños (iPhone SE 375x667)
      sm: 412, // 412 – 767px → Teléfonos grandes (GALAXY A50 series 412x914)
      md: 768, // 768 – 1919px → Tablets y laptops pequeñas/medianas (incluye tu 1600x900)
      lg: 1700, // 1920 – 2159px → Full HD 1080p (1920x1080)
      xl: 2160, // 2160px en adelante → 1200p y resoluciones superiores (1920x1200, 4K, etc.)
    },
  },
  palette: {
    primary: { main: '#1565c0' },
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
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    body1: { fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 'bold' },
  },
})

export default theme
