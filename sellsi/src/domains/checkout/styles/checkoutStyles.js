// ============================================================================
// CHECKOUT THEME STYLES
// ============================================================================

import { alpha } from '@mui/material/styles'

export const checkoutStyles = {
  // Contenedor principal
  container: {
    minHeight: '100vh',
    backgroundColor: 'background.default',
    paddingY: 4
  },

  // Paper principal
  mainPaper: {
    padding: 4,
    borderRadius: 3,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  },

  // Tarjeta de método de pago
  paymentCard: {
    selected: {
      border: '2px solid #2E52B2',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)',
      background: (theme) => alpha(theme.palette.primary.main, 0.05)
    },
    default: {
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    hover: {
      boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
      transform: 'translateY(-2px)'
    }
  },

  // Botones del checkout
  primaryButton: {
    paddingY: 1.5,
    borderRadius: 2,
    fontWeight: 'bold',
    textTransform: 'none',
    boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
    '&:hover': {
      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
    }
  },

  secondaryButton: {
    paddingY: 1.5,
    borderRadius: 2,
    textTransform: 'none',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.04)'
    }
  },

  // Resumen del pedido
  summaryPaper: {
    padding: 3,
    borderRadius: 3,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
    border: '1px solid rgba(102, 126, 234, 0.1)',
    position: 'sticky',
    top: 100,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
  },

  // Información de seguridad
  securityInfo: {
    padding: 2,
    backgroundColor: (theme) => alpha(theme.palette.success.main, 0.1),
    borderRadius: 2,
    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`
  },

  // Información de procesamiento
  processingInfo: {
    padding: 2,
    backgroundColor: (theme) => alpha(theme.palette.info.main, 0.1),
    borderRadius: 2,
    border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`
  },

  // Alerta de error
  errorAlert: {
    borderRadius: 2,
    '& .MuiAlert-icon': {
      fontSize: 20
    }
  },

  // Stepper personalizado
  stepper: {
    '& .MuiStepConnector-root': {
      '& .MuiStepConnector-line': {
        borderColor: '#e0e0e0',
        borderWidth: 2,
        borderRadius: 1
      }
    },
    '& .MuiStepConnector-active .MuiStepConnector-line': {
      borderColor: '#2E52B2'
    },
    '& .MuiStepConnector-completed .MuiStepConnector-line': {
      borderColor: '#4caf50'
    }
  }
}

// Animaciones para Framer Motion
export const checkoutAnimations = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  },

  item: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  },

  paymentCard: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  },

  button: {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  }
}

// Constantes de layout
export const checkoutLayout = {
  maxWidth: 'xl',
  containerPadding: 3,
  sectionSpacing: 4,
  cardSpacing: 2,
  
  // Breakpoints específicos
  breakpoints: {
    mobile: 'xs',
    tablet: 'md',
    desktop: 'lg'
  },

  // Dimensiones
  sidebarWidth: { xs: '100%', lg: '400px' },
  mainContentFlex: 1,
  
  // Espaciado
  spacing: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 6
  }
}
