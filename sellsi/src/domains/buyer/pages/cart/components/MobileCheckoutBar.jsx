import React from 'react';
import {
  Paper,
  Box,
  Stack,
  Typography,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  ShoppingCart as CartIcon,
  Lock as LockIcon
} from '@mui/icons-material';

const MobileCheckoutBar = ({ 
  total, 
  itemCount = 0, 
  onCheckout, 
  isLoading = false,
  variant = 'cart', // 'cart' | 'payment'
  formatPrice,
  disabled = false
}) => {
  const buttonText = variant === 'cart' ? 'Continuar' : 'Confirmar Pago';
  const loadingText = variant === 'cart' ? 'Cargando...' : 'Procesando...';

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 83, // Posicionar justo encima de MobileBar con 4px de separación
        left: 0,
        right: 0,
  zIndex: 1500, // Mayor que MobileBar (1400) para que la barra de checkout esté encima
        backgroundColor: 'background.paper',
        borderTop: '2px solid',
        borderColor: 'primary.main',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.25)'
      }}
    >
      <Box sx={{ 
  // Expandir completamente en mobile sin maxWidth implícito
  p: { xs: 1.1, sm: 1.4 },
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  width: '100%'
      }}>
        {/* Info precio */}
        <Stack flex={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
            {itemCount > 0 && (
              <Chip
                label={`${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`}
                size="small"
                variant="outlined"
                sx={{ 
                  height: 20,
                  fontSize: '0.65rem',
                  color: 'text.secondary',
                  borderColor: 'text.secondary'
                }}
              />
            )}
          </Stack>
          <Typography 
            variant="h6" 
            fontWeight={700}
            sx={{ lineHeight: 1.2, fontSize: { xs: '1.05rem', sm: '1.15rem' } }}
          >
            {formatPrice(total || 0)}
          </Typography>
        </Stack>
        
        {/* CTA Principal */}
        <Button
          variant="contained"
          size="large"
          onClick={onCheckout}
          disabled={isLoading || disabled || total <= 0}
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : variant === 'cart' ? (
              <CartIcon />
            ) : (
              <CreditCardIcon />
            )
          }
          sx={{
            minWidth: { xs: 140, sm: 160 },
            py: { xs: 1.2, sm: 1.5 },
            borderRadius: 3,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: { xs: '0.95rem', sm: '1rem' },
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
            },
            '&:disabled': {
              backgroundColor: 'action.disabled',
              color: 'action.disabled',
              boxShadow: 'none'
            }
          }}
        >
          {isLoading ? loadingText : buttonText}
        </Button>
      </Box>
      
      {/* Indicador de seguridad */}
      {variant === 'payment' && (
        <Box sx={{ 
          px: 2, 
          pb: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0.5
        }}>
          <LockIcon sx={{ fontSize: 12, color: 'success.main' }} />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Pago 100% seguro
          </Typography>
        </Box>
      )}
      
      {/* Safe area para iOS - espacio adicional en dispositivos con home indicator */}
      <Box 
        sx={{ 
          height: 'env(safe-area-inset-bottom, 0px)',
          minHeight: { xs: 8, sm: 0 } // Fallback para dispositivos que no soportan env()
        }} 
      />
    </Paper>
  );
};

export default MobileCheckoutBar;
