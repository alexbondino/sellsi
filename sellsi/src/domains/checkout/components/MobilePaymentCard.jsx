import React from 'react';
import {
  Card,
  Box,
  Stack,
  Typography,
  Radio,
  Alert,
  Avatar
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';

const MobilePaymentCard = ({ 
  method, 
  isSelected, 
  onSelect, 
  formatPrice 
}) => {
  // Icon mapping
  const getMethodIcon = (methodId) => {
    switch(methodId) {
      case 'khipu':
        return null; // handled specially to render SVG image
      case 'credit-card':
        return <CreditCardIcon />;
      case 'bank-transfer':
        return <BankIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  return (
  <Card
      elevation={isSelected ? 4 : 1}
      onClick={() => onSelect(method.id)}
      sx={{
        cursor: 'pointer',
        border: isSelected ? '1.8px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.08)',
    borderRadius: { xs: 1.5, sm: 2.5 },
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-1px)'
        },
        backgroundColor: isSelected ? 'primary.light' : 'background.paper'
      }}
    >
  <Box sx={{ py: { xs: 0.55, sm: 0.95 }, px: { xs: 0.5, sm: 0.9 } }}>
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
          {/* Method Icon */}
          <Box
            sx={{
              width: { xs: 46, sm: 50 },
              height: { xs: 46, sm: 50 },
              borderRadius: 2,
              backgroundColor: isSelected ? 'primary.main' : 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.25s ease'
            }}
          >
            {method.id === 'khipu' ? (
              <Box component="img" src={method.icon || '/Checkout/khipu.svg'} alt="khipu" sx={{ width: 28, height: 28 }} />
            ) : (
              React.cloneElement(getMethodIcon(method.id), {
                sx: { 
                  color: isSelected ? 'white' : 'text.secondary',
                  fontSize: 28
                }
              })
            )}
          </Box>
          
          {/* Method Info */}
          <Stack flex={1} spacing={0.4}>
            <Typography 
              variant="subtitle1" 
              fontWeight={600}
              color={isSelected ? 'primary.main' : 'text.primary'}
              sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
            >
              {method.name || method.label}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: { xs: '0.8rem', sm: '0.85rem' }
              }}
            >
              {method.description}
            </Typography>
          </Stack>
          
          {/* Selection Radio */}
          <Radio
            checked={isSelected}
            color="primary"
            sx={{ 
              '&.Mui-checked': {
                color: 'primary.main'
              }
            }}
          />
        </Stack>
        
        {/* Fees Information */}
        {method.fees && method.fees > 0 && (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 2, 
              borderRadius: 2,
              backgroundColor: 'info.light',
              '& .MuiAlert-message': {
                fontSize: '0.875rem'
              }
            }}
          >
            <Typography variant="body2">
              <strong>Comisión:</strong> {formatPrice(method.fees)}
            </Typography>
          </Alert>
        )}
        
        {/* Processing Time */}
        {method.processingTime && (
          <Box sx={{ mt: 1.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                backgroundColor: 'grey.100',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              ⏱️ {method.processingTime}
            </Typography>
          </Box>
        )}
        
        {/* Security Badge */}
        {method.secure && (
          <Box sx={{ mt: 1 }}>
            <Typography 
              variant="caption" 
              color="success.main"
              sx={{ 
                backgroundColor: 'success.light',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              🔒 Pago seguro
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default MobilePaymentCard;
