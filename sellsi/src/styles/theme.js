// 📁 theme.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  breakpoints: {
    values: {
      xs: 0, // Telefonos Chicos
      sm: 412, // Telefonos grandes
      mini: 576, // Tablets
      md: 768, // ??
      mac: 1280, //  Mac M1
      lg: 1700, // 1080p
      xl: 2160, // 2K
    },
  },
  palette: {
    primary: { main: '#2E52B2' }, // Azul Sellsi
    secondary: { main: '#2e2e2e', borderColor: '#FFFFFF' },
    bars: { main: '#2e2e2e' },
    background: { default: '#f9f9f9' },
    box_backgroud: { primary: '#E7E7E7', secondary: 'white' },
    text: { primary: '#1A1A1A', secondary: '#7A7A7A' },
    common: { white: '#ffffff', black: '#000000' },
  },
  typography: {
    fontFamily:
      'Lato, "Proxima Nova", -apple-system, "Helvetica Neue", helvetica, roboto, arial, sans-serif',

    h1: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 'bold',
      fontSize: 45, // tamaño base; RFS lo ajustará por breakpoints
      lineHeight: 1.2, // unitless para mejor alineación con RFS
    },
    h2: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 40,
      fontWeight: 'bold',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: 25,
      lineHeight: 1.3,
    },
    body1: { fontSize: 16, lineHeight: 1.6 },
    button: {
      textTransform: 'none',
      fontWeight: 'bold',
      lineHeight: 1.2,
      height: '40px',
    },

    // 🎯 Nuevo variant para bullets
    bullet: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 20,
      lineHeight: 1.4,
      color: '#1A1A1A',
    },
  },
  components: {
    MuiTypography: {
      variants: [
        {
          props: { variant: 'bullet' },
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: 20,
            lineHeight: 1.4,
            color: '#1A1A1A',
          },
        },
      ],
    },
  },
});

// 🔮 Aplica escalado tipográfico responsivo (incluye tu breakpoint "mac")
theme = responsiveFontSizes(theme, {
  // orden de breakpoints donde se generarán los ajustes
  breakpoints: ['sm', 'md', 'mac', 'lg', 'xl'],
  // >1: cuanto mayor, MENOR diferencia entre tamaños (más suave)
  factor: 2,
  // mantener alineación a grilla de 4px (mejor con lineHeight unitless)
  disableAlign: false,
  // incluye tu variante personalizada "bullet"
  variants: ['h1', 'h2', 'h3', 'body1', 'button', 'bullet'],
});

export default theme;
