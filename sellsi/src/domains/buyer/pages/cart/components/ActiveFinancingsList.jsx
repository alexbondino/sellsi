import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Tooltip,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import { FixedSizeList } from 'react-window';
import { 
  getFinancingDaysStatus,
  calculateDaysRemaining 
} from '../../../../../shared/utils/financingDaysLogic';

/**
 * Componente de item individual de financiamiento
 */
const FinancingItem = ({ financing, style }) => {
  // Calcular métricas
  const availableBalance = financing.amount - financing.amount_used;
  const usagePercentage = (financing.amount_used / financing.amount) * 100;
  const balance = financing.amount_used - financing.amount_paid;
  
  // Calcular días restantes y estado
  const { daysRemaining, status } = getFinancingDaysStatus(
    financing.activated_at,
    financing.term_days
  );
  
  // Calcular fecha de expiración para mostrar
  const expiresAt = financing.expires_at 
    ? new Date(financing.expires_at)
    : null;
  
  const expiresFormatted = expiresAt
    ? expiresAt.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
    : '';
  
  // Determinar color según estado de días y uso
  const getBarColor = () => {
    // Prioridad 1: Si está expirado o casi expirado
    if (status === 'error') return 'error';
    if (status === 'warning') return 'warning';
    
    // Prioridad 2: Si está casi agotado (>90% usado)
    if (usagePercentage >= 90) return 'warning';
    
    // Normal
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
  
  // Contenido del tooltip
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
        {financing.supplier_name}
      </Typography>
      <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.3)' }} />
      <Typography variant="caption" display="block">
        Monto Total: {formatCurrency(financing.amount)}
      </Typography>
      <Typography variant="caption" display="block">
        Utilizado: {formatCurrency(financing.amount_used)} ({usagePercentage.toFixed(1)}%)
      </Typography>
      <Typography variant="caption" display="block">
        Disponible: {formatCurrency(availableBalance)}
      </Typography>
      {balance > 0 && (
        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
          Deuda: {formatCurrency(balance)}
        </Typography>
      )}
      <Divider sx={{ my: 0.5, borderColor: 'rgba(255,255,255,0.3)' }} />
      <Typography variant="caption" display="block">
        Vence: {expiresFormatted} ({daysRemaining} días)
      </Typography>
    </Box>
  );
  
  // Determinar color del chip según estado
  const getChipColor = () => {
    if (status === 'error') return 'error';
    if (status === 'warning') return 'warning';
    return 'primary';
  };
  
  return (
    <Box
      sx={{
        ...style,
        px: 1,
        py: 0.75,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: status === 'error' 
            ? 'error.light' 
            : status === 'warning'
            ? 'warning.light'
            : 'divider',
          backgroundColor: 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: 1,
            borderColor: barColor === 'error'
              ? 'error.main'
              : barColor === 'warning'
              ? 'warning.main'
              : '#2E52B2',
          },
        }}
      >
        {/* Fila 1: Nombre proveedor y plazo */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '60%',
            }}
          >
            {financing.supplier_name}
          </Typography>
          
          <Chip
            label={`${daysRemaining} días (${expiresFormatted})`}
            size="small"
            color={getChipColor()}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        </Box>
        
        {/* Fila 2: Barra de progreso con tooltip */}
        <Tooltip
          title={tooltipContent}
          arrow
          placement="top"
          enterDelay={200}
          leaveDelay={100}
        >
          <Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(usagePercentage, 100)}
              color={barColor}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 1,
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {formatCurrency(financing.amount_used)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {formatCurrency(financing.amount)}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
};

/**
 * Lista virtualizada de financiamientos activos
 * Muestra solo financiamientos de suppliers que tienen productos en el carrito
 */
const ActiveFinancingsList = ({ cartItems = [] }) => {
  // Real financiamientos: cargados desde el servicio (supabase)
  const [financings, setFinancings] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        // Import dinámico para soportar ESM/CJS y los mocks en tests
        const svc = await import('../../../../../workspaces/buyer/my-financing/services/financingService');
        const getAvailable = svc.getAvailableFinancingsForSupplier || (svc.default && svc.default.getAvailableFinancingsForSupplier);

        const supplierIdsInCart = Array.from(new Set(
          cartItems.map(item => item.supplier_id || item.supplierId).filter(Boolean)
        ));

        if (supplierIdsInCart.length === 0) {
          if (mounted) setFinancings([]);
          return;
        }

        const results = [];
        for (const sid of supplierIdsInCart) {
          try {
            if (!getAvailable) throw new Error('financingService.getAvailableFinancingsForSupplier not available');
            const list = await getAvailable(sid);
            if (Array.isArray(list)) {
              // Asegurarse de excluir pausados en UI
              results.push(...list.filter(f => !f.paused));
            }
          } catch (e) {
            console.error('[ActiveFinancingsList] failed to load financings for supplier', sid, e);
          }
        }

        if (mounted) setFinancings(results);
      } catch (err) {
        console.error('[ActiveFinancingsList] failed to import financingService', err);
        if (mounted) setFinancings([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [cartItems]);

  // Si está cargando, mostrar indicador de carga
  if (isLoading) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'text.secondary',
            mb: 1,
            px: 1,
          }}
        >
          Cargando financiamientos...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  // Si no hay financiamientos y no está cargando, no renderizar nada
  if (financings.length === 0) return null;

  // Configuración de la lista virtualizada
  const ITEM_HEIGHT = 95; // Altura calculada para que quepan 3 items sin scroll
  const MAX_VISIBLE_ITEMS = 3;
  const LIST_HEIGHT = Math.min(financings.length, MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;

  // Row renderer para react-window
  const Row = ({ index, style }) => {
    const financing = financings[index];
    return <FinancingItem financing={financing} style={style} />;
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          fontSize: '0.85rem',
          color: 'text.secondary',
          mb: 1,
          px: 1,
        }}
      >
        Financiamientos Activos ({financings.length}) - Solo del carrito
      </Typography>

      <FixedSizeList
        height={LIST_HEIGHT}
        itemCount={financings.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
        overscanCount={1}
        style={{
          overflowX: 'hidden',
        }}
      >
        {Row}
      </FixedSizeList>
    </Box>
  );
};

export default ActiveFinancingsList;
