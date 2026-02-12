/**
 * ============================================================================
 * PAYMENT HISTORY MODAL (SHARED)
 * ============================================================================
 * 
 * Modal compartido para ver historial de pagos de deuda de financiamiento.
 * Muestra todos los pagos realizados con su estado (exitoso, en proceso, rechazado).
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  MODAL_DIALOG_ACTIONS_STYLES,
  MODAL_DIALOG_CONTENT_STYLES,
  MODAL_SUBMIT_BUTTON_STYLES,
} from '../feedback/Modal/Modal';
import { formatPrice } from '../../utils/formatters/priceFormatters';
import { useFinancingPaymentHistory } from '../../../workspaces/buyer/my-financing/hooks/useFinancingPaymentHistory';

/**
 * Obtener configuración de chip según estado de pago
 */
const getPaymentStatusChip = (status) => {
  const configs = {
    paid: {
      label: 'Exitoso',
      color: 'success',
      icon: <CheckCircleIcon fontSize="small" />,
    },
    pending: {
      label: 'En Proceso',
      color: 'warning',
      icon: <PendingIcon fontSize="small" />,
    },
    failed: {
      label: 'Rechazado',
      color: 'error',
      icon: <ErrorIcon fontSize="small" />,
    },
    expired: {
      label: 'Expirado',
      color: 'default',
      icon: <AccessTimeIcon fontSize="small" />,
    },
    refunded: {
      label: 'Reembolsado',
      color: 'info',
      icon: <CancelIcon fontSize="small" />,
    },
  };

  return configs[status] || configs.pending;
};

/**
 * Obtener nombre de método de pago
 */
const getPaymentMethodName = (method) => {
  const methods = {
    khipu: 'Khipu',
    flow: 'Flow',
    bank_transfer: 'Transferencia Bancaria',
  };
  return methods[method] || method;
};

/**
 * Formatear fecha
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Vista mobile de historial de pagos
 */
const MobilePaymentHistory = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No hay pagos registrados para este financiamiento.
      </Alert>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {payments.map((payment) => {
        const chipConfig = getPaymentStatusChip(payment.payment_status);
        return (
          <Box
            key={payment.id}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {formatPrice(payment.amount)}
              </Typography>
              <Chip
                label={chipConfig.label}
                color={chipConfig.color}
                size="small"
                icon={chipConfig.icon}
                sx={{ fontWeight: 600 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Método:</strong> {getPaymentMethodName(payment.payment_method)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Fecha:</strong> {formatDate(payment.created_at)}
            </Typography>
            {payment.paid_at && (
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Pagado:</strong> {formatDate(payment.paid_at)}
              </Typography>
            )}
            {payment.khipu_transaction_id && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-all' }}>
                <strong>ID Khipu:</strong> {payment.khipu_transaction_id}
              </Typography>
            )}
            {payment.flow_order && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ wordBreak: 'break-all' }}>
                <strong>Orden Flow:</strong> {payment.flow_order}
              </Typography>
            )}
          </Box>
        );
      })}
    </Stack>
  );
};

/**
 * Vista desktop de historial de pagos
 */
const DesktopPaymentHistory = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No hay pagos registrados para este financiamiento.
      </Alert>
    );
  }

  return (
    <Table size="small" sx={{ mt: 2 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Método</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>ID Transacción</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((payment) => {
          const chipConfig = getPaymentStatusChip(payment.payment_status);
          const transactionId = payment.khipu_transaction_id || payment.flow_order || '-';
          
          return (
            <TableRow key={payment.id} hover>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(payment.created_at)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {formatPrice(payment.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {getPaymentMethodName(payment.payment_method)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={chipConfig.label}
                  color={chipConfig.color}
                  size="small"
                  icon={chipConfig.icon}
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                  {transactionId}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/**
 * Modal principal de historial de pagos
 */
const PaymentHistoryModal = ({ open, financing, onClose, onExited }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  useBodyScrollLock(open);

  const { payments, loading, error } = useFinancingPaymentHistory(financing?.id, open);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionProps={{ onExited }}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: { borderRadius: isMobile ? 0 : 2 },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center',
          textAlign: 'center',
          backgroundColor: '#2E52B2',
          color: '#fff',
          py: { xs: 2, sm: 2 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          fontSize: { xs: '1.125rem', sm: '1.25rem' },
        }}
      >
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
        >
          <CloseIcon sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
        </IconButton>
        <HistoryIcon sx={{ color: '#fff' }} fontSize="small" />
        Historial de Pagos
      </DialogTitle>
      <DialogContent dividers sx={MODAL_DIALOG_CONTENT_STYLES}>
        {financing && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Proveedor:</strong> {financing.supplier_name}
            </Typography>
            <Typography variant="body2">
              <strong>Monto del Crédito:</strong> {formatPrice(financing.amount || 0)}
            </Typography>
            <Typography variant="body2">
              <strong>Monto Utilizado:</strong> {formatPrice(financing.amount_used || 0)}
            </Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          isMobile ? (
            <MobilePaymentHistory payments={payments} />
          ) : (
            <DesktopPaymentHistory payments={payments} />
          )
        )}
      </DialogContent>
      <DialogActions sx={MODAL_DIALOG_ACTIONS_STYLES}>
        <Button onClick={onClose} variant="contained" sx={MODAL_SUBMIT_BUTTON_STYLES}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentHistoryModal;
