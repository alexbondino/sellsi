/**
 * ============================================================================
 * FINANCING SUMMARY VIEW
 * ============================================================================
 * 
 * Componente especializado para mostrar el resumen de pago de financiamiento.
 * Reemplaza la vista de productos del carrito con detalles del crédito.
 */

import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import { formatPrice } from '../../../shared/utils/formatters/priceFormatters';
import { SecurityBadge } from '../../../shared/components/feedback';

/**
 * Calcula el total final incluyendo fee del método de pago
 */
const calculateTotalWithFee = (baseAmount, selectedMethod) => {
  let fee = 0;
  
  if (selectedMethod) {
    if (selectedMethod.id === 'khipu') {
      fee = 500; // Comisión fija Khipu
    } else if (selectedMethod.id === 'flow') {
      fee = Math.round(baseAmount * 0.038); // 3.8% Flow
    } else if (selectedMethod.id === 'bank_transfer') {
      fee = Math.round(baseAmount * 0.005); // 0.5% Transferencia Bancaria
    }
  }
  
  return baseAmount + fee;
};

/**
 * Obtiene el label de la comisión según el método
 */
const getPaymentFeeLabel = (selectedMethod) => {
  if (!selectedMethod) return '';
  
  if (selectedMethod.id === 'khipu') return 'Comisión Khipu';
  if (selectedMethod.id === 'flow') return 'Comisión Flow (3.8%)';
  if (selectedMethod.id === 'bank_transfer') return 'Comisión Servicio (0.5%)';
  
  return '';
};

/**
 * Calcula solo el fee
 */
const calculatePaymentFee = (baseAmount, selectedMethod) => {
  if (!selectedMethod) return 0;
  
  if (selectedMethod.id === 'khipu') return 500;
  if (selectedMethod.id === 'flow') return Math.round(baseAmount * 0.038);
  if (selectedMethod.id === 'bank_transfer') return Math.round(baseAmount * 0.005);
  
  return 0;
};

const FinancingSummaryView = ({
  data,
  orderData,
  selectedMethod,
  onContinue,
  onBack,
  isProcessing = false,
  canContinue = false,
}) => {
  // Estado local para bloquear el botón después del primer click
  const [localProcessing, setLocalProcessing] = React.useState(false);

  // Sincronizar localProcessing con isProcessing
  React.useEffect(() => {
    if (!isProcessing) {
      setLocalProcessing(false);
    }
  }, [isProcessing]);

  // Cálculos de pago
  const paymentFee = useMemo(
    () => calculatePaymentFee(data.amountUsed, selectedMethod),
    [data.amountUsed, selectedMethod]
  );

  const totalWithFee = useMemo(
    () => calculateTotalWithFee(data.amountUsed, selectedMethod),
    [data.amountUsed, selectedMethod]
  );

  const feeLabel = useMemo(
    () => getPaymentFeeLabel(selectedMethod),
    [selectedMethod]
  );

  // Determinar color de días vigentes
  const getDaysColor = () => {
    if (data.daysStatus === 'success') return 'success.main';
    if (data.daysStatus === 'warning') return 'warning.main';
    return 'error.main';
  };

  // Handler del botón de continuar
  const handleContinue = () => {
    setLocalProcessing(true);
    if (typeof onContinue === 'function') onContinue();
  };

  // Deshabilitar botón si está procesando o no se puede continuar
  const isButtonDisabled = isProcessing || localProcessing || !canContinue;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
        border: '1px solid rgba(102, 126, 234, 0.08)',
        position: 'sticky',
        top: 100,
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Pago de Línea de Crédito
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Financiamiento aprobado por Sellsi
          </Typography>
        </Box>

        <Divider />

        {/* Información del Crédito */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Información del Crédito
          </Typography>

          <Stack spacing={2} sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            {/* Proveedor */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Proveedor:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {data.supplierName}
              </Typography>
            </Box>

            {/* Monto Otorgado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Monto Otorgado:
                </Typography>
              </Box>
              <Typography variant="body2">
                {formatPrice(data.amountGranted)}
              </Typography>
            </Box>

            {/* Monto Utilizado (a pagar) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PaymentIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Monto Utilizado:
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {formatPrice(data.amountUsed)}
              </Typography>
            </Box>

            <Divider />

            {/* Plazo */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Plazo Otorgado:
                </Typography>
              </Box>
              <Typography variant="body2">
                {data.termDays} días
              </Typography>
            </Box>

            {/* Días Vigentes */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Días de Vigencia:
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight={600}
                sx={{ color: getDaysColor() }}
              >
                {data.daysRemaining} días
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider />

        {/* Desglose de Pago */}
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Desglose del Pago
          </Typography>

          <Stack spacing={1.5}>
            {/* Monto a Pagar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Monto a Pagar:
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatPrice(data.amountUsed)}
              </Typography>
            </Box>

            {/* Comisión del método de pago */}
            {selectedMethod && paymentFee > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {feeLabel}:
                </Typography>
                <Typography variant="body2">
                  {formatPrice(paymentFee)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Total Final */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight="bold">
                Total a Pagar:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {formatPrice(totalWithFee)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Security Badge */}
        <SecurityBadge />

        {/* Botón de Pago */}
        <Button
          variant="contained"
          size="large"
          onClick={handleContinue}
          disabled={isButtonDisabled}
          fullWidth
          startIcon={
            isProcessing || localProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <PaymentIcon />
            )
          }
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          {isProcessing || localProcessing
            ? 'Procesando...'
            : !selectedMethod
            ? 'Selecciona un método de pago'
            : 'Proceder al Pago'}
        </Button>

        {/* Botón Volver (opcional) */}
        {onBack && (
          <Button
            variant="text"
            size="medium"
            onClick={onBack}
            disabled={isProcessing || localProcessing}
            fullWidth
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
            }}
          >
            Volver
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default FinancingSummaryView;
