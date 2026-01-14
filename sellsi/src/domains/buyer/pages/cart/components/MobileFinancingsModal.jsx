import React, { useMemo } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Divider,
  Stack,
  Paper,
  Slide,
} from '@mui/material';
import { Close as CloseIcon, Info as InfoIcon } from '@mui/icons-material';
import { FixedSizeList } from 'react-window';
import { 
  getFinancingDaysStatus,
} from '../../../../../shared/utils/financingDaysLogic';

// Transición de slide desde abajo
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Item individual de financiamiento para mobile
 */
const MobileFinancingItem = ({ financing, style }) => {
  // Calcular métricas
  const availableBalance = financing.amount - financing.amount_used;
  const usagePercentage = (financing.amount_used / financing.amount) * 100;
  const balance = financing.amount_used - financing.amount_paid;
  
  // Calcular días restantes y estado
  const { daysRemaining, status } = getFinancingDaysStatus(
    financing.activated_at,
    financing.term_days
  );
  
  // Calcular fecha de expiración
  const expiresAt = financing.expires_at 
    ? new Date(financing.expires_at)
    : null;
  
  const expiresFormatted = expiresAt
    ? expiresAt.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    : '';
  
  // Determinar color según estado de días y uso
  const getBarColor = () => {
    if (status === 'error') return 'error';
    if (status === 'warning') return 'warning';
    if (usagePercentage >= 90) return 'warning';
    return 'primary';
  };
  
  const barColor = getBarColor();
  
  // Formatear montos
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Determinar color del chip
  const getChipColor = () => {
    if (status === 'error') return 'error';
    if (status === 'warning') return 'warning';
    return 'primary';
  };
  
  return (
    <Box
      sx={{
        ...style,
        px: 2,
        py: 1,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: status === 'error' 
            ? 'error.light' 
            : status === 'warning'
            ? 'warning.light'
            : 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Fila 1: Nombre proveedor */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'text.primary',
            }}
          >
            {financing.supplier_name}
          </Typography>
        </Box>
        
        {/* Fila 2: Chip con días restantes */}
        <Box sx={{ mb: 1.5 }}>
          <Chip
            label={`${daysRemaining} días restantes (${expiresFormatted})`}
            size="medium"
            color={getChipColor()}
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          />
        </Box>
        
        {/* Fila 3: Barra de progreso */}
        <Box sx={{ mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(usagePercentage, 100)}
            color={barColor}
            sx={{
              height: 10,
              borderRadius: 1,
              backgroundColor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
              },
            }}
          />
        </Box>
        
        {/* Fila 4: Montos */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Utilizado: {formatCurrency(financing.amount_used)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Total: {formatCurrency(financing.amount)}
          </Typography>
        </Box>
        
        {/* Divider */}
        <Divider sx={{ my: 1 }} />
        
        {/* Información detallada */}
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Disponible:
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {formatCurrency(availableBalance)}
            </Typography>
          </Box>
          
          {balance > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Deuda pendiente:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="text.primary">
                {formatCurrency(balance)}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Uso:
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {usagePercentage.toFixed(1)}%
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

/**
 * Modal fullscreen de financiamientos disponibles para mobile
 */
const MobileFinancingsModal = ({ open, onClose, cartItems = [] }) => {
  // Mock data - igual que desktop pero todos los financiamientos
  const mockFinancings = useMemo(() => {
    const supplierIdsInCart = new Set(
      cartItems.map(item => item.supplier_id || item.supplierId).filter(Boolean)
    );
    
    if (supplierIdsInCart.size === 0) return [];
    
    const firstSupplierId = Array.from(supplierIdsInCart)[0];
    const firstSupplierName = cartItems.find(item => 
      (item.supplier_id || item.supplierId) === firstSupplierId
    )?.proveedor || 'Proveedor Principal';
    
    const allMockFinancings = [
      {
        id: 'mock-1',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 800000,
        amount_used: 200000,
        amount_paid: 50000,
        term_days: 45,
        activated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved_by_sellsi',
      },
      {
        id: 'mock-2',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 500000,
        amount_used: 150000,
        amount_paid: 50000,
        term_days: 30,
        activated_at: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved_by_sellsi',
      },
      {
        id: 'mock-3',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 300000,
        amount_used: 280000,
        amount_paid: 100000,
        term_days: 15,
        activated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved_by_sellsi',
      },
      {
        id: 'mock-4',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 200000,
        amount_used: 80000,
        amount_paid: 30000,
        term_days: 7,
        activated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved_by_sellsi',
      },
      {
        id: 'mock-5',
        supplier_id: firstSupplierId,
        supplier_name: firstSupplierName,
        amount: 1500000,
        amount_used: 600000,
        amount_paid: 200000,
        term_days: 60,
        activated_at: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved_by_sellsi',
      },
    ];
    
    return allMockFinancings.filter(f => 
      supplierIdsInCart.has(f.supplier_id)
    );
  }, [cartItems]);
  
  // Configuración de lista virtualizada para mobile
  const ITEM_HEIGHT = 280; // Mayor altura para mobile (más información visible)
  const LIST_HEIGHT = window.innerHeight - 180; // Restar AppBar + padding
  
  // Row renderer
  const Row = ({ index, style }) => {
    const financing = mockFinancings[index];
    return <MobileFinancingItem financing={financing} style={style} />;
  };
  
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{
        zIndex: 1600,
      }}
      PaperProps={{
        sx: {
          zIndex: 1600,
        },
      }}
    >
      {/* AppBar superior */}
      <AppBar sx={{ position: 'relative', backgroundColor: '#2E52B2' }}>
        <Toolbar sx={{ position: 'relative', justifyContent: 'center' }}>
          <Typography sx={{ fontWeight: 600 }} variant="h6" component="div">
            Financiamientos Disponibles
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: { xs: 8, sm: 16 },
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#fff',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              p: { xs: 0.75, sm: 1 },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
            aria-label="cerrar"
          >
            <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Contenido */}
      <Box sx={{ flex: 1, backgroundColor: 'background.default' }}>
        {/* Mensaje informativo */}
        <Box
          sx={{
            backgroundColor: 'info.lighter',
            borderLeft: '4px solid',
            borderColor: 'info.main',
            p: 2,
            mx: 2,
            my: 2,
            borderRadius: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <InfoIcon color="info" sx={{ mt: 0.25, fontSize: '1.2rem' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Financiamientos activos en este carrito
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Solo se muestran financiamientos de proveedores con productos en tu carrito actual.
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        {/* Lista virtualizada */}
        {mockFinancings.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh',
              px: 4,
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No hay financiamientos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              No tienes financiamientos activos de los proveedores en tu carrito.
            </Typography>
          </Box>
        ) : (
          <FixedSizeList
            height={LIST_HEIGHT}
            itemCount={mockFinancings.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            overscanCount={2}
          >
            {Row}
          </FixedSizeList>
        )}
      </Box>
    </Dialog>
  );
};

export default MobileFinancingsModal;
