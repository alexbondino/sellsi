// ============================================================================
// BANK TRANSFER CONFIRM MODAL - MODAL DE CONFIRMACIÓN FINAL DE TRANSFERENCIA
// ============================================================================

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const BankTransferConfirmModal = ({
  open,
  onClose,
  onBack,
  onConfirm,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useBodyScrollLock(open);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableScrollLock={true}
      disableRestoreFocus={true}
      sx={{ zIndex: 1600 }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          textAlign: 'center',
          pb: 2,
          pt: 4,
        }}
      >
        {/* Icono de advertencia */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'warning.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <WarningAmberIcon
            sx={{
              fontSize: 50,
              color: 'warning.main',
            }}
          />
        </Box>

        <Typography variant="h5" fontWeight="bold" color="text.primary">
          ¿Estás seguro que realizaste la transferencia bancaria?
        </Typography>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 4, py: 2 }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            lineHeight: 1.8,
          }}
        >
          En caso de ser así, confirma para continuar. Una vez hagas esto, tu pedido pasará al estado de <strong>procesando</strong> y Sellsi tardará hasta <strong>24 horas</strong> en confirmar el pago.
        </Typography>

        <Box
          sx={{
            mt: 3,
            p: 2.5,
            backgroundColor: 'grey.50',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            💡 Recibirás una notificación cuando tu pago sea confirmado. Puedes revisar el estado de tu pedido en cualquier momento desde <strong>"Mis Pedidos"</strong>.
          </Typography>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ justifyContent: 'center', gap: 2.5, p: 3 }}>
        <Button
          onClick={onBack}
          variant="outlined"
          size="large"
          sx={{
            minWidth: 140,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Volver
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="success"
          size="large"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            minWidth: 140,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {loading ? 'Procesando...' : 'Confirmo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankTransferConfirmModal;
