// Dashboard theme core - Solo estilos esenciales para mejor performance
import { createTheme } from '@mui/material/styles'

// Paleta de colores esencial
const brand = {
  50: 'hsl(210, 100%, 95%)',
  400: 'hsl(210, 98%, 48%)',
  500: 'hsl(210, 98%, 42%)',
  600: 'hsl(210, 98%, 55%)',
}

const gray = {
  50: 'hsl(220, 35%, 97%)',
  100: 'hsl(220, 30%, 94%)',
  200: 'hsl(220, 20%, 88%)',
  500: 'hsl(220, 20%, 42%)',
  900: 'hsl(220, 35%, 3%)',
}

// Theme minimalista para ProviderHome
export const dashboardThemeCore = createTheme({
  breakpoints: {
    values: {
      xs: 0,      // 0 – 411px
      sm: 412,    // 412 – 767px
      md: 768,    // 768 – 1699px
      mac: 1280,  // (no estándar, pero puedes usarlo manualmente)
      lg: 1700,   // 1700 – 2159px
      xl: 2160,   // 2160px en adelante
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: brand[500],
      light: brand[400],
      dark: brand[600],
    },
    background: {
      default: gray[400],
      paper: '#ffffff',
    },
    text: {
      primary: gray[900],
      secondary: gray[500],
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'rgba(99, 102, 241, 0.16) 0px 4px 16px',
          },
        },
      },
    },
    // Removido MuiContainer override para mantener padding normal
  },
})
