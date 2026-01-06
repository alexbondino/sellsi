// ============================================================================
// PAYMENT METHOD CARD - COMPONENTE REUTILIZABLE PARA MÉTODOS DE PAGO
// ============================================================================

import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Stack,
  Box,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import {
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  RadioButtonChecked as RadioButtonCheckedIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const PaymentMethodCard = ({
  method,
  isSelected = false,
  onSelect,
  fees = { total: 0 },
  formatPrice,
  disabled = false,
  baseTotal = 0, // Nuevo prop para calcular el total con comisión
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(method.id);
    }
  };

  // Calcular el total incluyendo comisión
  const calculateTotalWithFees = () => {
    if (!baseTotal) return 0;

    let feeAmount = 0;
    if (method.fees?.percentage > 0) {
      feeAmount = baseTotal * (method.fees.percentage / 100);
    } else if (method.fees?.fixed > 0) {
      feeAmount = method.fees.fixed;
    }

    return baseTotal + feeAmount;
  };

  const totalWithFees = calculateTotalWithFees();

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          border: isSelected ? '2px solid #2E52B2' : '1px solid #e0e0e0',
          borderRadius: 2,
          boxShadow: isSelected
            ? '0 4px 20px rgba(25, 118, 210, 0.3)'
            : '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          '&:hover': !disabled
            ? {
                boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                transform: 'translateY(-2px)',
              }
            : {},
          background: isSelected ? alpha('#2E52B2', 0.05) : 'background.paper',
        }}
      >
        <CardActionArea
          onClick={handleClick}
          disabled={disabled}
          sx={{
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Radio button */}
              <Box>
                {isSelected ? (
                  <RadioButtonCheckedIcon
                    color="primary"
                    sx={{ fontSize: 24 }}
                  />
                ) : (
                  <RadioButtonUncheckedIcon
                    color="action"
                    sx={{ fontSize: 24 }}
                  />
                )}
              </Box>

              {/* Icono del método */}
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: disabled ? 'grayscale(100%)' : 'none',
                }}
              >
                {method.icon === 'AccountBalance' ? (
                  <AccountBalanceIcon
                    sx={{
                      fontSize: 48,
                      color: disabled ? 'action.disabled' : 'primary.main',
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={method.icon}
                    alt={method.name}
                    sx={{
                      width: 48,
                      height: 48,
                      objectFit: 'contain',
                    }}
                  />
                )}
              </Box>

              {/* Información del método */}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={disabled ? 'text.disabled' : 'text.primary'}
                >
                  {method.name}
                </Typography>
                <Typography
                  variant="body2"
                  color={disabled ? 'text.disabled' : 'text.secondary'}
                >
                  {method.description}
                </Typography>
              </Box>

              {/* Precio total a pagar */}
              {baseTotal > 0 && formatPrice && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minWidth: 120,
                    mr: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Total a pagar
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={isSelected ? 'primary.main' : 'text.primary'}
                    sx={{
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {formatPrice(totalWithFees)}
                  </Typography>
                  {method.fees?.percentage > 0 || method.fees?.fixed > 0 ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      (incluye comisión)
                    </Typography>
                  ) : null}
                </Box>
              )}

              {/* Badges de características */}
              <Stack direction="column" spacing={1} alignItems="flex-end">
                {method.security?.verified && (
                  <Chip
                    icon={<SecurityIcon sx={{ fontSize: 16 }} />}
                    label="Seguro"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: 12 }}
                  />
                )}
                {method.processingTime && (
                  <Chip
                    icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                    label={method.processingTime}
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ fontSize: 12 }}
                  />
                )}
              </Stack>
            </Stack>

            {/* Información adicional cuando está seleccionado */}
            {isSelected && (
              <Box
                sx={{
                  mt: 2,
                  pt: 2,
                  borderTop: '1px solid #e0e0e0',
                  backgroundColor: alpha('#2E52B2', 0.05),
                  borderRadius: 1,
                  mx: -1,
                  px: 1,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    {/* Flow: mostrar porcentaje, Khipu: mostrar monto fijo */}
                    {method.fees?.percentage > 0
                      ? `Comisión: ${method.fees.percentage}%`
                      : method.fees?.fixed > 0 && formatPrice
                      ? `Comisión: ${formatPrice(method.fees.fixed)}`
                      : 'Sin comisión adicional'}
                  </Typography>
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                </Stack>

                {/* Información de límites */}
                {method.minAmount && method.maxAmount && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    Límites:{' '}
                    {formatPrice
                      ? formatPrice(method.minAmount)
                      : method.minAmount}{' '}
                    -{' '}
                    {formatPrice
                      ? formatPrice(method.maxAmount)
                      : method.maxAmount}
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

export default PaymentMethodCard;
