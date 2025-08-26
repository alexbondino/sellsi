import React from 'react';
import {
  Stack,
  IconButton,
  Typography,
  Box,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

const MobileCartHeader = ({ 
  itemCount, 
  onBack, 
  title = "Mi Carrito" 
}) => {
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      py: 1,
      px: 1
    }}>
      {/* Back button */}
      <Tooltip title="Volver" arrow>
        <IconButton 
          onClick={onBack}
          sx={{ 
            p: 1.5,
            backgroundColor: 'rgba(0,0,0,0.04)',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.08)'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>
      
      {/* Header info */}
      <Stack direction="row" alignItems="center" spacing={1} flex={1}>
        <CartIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Stack>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default MobileCartHeader;
