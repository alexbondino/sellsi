import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0, // 0 – 375px → Teléfonos muy pequeños (iPhone SE 375x667)
      sm: 412, // 412 – 767px → Teléfonos grandes / (GALAXY A50 series 412*914)
      md: 768, // 768 – 1079px → Tablets y laptops pequeñas (Ipad Mini 768x1024)
      lg: 1080, // 1080 – 1439px → Laptops medianas y escritorios estándar (Full HD 1080x1920 MUY IMPORTANTE)
      xl: 1920, // 1920px en adelante → Pantallas grandes y 4K (Full HD+ 1920x1080, 4K 2160x3840)
    },
  },
  palette: {
    primary: { main: '#007ACC' },
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
      '"Proxima Nova", -apple-system, "Helvetica Neue", helvetica, roboto, arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    body1: { fontSize: '1rem' },
    button: { textTransform: 'none', fontWeight: 'bold' },
  },
})

export default theme
