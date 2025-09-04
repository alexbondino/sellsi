import React from 'react';
import {
  Stack,
  IconButton,
  Typography,
  Box,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';

const MobilePaymentHeader = ({ 
  onBack, 
  currentStep = 2, // Puede venir como número, string (id) u objeto { id, name, order, ... }
  totalSteps = 3,
  title = "Método de Pago" 
}) => {
  // Normalizar currentStep para asegurar que siempre sea un número y un label seguro
  let stepNumber;
  if (typeof currentStep === 'object' && currentStep !== null) {
    // Tomar order si existe, sino intentar mapear id conocido
    stepNumber = Number(currentStep.order) || 0;
  } else if (typeof currentStep === 'string') {
    // Mapear ids conocidos a orden (fallback defensivo)
    const idOrderMap = {
      cart: 1,
      payment_method: 2,
      confirmation: 3,
      processing: 4,
      success: 5
    };
    stepNumber = idOrderMap[currentStep] || 0;
  } else {
    stepNumber = Number(currentStep) || 0;
  }

  // Clamp y fallback de totalSteps
  const safeTotal = Math.max(1, Number(totalSteps) || 1);
  if (stepNumber > safeTotal) {
    // Si llega un paso fuera de rango, ajustamos para no romper la barra
    stepNumber = safeTotal;
  }

  const progress = (stepNumber / safeTotal) * 100;

  return (
    <Box>
      {/* Header principal */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        py: 0.5,
        px: 0,
        mb: 1.1
      }}>
        {/* Back button */}
        <Tooltip title="Volver al carrito" arrow>
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
          <CreditCardIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Stack>
            <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Paso {stepNumber} de {safeTotal}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      
      {/* Progress bar */}
  <Box sx={{ px: 0.35, mb: 0.8 }}>
        <LinearProgress 
          variant="determinate" 
          value={Number.isFinite(progress) ? progress : 0}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundColor: 'primary.main'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default MobilePaymentHeader;
