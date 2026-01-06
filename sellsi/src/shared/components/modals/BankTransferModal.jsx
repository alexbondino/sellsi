// ============================================================================
// BANK TRANSFER MODAL - MODAL PARA MOSTRAR DATOS DE TRANSFERENCIA BANCARIA
// ============================================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const BankTransferModal = ({
  open,
  onClose,
  onConfirm,
  bankDetails,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [copiedField, setCopiedField] = useState(null);

  useBodyScrollLock(open);

  // Handler para copiar al portapapeles
  const handleCopy = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copiado al portapapeles`);
      
      // Reset del ícono después de 2 segundos
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
      console.error('Error copying to clipboard:', error);
    }
  };

  const BankDataField = ({ label, value, copyable = true, fieldName }) => (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        backgroundColor: 'grey.50',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'grey.200',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', mb: 0.25 }}
          >
            {label}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
          >
            {value}
          </Typography>
        </Box>
        {copyable && (
          <Tooltip title={copiedField === fieldName ? '¡Copiado!' : 'Copiar'}>
            <IconButton
              onClick={() => handleCopy(value, fieldName)}
              size="small"
              sx={{
                ml: 1,
                color: copiedField === fieldName ? 'success.main' : 'primary.main',
                '&:hover': {
                  backgroundColor: copiedField === fieldName
                    ? 'success.lighter'
                    : 'primary.lighter',
                },
              }}
            >
              {copiedField === fieldName ? (
                <CheckCircleIcon fontSize="small" />
              ) : (
                <ContentCopyIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );

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
          position: 'relative',
          textAlign: 'center',
          pb: 1.5,
          pt: 2.5,
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'grey.500',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* Icono principal */}
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            backgroundColor: 'primary.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          <AccountBalanceIcon
            sx={{
              fontSize: 32,
              color: 'primary.main',
            }}
          />
        </Box>

        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: '1.15rem' }}>
          Datos de Transferencia Bancaria
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
          Realiza la transferencia a los siguientes datos
        </Typography>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ px: 2.5, py: 2 }}>
        <Stack spacing={1.5}>
          <BankDataField
            label="Banco"
            value={bankDetails.bank}
            copyable={false}
            fieldName="Banco"
          />
          
          <BankDataField
            label="Tipo de Cuenta"
            value={bankDetails.accountType}
            copyable={false}
            fieldName="Tipo de Cuenta"
          />
          
          <BankDataField
            label="Número de Cuenta"
            value={bankDetails.accountNumber}
            fieldName="Número de Cuenta"
          />
          
          <BankDataField
            label="Nombre"
            value={bankDetails.accountName}
            fieldName="Nombre"
          />
          
          <BankDataField
            label="RUT"
            value={bankDetails.rut}
            fieldName="RUT"
          />
        </Stack>

        {/* Información adicional */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            backgroundColor: 'info.lighter',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'info.light',
          }}
        >
          <Typography variant="body2" color="info.dark" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
            ℹ️ <strong>Importante:</strong> Una vez realices la transferencia, haz clic en "Confirmar" para que tu pedido pase a estado de procesando. Sellsi verificará el pago en un plazo máximo de 24 horas.
          </Typography>
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ justifyContent: 'center', gap: 1.5, p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            minWidth: 110,
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
          sx={{
            minWidth: 110,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BankTransferModal;
